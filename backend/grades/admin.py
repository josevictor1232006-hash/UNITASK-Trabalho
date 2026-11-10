from django.contrib import admin

from .models import Assessment


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "subject", "score", "weight", "date")
    list_filter = ("subject",)
    search_fields = ("name", "user__email", "subject__name")
