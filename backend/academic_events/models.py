from django.conf import settings
from django.db import models


class AcademicEvent(models.Model):
    class EventType(models.TextChoices):
        EXAM = "exam", "Prova"
        ASSIGNMENT = "assignment", "Trabalho"
        OTHER = "other", "Outro"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Agendado"
        COMPLETED = "completed", "Concluído"
        CANCELLED = "cancelled", "Cancelado"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_events",
    )
    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.PROTECT,
        related_name="academic_events",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.OTHER,
    )
    start_at = models.DateTimeField()
    due_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_at"]

    def __str__(self):
        return self.title
