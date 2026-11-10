from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Subject(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40, blank=True)
    professor = models.CharField(max_length=120, blank=True)
    color = models.CharField(max_length=7, blank=True, default="#1E3A8A")
    passing_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=6.0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_subject_name_per_user",
            )
        ]

    def __str__(self):
        return self.name
