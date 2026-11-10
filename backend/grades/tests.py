from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from subjects.models import Subject

from .models import Assessment
from .services import compute_subject_grades

User = get_user_model()


class GradeCalculationTests(APITestCase):
    def test_simple_average(self):
        class A:
            def __init__(self, score, weight=None):
                self.score = score
                self.weight = weight

        result = compute_subject_grades(
            passing_grade="6.0",
            assessments=[A(Decimal("8")), A(Decimal("6")), A(None)],
        )
        self.assertEqual(result["method"], "simple")
        self.assertEqual(result["current_average"], "7.00")
        self.assertEqual(result["needed_on_remaining"], "4.00")
        self.assertTrue(result["needed_feasible"])

    def test_weighted_average_and_needed(self):
        class A:
            def __init__(self, score, weight):
                self.score = score
                self.weight = weight

        result = compute_subject_grades(
            passing_grade=Decimal("6"),
            assessments=[
                A(Decimal("8"), Decimal("2")),
                A(Decimal("5"), Decimal("1")),
                A(None, Decimal("1")),
            ],
        )
        # (8*2 + 5*1) / 3 = 21/3 = 7.00 current from scored only
        self.assertEqual(result["method"], "weighted")
        self.assertEqual(result["current_average"], "7.00")
        # needed: (6*4 - 21) / 1 = 3.00
        self.assertEqual(result["needed_on_remaining"], "3.00")
        self.assertTrue(result["needed_feasible"])

    def test_needed_above_max(self):
        class A:
            def __init__(self, score, weight=None):
                self.score = score
                self.weight = weight

        result = compute_subject_grades(
            passing_grade="9.0",
            assessments=[A(Decimal("2")), A(None)],
        )
        self.assertEqual(result["needed_on_remaining"], "16.00")
        self.assertFalse(result["needed_feasible"])

    def test_mixed_weights_blocks_needed(self):
        class A:
            def __init__(self, score, weight=None):
                self.score = score
                self.weight = weight

        result = compute_subject_grades(
            passing_grade="6.0",
            assessments=[A(Decimal("8"), Decimal("1")), A(None, None)],
        )
        self.assertEqual(result["method"], "weighted")
        self.assertIsNone(result["needed_on_remaining"])
        self.assertIn("indisponível", result["message"].lower())

    def test_no_scores(self):
        class A:
            def __init__(self, score=None, weight=None):
                self.score = score
                self.weight = weight

        result = compute_subject_grades(
            passing_grade="6.0",
            assessments=[A(), A()],
        )
        self.assertIsNone(result["current_average"])
        self.assertEqual(result["scored_count"], 0)


class AssessmentApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="a@example.com", name="User A", password="SenhaForte123"
        )
        self.user_b = User.objects.create_user(
            email="b@example.com", name="User B", password="SenhaForte123"
        )
        self.subject_a = Subject.objects.create(
            user=self.user_a, name="Cálculo", passing_grade=Decimal("6.00")
        )
        self.subject_b = Subject.objects.create(user=self.user_b, name="Física")

    def _auth(self, user):
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_list_summary_and_isolation(self):
        self._auth(self.user_a)
        create = self.client.post(
            reverse("assessment-list"),
            {
                "subject": self.subject_a.id,
                "name": "P1",
                "score": "7.50",
                "weight": "2",
                "date": "2026-04-01",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        self.client.post(
            reverse("assessment-list"),
            {
                "subject": self.subject_a.id,
                "name": "P2",
                "weight": "2",
            },
            format="json",
        )

        listing = self.client.get(
            reverse("assessment-list"),
            {"subject": self.subject_a.id},
        )
        self.assertEqual(len(listing.data), 2)

        summary = self.client.get(
            reverse("grade-summary"),
            {"subject": self.subject_a.id},
        )
        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertEqual(summary.data["current_average"], "7.50")
        self.assertEqual(summary.data["method"], "weighted")
        self.assertEqual(summary.data["needed_on_remaining"], "4.50")

        self._auth(self.user_b)
        blocked = self.client.get(
            reverse("assessment-detail", args=[create.data["id"]]),
        )
        self.assertEqual(blocked.status_code, status.HTTP_404_NOT_FOUND)

        foreign_subject = self.client.post(
            reverse("assessment-list"),
            {"subject": self.subject_a.id, "name": "Hack"},
            format="json",
        )
        self.assertEqual(foreign_subject.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_use_another_users_subject(self):
        Assessment.objects.create(
            user=self.user_a,
            subject=self.subject_a,
            name="P1",
            score=Decimal("8"),
        )
        self._auth(self.user_b)
        response = self.client.get(reverse("grade-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["subject_id"], self.subject_b.id)
        self.assertIsNone(response.data[0]["current_average"])
