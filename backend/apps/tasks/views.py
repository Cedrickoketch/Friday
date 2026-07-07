from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.tier == user.TIER_FREE:
            count = Task.objects.filter(user=user).count()
            if count >= 10:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    "Free tier is limited to 10 tasks. Upgrade to Pro for unlimited tasks."
                )
        serializer.save(user=user)

    @action(detail=True, methods=["patch"])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.completed = not task.completed
        task.save(update_fields=["completed"])
        return Response(TaskSerializer(task).data)
