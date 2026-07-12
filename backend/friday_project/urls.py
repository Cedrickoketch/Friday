from apps.accounts.views import GoogleLoginView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dj_rest_auth.views import UserDetailsView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls"), name="accounts"),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/calendar/', include('apps.calendar.urls')),
    path('api/news/', include('apps.news.urls')),
    path('api/assistant/', include('apps.assistant.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path("google/", GoogleLoginView.as_view(), name="google_login"), 
    path("auth/google/", GoogleLoginView.as_view(), name="google_login" ),
    path('auth/user/', UserDetailsView.as_view(), name='rest_user_details'),
    path('auth/user', UserDetailsView.as_view()),

    # allauth
    path("accounts/", include("allauth.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
