from django.contrib import admin

from .models import AcademicEvent


@admin.register(AcademicEvent)
class AcademicEventAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "event_type", "start_at", "status", "subject")
    list_filter = ("event_type", "status")
    search_fields = ("title", "user__email")
