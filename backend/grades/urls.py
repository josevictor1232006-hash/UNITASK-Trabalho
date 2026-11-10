from django.urls import path

from .views import AssessmentDetailView, AssessmentListCreateView, GradeSummaryView

assessment_urlpatterns = [
    path("", AssessmentListCreateView.as_view(), name="assessment-list"),
    path("<int:pk>/", AssessmentDetailView.as_view(), name="assessment-detail"),
]

grade_urlpatterns = [
    path("summary/", GradeSummaryView.as_view(), name="grade-summary"),
]
