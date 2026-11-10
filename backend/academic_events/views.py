from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import AcademicEvent
from .serializers import AcademicEventSerializer


class AcademicEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AcademicEventSerializer

    def get_queryset(self):
        qs = AcademicEvent.objects.filter(user=self.request.user).select_related("subject")
        status = self.request.query_params.get("status")
        subject = self.request.query_params.get("subject")
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")

        if status:
            qs = qs.filter(status=status)
        if subject:
            qs = qs.filter(subject_id=subject)
        if date_from:
            qs = qs.filter(start_at__gte=date_from)
        if date_to:
            qs = qs.filter(start_at__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AcademicEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AcademicEventSerializer

    def get_queryset(self):
        return AcademicEvent.objects.filter(user=self.request.user).select_related("subject")
