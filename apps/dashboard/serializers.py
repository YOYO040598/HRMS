from rest_framework import serializers
from apps.dashboard.models import DashboardWidget, DashboardLayout


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'title', 'description',
            'config', 'position', 'is_active', 'allowed_roles',
        ]
        read_only_fields = ['id']


class DashboardLayoutSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)

    class Meta:
        model = DashboardLayout
        fields = ['id', 'user', 'widgets', 'columns', 'name']
        read_only_fields = ['id']
