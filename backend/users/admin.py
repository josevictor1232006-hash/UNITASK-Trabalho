from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "is_staff", "is_active", "created_at")
    search_fields = ("email", "name")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Dados pessoais", {"fields": ("name",)}),
        (
            "Permissões",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "password1", "password2", "is_staff", "is_superuser"),
            },
        ),
    )

    filter_horizontal = ("groups", "user_permissions")
    list_filter = ("is_staff", "is_active", "is_superuser")
