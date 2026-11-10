from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_login_and_me(self):
        register_payload = {
            "name": "Ana Estudante",
            "email": "ana@example.com",
            "password": "SenhaForte123",
            "password_confirm": "SenhaForte123",
        }
        register_response = self.client.post(
            reverse("auth-register"),
            register_payload,
            format="json",
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_response.data["email"], "ana@example.com")
        self.assertNotIn("password", register_response.data)

        login_response = self.client.post(
            reverse("auth-login"),
            {"email": "ana@example.com", "password": "SenhaForte123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        me_response = self.client.get(reverse("auth-me"))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["email"], "ana@example.com")
        self.assertEqual(me_response.data["name"], "Ana Estudante")

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_see_another_user_profile_via_me(self):
        user_a = User.objects.create_user(
            email="a@example.com",
            name="User A",
            password="SenhaForte123",
        )
        User.objects.create_user(
            email="b@example.com",
            name="User B",
            password="SenhaForte123",
        )

        login_response = self.client.post(
            reverse("auth-login"),
            {"email": "a@example.com", "password": "SenhaForte123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

        me_response = self.client.get(reverse("auth-me"))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["id"], user_a.id)
        self.assertEqual(me_response.data["email"], "a@example.com")
        self.assertNotEqual(me_response.data["email"], "b@example.com")
