import hashlib
import hmac
import json

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


def _paystack_headers():
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


class CreateCheckoutSessionView(APIView):
    def post(self, request):
        tier = request.data.get("tier")
        if tier not in TIER_PLAN_MAP:
            return Response({"error": "Invalid tier."}, status=400)

        plan_code = TIER_PLAN_MAP[tier]
        user = request.user

        # Paystack doesn't require a customer to be pre-created - a transaction
        # initialize call creates/reuses the customer by email automatically.
        payload = {
            "email": user.email,
            "plan": plan_code,
            "callback_url": f"{settings.FRONTEND_URL}/dashboard?upgrade=success",
            "metadata": {"user_id": str(user.id), "tier": tier},
        }
        resp = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=payload,
            headers=_paystack_headers(),
        )
        data = resp.json()
        if not resp.ok or not data.get("status"):
            return Response(
                {"error": data.get("message", "Could not start checkout.")}, status=400
            )

        return Response({"checkout_url": data["data"]["authorization_url"]})


class CancelSubscriptionView(APIView):
    """
    Paystack has no hosted billing-portal equivalent to Stripe's, so instead of
    redirecting the user to a provider-hosted page, we call the Subscription
    Disable endpoint directly. This replaces the old CustomerPortalView.
    """

    def post(self, request):
        user = request.user
        if not user.paystack_subscription_code or not user.paystack_email_token:
            return Response({"error": "No subscription found."}, status=400)

        payload = {
            "code": user.paystack_subscription_code,
            "token": user.paystack_email_token,
        }
        resp = requests.post(
            f"{PAYSTACK_BASE_URL}/subscription/disable",
            json=payload,
            headers=_paystack_headers(),
        )
        data = resp.json()
        if not resp.ok or not data.get("status"):
            return Response(
                {"error": data.get("message", "Could not cancel subscription.")}, status=400
            )

        return Response({"status": "ok"})


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        signature = request.META.get("HTTP_X_PAYSTACK_SIGNATURE", "")

        # Paystack signs webhooks with HMAC-SHA512 of the raw body, using your
        # secret key - there's no separate webhook signing secret like Stripe's.
        expected_signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode("utf-8"), payload, hashlib.sha512
        ).hexdigest()
        if not signature or not hmac.compare_digest(expected_signature, signature):
            return Response(status=400)

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
            # Fired once the recurring subscription itself is created. We stash
            # the subscription_code + email_token here since both are required
            # to call subscription/disable later on.
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

        return Response({"status": "ok"})
