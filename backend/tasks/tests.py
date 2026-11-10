from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from academic_events.models import AcademicEvent
from subjects.models import Subject

from .models import Task

User = get_user_model()


class TaskApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="a@example.com", name="User A", password="SenhaForte123"
        )
        self.user_b = User.objects.create_user(
            email="b@example.com", name="User B", password="SenhaForte123"
        )
        self.subject_a = Subject.objects.create(user=self.user_a, name="Cálculo")

    def _auth(self, user):
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_complete_and_filter_tasks(self):
        self._auth(self.user_a)
        create = self.client.post(
            reverse("task-list"),
            {
                "title": "Estudar derivadas",
                "subject": self.subject_a.id,
                "priority": "high",
                "due_at": "2026-04-09T23:59:00-03:00",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        task_id = create.data["id"]

        patch = self.client.patch(
            reverse("task-detail", args=[task_id]),
            {"status": "done"},
            format="json",
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertEqual(patch.data["status"], "done")

        done = self.client.get(reverse("task-list"), {"status": "done"})
        self.assertEqual(len(done.data), 1)

    def test_user_cannot_access_other_users_task(self):
        task = Task.objects.create(user=self.user_a, title="Tarefa A")
        self._auth(self.user_b)
        response = self.client.get(reverse("task-detail", args=[task.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_link_foreign_event(self):
        foreign_event = AcademicEvent.objects.create(
            user=self.user_b,
            title="Evento B",
            start_at="2026-04-10T10:00:00Z",
        )
        self._auth(self.user_a)
        response = self.client.post(
            reverse("task-list"),
            {
                "title": "Tarefa inválida",
                "academic_event": foreign_event.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
