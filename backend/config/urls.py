from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("users.urls")),
    path("api/subjects/", include("subjects.urls")),
    path("api/events/", include("academic_events.urls")),
    path("api/tasks/", include("tasks.urls")),
]
