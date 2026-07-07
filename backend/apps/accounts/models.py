from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user with tier and Google OAuth fields."""

    TIER_FREE = "free"
    TIER_PRO = "pro"
    TIER_PREMIUM = "premium"
    TIER_CHOICES = [
        (TIER_FREE, "Free"),
        (TIER_PRO, "Pro"),
        (TIER_PREMIUM, "Premium"),
    ]

    email = models.EmailField(unique=True)
    avatar = models.URLField(blank=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_FREE)
    paystack_customer_code = models.CharField(max_length=100, blank=True)
    paystack_subscription_code = models.CharField(max_length=100, blank=True)
    paystack_email_token = models.CharField(max_length=100, blank=True)
    google_refresh_token = models.TextField(blank=True)  # for Calendar API
    daily_message_count = models.PositiveIntegerField(default=0)
    last_message_date = models.DateField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    @property
    def can_send_message(self):
        from django.utils import timezone
        today = timezone.now().date()
        if self.last_message_date != today:
            return True  # new day resets count
        if self.tier == self.TIER_FREE:
            return self.daily_message_count < 20
        return True  # Pro and Premium: unlimited

    def increment_message_count(self):
        from django.utils import timezone
        today = timezone.now().date()
        if self.last_message_date != today:
            self.daily_message_count = 1
            self.last_message_date = today
        else:
            self.daily_message_count += 1
        self.save(update_fields=["daily_message_count", "last_message_date"])
