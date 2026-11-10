from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from subjects.models import Subject

from .models import AcademicEvent

User = get_user_model()


class AcademicEventApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="a@example.com", name="User A", password="SenhaForte123"
        )
        self.user_b = User.objects.create_user(
            email="b@example.com", name="User B", password="SenhaForte123"
        )
        self.subject_a = Subject.objects.create(user=self.user_a, name="Cálculo")
        self.subject_b = Subject.objects.create(user=self.user_b, name="Física")

    def _auth(self, user):
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_list_and_filter_events(self):
        self._auth(self.user_a)
        create = self.client.post(
            reverse("event-list"),
            {
                "title": "P1 Cálculo",
                "event_type": "exam",
                "subject": self.subject_a.id,
                "start_at": "2026-04-10T14:00:00-03:00",
                "due_at": "2026-04-10T16:00:00-03:00",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        listing = self.client.get(reverse("event-list"))
        self.assertEqual(len(listing.data), 1)

        filtered = self.client.get(
            reverse("event-list"),
            {"subject": self.subject_a.id, "status": "scheduled"},
        )
        self.assertEqual(len(filtered.data), 1)

    def test_cannot_use_another_users_subject(self):
        self._auth(self.user_a)
        response = self.client.post(
            reverse("event-list"),
            {
                "title": "Prova inválida",
                "event_type": "exam",
                "subject": self.subject_b.id,
                "start_at": "2026-04-10T14:00:00-03:00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_see_other_users_events(self):
        event = AcademicEvent.objects.create(
            user=self.user_a,
            title="Trabalho A",
            event_type="assignment",
            start_at="2026-04-12T10:00:00Z",
        )
        self._auth(self.user_b)
        response = self.client.get(reverse("event-detail", args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
