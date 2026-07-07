from apps.accounts.views import GoogleLoginView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls"), name="accounts"),
    path("api/assistant/", include("apps.assistant.urls"), name="assistant"),
    path("api/tasks/", include("apps.tasks.urls"), name="tasks"),
    path("api/calendar/", include("apps.calendar.urls"), name="calendar"),
    path("api/news/", include("apps.news.urls"), name="news"),
    path("api/subscriptions/", include("apps.subscriptions.urls"), name="subscriptions"),
    path("google/", GoogleLoginView.as_view(), name="google_login"), 
    path("auth/google/", GoogleLoginView.as_view(), name="google_login" ),
    # allauth
    path("accounts/", include("allauth.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
