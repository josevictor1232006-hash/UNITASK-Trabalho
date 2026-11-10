from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Subject
from .serializers import SubjectSerializer


class SubjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        qs = Subject.objects.filter(user=self.request.user)
        archived = self.request.query_params.get("archived")
        if archived is None:
            return qs.filter(is_archived=False)
        if archived.lower() in ("1", "true", "yes"):
            return qs.filter(is_archived=True)
        if archived.lower() == "all":
            return qs
        return qs.filter(is_archived=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user)
