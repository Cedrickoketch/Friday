from django.urls import path
from .views import CreateCheckoutSessionView, CancelSubscriptionView, PaystackWebhookView

urlpatterns = [
    path("checkout/", CreateCheckoutSessionView.as_view(), name="checkout"),
    path("cancel/", CancelSubscriptionView.as_view(), name="cancel"),
    path("webhook/", PaystackWebhookView.as_view(), name="paystack-webhook"),
]
