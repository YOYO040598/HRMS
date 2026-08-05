from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        SYSTEM = 'SYSTEM', 'System'
        LEAVE = 'LEAVE', 'Leave'
        ATTENDANCE = 'ATTENDANCE', 'Attendance'
        PAYROLL = 'PAYROLL', 'Payroll'
        ASSET = 'ASSET', 'Asset'
        EXIT = 'EXIT', 'Exit'
        APPROVAL = 'APPROVAL', 'Approval'
        REMINDER = 'REMINDER', 'Reminder'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    action_url = models.URLField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.title}'


class NotificationTemplate(BaseModel):
    name = models.CharField(max_length=100)
    notification_type = models.CharField(max_length=30, choices=Notification.NotificationType.choices)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        ordering = ['name']

    def __str__(self):
        return self.name


class NotificationPreference(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    leave_notifications = models.BooleanField(default=True)
    attendance_notifications = models.BooleanField(default=True)
    payroll_notifications = models.BooleanField(default=True)
    asset_notifications = models.BooleanField(default=True)
    exit_notifications = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f'Preferences - {self.user}'
