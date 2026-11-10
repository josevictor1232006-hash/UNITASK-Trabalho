from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Subject

User = get_user_model()


class SubjectApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="a@example.com",
            name="User A",
            password="SenhaForte123",
        )
        self.user_b = User.objects.create_user(
            email="b@example.com",
            name="User B",
            password="SenhaForte123",
        )

    def _auth(self, user):
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_list_update_archive_and_delete(self):
        self._auth(self.user_a)

        create = self.client.post(
            reverse("subject-list"),
            {
                "name": "Cálculo I",
                "code": "MAT101",
                "professor": "Profa. Ana",
                "color": "#7C3AED",
                "passing_grade": "6.00",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        subject_id = create.data["id"]

        listing = self.client.get(reverse("subject-list"))
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]["name"], "Cálculo I")

        patch = self.client.patch(
            reverse("subject-detail", args=[subject_id]),
            {"is_archived": True},
            format="json",
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertTrue(patch.data["is_archived"])

        active = self.client.get(reverse("subject-list"))
        self.assertEqual(active.data, [])

        archived = self.client.get(reverse("subject-list") + "?archived=true")
        self.assertEqual(len(archived.data), 1)

        delete = self.client.delete(reverse("subject-detail", args=[subject_id]))
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Subject.objects.filter(id=subject_id).exists())

    def test_user_cannot_access_another_users_subject(self):
        subject = Subject.objects.create(user=self.user_a, name="Física")
        self._auth(self.user_b)

        response = self.client.get(reverse("subject-detail", args=[subject.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        listing = self.client.get(reverse("subject-list"))
        self.assertEqual(listing.data, [])
