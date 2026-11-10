from django.urls import path

from .views import AcademicEventDetailView, AcademicEventListCreateView

urlpatterns = [
    path("", AcademicEventListCreateView.as_view(), name="event-list"),
    path("<int:pk>/", AcademicEventDetailView.as_view(), name="event-detail"),
]
