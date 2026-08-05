from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.accounts.models import Role, UserRole

User = get_user_model()


@receiver(post_save, sender=User)
def create_default_role_assignment(sender, instance, created, **kwargs):
    if created:
        role_slug = instance.role.lower()
        role_obj, _ = Role.objects.get_or_create(
            name=instance.role.replace('_', ' ').title(),
            slug=role_slug,
            defaults={'description': f'Default {instance.role} role'},
        )
        UserRole.objects.get_or_create(user=instance, role=role_obj)
