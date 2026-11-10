from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import TaskSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(user=self.request.user).select_related(
            "subject",
            "academic_event",
        )
        status = self.request.query_params.get("status")
        subject = self.request.query_params.get("subject")
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")

        if status:
            qs = qs.filter(status=status)
        if subject:
            qs = qs.filter(subject_id=subject)
        if date_from:
            qs = qs.filter(due_at__gte=date_from)
        if date_to:
            qs = qs.filter(due_at__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related(
            "subject",
            "academic_event",
        )
