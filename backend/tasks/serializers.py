from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            "id",
            "subject",
            "academic_event",
            "title",
            "description",
            "due_at",
            "status",
            "priority",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Informe o título da tarefa.")
        return title

    def validate_subject(self, subject):
        if subject is None:
            return subject
        request = self.context["request"]
        if subject.user_id != request.user.id:
            raise serializers.ValidationError("Matéria inválida para este usuário.")
        return subject

    def validate_academic_event(self, academic_event):
        if academic_event is None:
            return academic_event
        request = self.context["request"]
        if academic_event.user_id != request.user.id:
            raise serializers.ValidationError("Evento inválido para este usuário.")
        return academic_event
