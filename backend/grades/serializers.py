from rest_framework import serializers

from .models import Assessment


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = (
            "id",
            "subject",
            "name",
            "score",
            "weight",
            "date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Informe o nome da avaliação.")
        return name

    def validate_subject(self, subject):
        request = self.context["request"]
        if subject.user_id != request.user.id:
            raise serializers.ValidationError("Matéria inválida para este usuário.")
        return subject

    def validate_weight(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("O peso não pode ser negativo.")
        return value
