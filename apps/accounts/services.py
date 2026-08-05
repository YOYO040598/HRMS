from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, UserRole

User = get_user_model()


def create_user_account(email, first_name, last_name, password, role='EMPLOYEE', **extra_fields):
    with transaction.atomic():
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role=role,
            **extra_fields,
        )
        role_obj, _ = Role.objects.get_or_create(
            name=role.replace('_', ' ').title(),
            slug=role.lower(),
        )
        UserRole.objects.create(user=user, role=role_obj)
        return user


def deactivate_user_account(user):
    user.is_active = False
    user.save(update_fields=['is_active'])
    return user


def assign_role_to_user(user, role_slug, assigned_by=None):
    try:
        role = Role.objects.get(slug=role_slug)
        user_role, created = UserRole.objects.get_or_create(
            user=user, role=role,
            defaults={'assigned_by': assigned_by}
        )
        if created:
            user.role = role_slug.upper()
            user.save(update_fields=['role'])
        return user_role, created
    except Role.DoesNotExist:
        return None, False


def remove_role_from_user(user, role_slug):
    try:
        role = Role.objects.get(slug=role_slug)
        deleted, _ = UserRole.objects.filter(user=user, role=role).delete()
        return deleted > 0
    except Role.DoesNotExist:
        return False


def get_user_roles(user):
    return UserRole.objects.filter(user=user).select_related('role')
