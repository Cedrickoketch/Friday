import json
import hmac
import hashlib
import requests
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.accounts.models import User

PAYSTACK_BASE_URL = "https://api.paystack.co"

TIER_PLAN_MAP = {
    "pro": settings.PAYSTACK_PLAN_CODE_PRO,
    "premium": settings.PAYSTACK_PLAN_CODE_PREMIUM,
}

TIER_AMOUNT_MAP = {
    "pro": 65000,
    "premium": 130000,
}

def _paystack_headers():
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }

class CreateCheckoutSessionView(APIView):
    def post(self, request):
        tier = request.data.get("tier")
        if tier not in TIER_PLAN_MAP:
            return Response({"error": "Invalid tier."}, status=status.HTTP_400_BAD_REQUEST)

        plan_code = TIER_PLAN_MAP[tier]
        fallback_amount = TIER_AMOUNT_MAP[tier]
        user = request.user

        payload = {
            "email": user.email,
            "amount": fallback_amount,
            "plan": plan_code,
            "callback_url": f"{settings.FRONTEND_URL}/dashboard?upgrade=success&tier={tier}",
            "metadata": {"user_id": str(user.id), "tier": tier},
        }
        
        # Using consistent 'response' naming to avoid NameErrors below
        response = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=payload,
            headers=_paystack_headers(),
        )
        
        data = response.json()
        
        # Check if the HTTP status is successful AND Paystack's internal status is true
        if response.status_code == 200 and data.get("status"):
            return Response({"checkout_url": data["data"]["authorization_url"]})

        # Debugging log block if Paystack setup fails
        print(f"❌ PAYSTACK ERROR STATUS: {response.status_code}")
        print(f"❌ PAYSTACK ERROR BODY: {response.text}")

        return Response(
            {"error": data.get("message", "Payment initialization failed."), "details": data}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class CancelSubscriptionView(APIView):
    def post(self, request):
        user = request.user
        if not user.paystack_subscription_code or not user.paystack_email_token:
            return Response({"error": "No subscription found."}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "code": user.paystack_subscription_code,
            "token": user.paystack_email_token,
        }
        response = requests.post(
            f"{PAYSTACK_BASE_URL}/subscription/disable",
            json=payload,
            headers=_paystack_headers(),
        )
        data = response.json()
        if not response.ok or not data.get("status"):
            return Response(
                {"error": data.get("message", "Could not cancel subscription.")}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"status": "ok"})


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        signature = request.META.get("HTTP_X_PAYSTACK_SIGNATURE", "")

        # Now functions perfectly because hmac & hashlib are explicitly imported
        expected_signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode("utf-8"), payload, hashlib.sha512
        ).hexdigest()
        
        if not signature or not hmac.compare_digest(expected_signature, signature):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event = json.loads(payload)
        event_type = event.get("event")
        data = event.get("data", {})

        if event_type == "charge.success":
            metadata = data.get("metadata") or {}
            user_id = metadata.get("user_id")
            tier = metadata.get("tier")
            customer_code = (data.get("customer") or {}).get("customer_code")
            if user_id and tier:
                update_fields = {"tier": tier}
                if customer_code:
                    update_fields["paystack_customer_code"] = customer_code
                User.objects.filter(id=user_id).update(**update_fields)

        elif event_type == "subscription.create":
            customer_code = (data.get("customer") or {}).get("customer_code")
            subscription_code = data.get("subscription_code")
            email_token = data.get("email_token")
            if customer_code:
                User.objects.filter(paystack_customer_code=customer_code).update(
                    paystack_subscription_code=subscription_code or "",
                    paystack_email_token=email_token or "",
                )

        elif event_type in ("subscription.disable", "subscription.not_renew"):
            customer_code = (data.get("customer") or {}).get("customer_code")
            if customer_code:
                User.objects.filter(paystack_customer_code=customer_code).update(
                    tier=User.TIER_FREE
                )

        return Response({"status": "ok"}, status=status.HTTP_200_OK)