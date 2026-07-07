from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .calendar_service import list_events, create_event, delete_event


class EventListView(APIView):
    def get(self, request):
        if request.user.tier == request.user.TIER_FREE:
            # Free tier: view only, no creation
            try:
                events = list_events(request.user)
                return Response({"events": events, "readonly": True})
            except ValueError as e:
                return Response({"error": str(e)}, status=400)
        try:
            events = list_events(request.user)
            return Response({"events": events, "readonly": False})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        if request.user.tier == request.user.TIER_FREE:
            return Response(
                {"error": "Calendar creation requires Pro or Premium."},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = request.data
        try:
            event = create_event(
                request.user,
                title=data["title"],
                start=data["start"],
                end=data["end"],
                description=data.get("description", ""),
            )
            return Response({"event": event}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class EventDetailView(APIView):
    def delete(self, request, event_id):
        if request.user.tier == request.user.TIER_FREE:
            return Response({"error": "Upgrade required."}, status=status.HTTP_403_FORBIDDEN)
        try:
            delete_event(request.user, event_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
