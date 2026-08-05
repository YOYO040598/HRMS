from django.contrib.auth import get_user_model

User = get_user_model()


def get_user_by_email(email):
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def get_active_users():
    return User.objects.filter(is_active=True)


def get_users_by_role(role):
    return User.objects.filter(role=role, is_active=True)


def get_user_with_roles(user_id):
    return User.objects.prefetch_related('user_roles__role').get(id=user_id)
