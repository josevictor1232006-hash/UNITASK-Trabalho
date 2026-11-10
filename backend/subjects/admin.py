from django.contrib import admin

from .models import Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "code", "passing_grade", "is_archived", "updated_at")
    list_filter = ("is_archived",)
    search_fields = ("name", "code", "professor", "user__email")
