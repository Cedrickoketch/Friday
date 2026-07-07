from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "avatar", "tier", "daily_message_count", "last_message_date",
        ]
        read_only_fields = ["tier", "daily_message_count", "last_message_date"]


class GoogleAuthSerializer(serializers.Serializer):
    """Receives the Google ID token from the frontend."""
    credential = serializers.CharField()
