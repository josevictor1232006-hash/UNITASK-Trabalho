from rest_framework import serializers

from .models import AcademicEvent


class AcademicEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicEvent
        fields = (
            "id",
            "subject",
            "title",
            "description",
            "event_type",
            "start_at",
            "due_at",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Informe o título do evento.")
        return title

    def validate_subject(self, subject):
        if subject is None:
            return subject
        request = self.context["request"]
        if subject.user_id != request.user.id:
            raise serializers.ValidationError("Matéria inválida para este usuário.")
        return subject

    def validate(self, attrs):
        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        due_at = attrs.get("due_at", getattr(self.instance, "due_at", None))
        if start_at and due_at and due_at < start_at:
            raise serializers.ValidationError(
                {"due_at": "A data limite não pode ser anterior ao início."}
            )
        return attrs
