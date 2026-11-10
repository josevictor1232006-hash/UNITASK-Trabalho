from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from subjects.models import Subject

from .models import Assessment
from .serializers import AssessmentSerializer
from .services import compute_subject_grades


class AssessmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        qs = Assessment.objects.filter(user=self.request.user).select_related("subject")
        subject = self.request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        return Assessment.objects.filter(user=self.request.user).select_related("subject")


class GradeSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subject_id = request.query_params.get("subject")
        subjects = Subject.objects.filter(user=request.user, is_archived=False)
        if subject_id:
            subjects = subjects.filter(id=subject_id)
            if not subjects.exists():
                return Response(
                    {"detail": "Matéria não encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        assessments = Assessment.objects.filter(
            user=request.user,
            subject_id__in=subjects.values_list("id", flat=True),
        ).select_related("subject")

        by_subject: dict[int, list] = {}
        for assessment in assessments:
            by_subject.setdefault(assessment.subject_id, []).append(assessment)

        summaries = []
        for subject in subjects.order_by("name"):
            grade = compute_subject_grades(
                passing_grade=subject.passing_grade,
                assessments=by_subject.get(subject.id, []),
            )
            summaries.append(
                {
                    "subject_id": subject.id,
                    "subject_name": subject.name,
                    "subject_color": subject.color,
                    **grade,
                }
            )

        if subject_id:
            return Response(summaries[0])
        return Response(summaries)
