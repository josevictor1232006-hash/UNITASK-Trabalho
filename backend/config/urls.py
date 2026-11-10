from django.contrib import admin
from django.urls import include, path

from grades.urls import assessment_urlpatterns, grade_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("users.urls")),
    path("api/subjects/", include("subjects.urls")),
    path("api/events/", include("academic_events.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/assessments/", include(assessment_urlpatterns)),
    path("api/grades/", include(grade_urlpatterns)),
]
