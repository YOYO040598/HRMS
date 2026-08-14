from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.accounts.models import Role, UserRole

User = get_user_model()


class CustomUserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='testpass123',
            role='EMPLOYEE',
        )

    def test_create_user(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.first_name, 'Test')
        self.assertEqual(self.user.last_name, 'User')
        self.assertTrue(self.user.check_password('testpass123'))
        self.assertEqual(self.user.role, 'EMPLOYEE')
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            first_name='Admin',
            last_name='User',
            password='adminpass123',
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.role, 'ADMIN')

    def test_user_str(self):
        self.assertEqual(str(self.user), 'test@example.com')

    def test_full_name(self):
        self.assertEqual(self.user.full_name, 'Test User')


class RoleModelTest(TestCase):
    def setUp(self):
        self.role = Role.objects.create(
            name='Test Role',
            slug='test-role',
            description='Test role description',
        )

    def test_role_str(self):
        self.assertEqual(str(self.role), 'Test Role')


class UserRoleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='testpass123',
        )
        self.role, _ = Role.objects.get_or_create(name='Test Role 2', slug='test-role-2')
        self.user_role, _ = UserRole.objects.get_or_create(user=self.user, role=self.role)

    def test_user_role_str(self):
        self.assertEqual(str(self.user_role), 'test@example.com - Test Role 2')
