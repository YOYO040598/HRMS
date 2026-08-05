from rest_framework import serializers
from apps.notifications.models import Notification, NotificationTemplate, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'action_url', 'metadata', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'notification_type', 'subject', 'body', 'is_active']
        read_only_fields = ['id']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_enabled', 'push_enabled', 'sms_enabled',
            'leave_notifications', 'attendance_notifications', 'payroll_notifications',
            'asset_notifications', 'exit_notifications',
        ]
        read_only_fields = ['id']
