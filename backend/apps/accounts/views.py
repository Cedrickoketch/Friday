from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import os
import requests
from .models import User
from .serializers import UserSerializer, GoogleAuthSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 1. Grab the auth code from the frontend request
        code = request.data.get('code')
        
        if not code:
            return Response({"error": "Authorization code missing"}, status=status.HTTP_400_BAD_REQUEST)
        
        secret_file_path = os.path.join(settings.BASE_DIR, 'client_secret.json')

        try:
            # 2. Set up the OAuth Flow to exchange the code for real tokens
            flow = Flow.from_client_secrets_file(
                secret_file_path, # Your Google credentials JSON file path
                scopes=[
                    'openid', 
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/calendar'
                ],
                redirect_uri='postmessage' # 👈 CRITICAL: Must be 'postmessage' for popup flows
            )
            
            # 3. Exchange the authorization code for actual Google Tokens
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            access_token = credentials.token
            refresh_token = credentials.refresh_token # 💡 Save this if you need persistent server calendar sync
            
            # 4. (Optional) Fetch user profile info using the access token
            user_info_resp = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                params={'access_token': access_token}
            )
            user_info = user_info_resp.json()
            email = user_info.get('email')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0], # Fallback username syntax
                    'first_name': user_info.get('given_name', ''),
                    'last_name': user_info.get('family_name', ''),
                }
            )

            # Generate local SimpleJWT tokens for your React application
            django_tokens = get_tokens_for_user(user) 
            
            return Response({
                "tokens": django_tokens,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Helps you debug exactly what Google rejected in the console logs
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """Get and update the authenticated user's profile."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TokenRefreshView(APIView):
    """Thin wrapper — handled by simplejwt, kept here for clarity."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.views import TokenRefreshView as BaseView
        return BaseView.as_view()(request._request)
