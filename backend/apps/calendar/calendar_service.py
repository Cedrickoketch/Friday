"""
Google Calendar integration.
Requires the user's Google OAuth refresh token (stored on User model).
"""
import json
from django.conf import settings
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


def get_calendar_service(user):
    """Build an authenticated Google Calendar service for a user."""
    if not user.google_refresh_token:
        raise ValueError("User has not granted Calendar access. Please re-authenticate.")

    creds = Credentials(
        token=None,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/calendar"],
    )
    creds.refresh(Request())
    return build("calendar", "v3", credentials=creds)


def list_events(user, max_results=10):
    from datetime import datetime, timezone
    service = get_calendar_service(user)
    now = datetime.now(timezone.utc).isoformat()
    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return events_result.get("items", [])


def create_event(user, title: str, start: str, end: str, description: str = ""):
    service = get_calendar_service(user)
    event = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start, "timeZone": "Africa/Nairobi"},
        "end": {"dateTime": end, "timeZone": "Africa/Nairobi"},
    }
    return service.events().insert(calendarId="primary", body=event).execute()


def delete_event(user, event_id: str):
    service = get_calendar_service(user)
    service.events().delete(calendarId="primary", eventId=event_id).execute()
