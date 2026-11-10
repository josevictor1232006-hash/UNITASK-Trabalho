from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from academic_events.models import AcademicEvent
from grades.models import Assessment
from subjects.models import Subject
from tasks.models import Task

User = get_user_model()


class HealthEndpointTests(SimpleTestCase):
    def test_health_returns_ok(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["service"], "unitask-api")


class DashboardEndpointTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="a@example.com", name="User A", password="SenhaForte123"
        )
        self.user_b = User.objects.create_user(
            email="b@example.com", name="User B", password="SenhaForte123"
        )
        self.subject_a = Subject.objects.create(user=self.user_a, name="Cálculo")
        self.subject_b = Subject.objects.create(user=self.user_b, name="Física")
        self.now = timezone.now()

    def _auth(self, user):
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_dashboard_aggregates_and_alerts(self):
        AcademicEvent.objects.create(
            user=self.user_a,
            subject=self.subject_a,
            title="P1 amanhã",
            event_type=AcademicEvent.EventType.EXAM,
            start_at=self.now + timedelta(days=1),
        )
        AcademicEvent.objects.create(
            user=self.user_a,
            title="Prova atrasada",
            event_type=AcademicEvent.EventType.EXAM,
            start_at=self.now - timedelta(days=1),
        )
        Task.objects.create(
            user=self.user_a,
            subject=self.subject_a,
            title="Lista 1",
            due_at=self.now + timedelta(days=2),
            status=Task.Status.PENDING,
        )
        Task.objects.create(
            user=self.user_a,
            title="Feita",
            status=Task.Status.DONE,
        )
        Assessment.objects.create(
            user=self.user_a,
            subject=self.subject_a,
            name="P1",
            score=Decimal("5.00"),
        )
        # Dados de outro usuário não devem vazar
        AcademicEvent.objects.create(
            user=self.user_b,
            subject=self.subject_b,
            title="Segredo",
            event_type=AcademicEvent.EventType.EXAM,
            start_at=self.now + timedelta(hours=2),
        )

        self._auth(self.user_a)
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["alert_window_days"], 3)
        self.assertEqual(data["subjects"]["active"], 1)
        self.assertEqual(data["tasks"]["pending"], 1)
        self.assertEqual(data["tasks"]["done"], 1)
        self.assertEqual(data["tasks"]["open"], 1)
        self.assertEqual(len(data["upcoming_events"]), 1)
        self.assertEqual(data["upcoming_events"][0]["title"], "P1 amanhã")
        self.assertTrue(any(a["severity"] == "overdue" for a in data["alerts"]))
        self.assertTrue(any(a["severity"] == "due_soon" for a in data["alerts"]))
        self.assertFalse(any(a["title"] == "Segredo" for a in data["alerts"]))
        self.assertEqual(len(data["grade_highlights"]), 1)
        self.assertEqual(data["grade_highlights"][0]["current_average"], "5.00")
        self.assertFalse(data["grade_highlights"][0]["already_passing"])

    def test_dashboard_requires_auth(self):
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
