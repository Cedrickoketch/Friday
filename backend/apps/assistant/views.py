from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Conversation, Message
from .ai_service import chat
from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer


class ChatView(APIView):
    """Send a message to Friday and get a response."""

    def post(self, request):
        user = request.user

        # Rate limit check for free tier
        if not user.can_send_message:
            return Response(
                {"error": "Daily message limit reached. Upgrade to Pro for unlimited messages."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user_message = request.data.get("message", "").strip()
        conversation_id = request.data.get("conversation_id")

        if not user_message:
            return Response({"error": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create conversation
        if conversation_id:
            conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
        else:
            conversation = Conversation.objects.create(user=user)

        # Build message history for context (last 10 messages)
        history = list(
            conversation.messages.order_by("-created_at")[:10]
            .values("role", "content")
        )[::-1]

        # Call AI
        try:
            result = chat(history, user_message)
        except Exception as e:
            return Response({"error": f"AI service error: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Persist messages
        Message.objects.create(conversation=conversation, role="user", content=user_message)
        Message.objects.create(conversation=conversation, role="assistant", content=result["reply"])
        user.increment_message_count()

        # Handle structured actions
        action_result = None
        action = result.get("action")
        if action:
            action_result = self._dispatch_action(action, user)

        return Response({
            "reply": result["reply"],
            "action": action,
            "action_result": action_result,
            "conversation_id": conversation.id,
        })

    def _dispatch_action(self, action: dict, user) -> dict | None:
        action_type = action.get("action")

        if action_type == "create_task":
            task = Task.objects.create(
                user=user,
                title=action.get("title", "New Task"),
                due_date=action.get("due_date"),
                priority=action.get("priority", "medium"),
            )
            return {"created": "task", "data": TaskSerializer(task).data}

        # TODO: handle create_event via Google Calendar service
        return None


class ConversationListView(APIView):
    def get(self, request):
        convos = Conversation.objects.filter(user=request.user)[:20]
        data = [
            {
                "id": c.id,
                "created_at": c.created_at,
                "preview": c.messages.last().content[:80] if c.messages.exists() else "",
            }
            for c in convos
        ]
        return Response(data)


class ConversationDetailView(APIView):
    def get(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk, user=request.user)
        messages = convo.messages.values("role", "content", "created_at")
        return Response({"id": convo.id, "messages": list(messages)})

    def delete(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk, user=request.user)
        convo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
