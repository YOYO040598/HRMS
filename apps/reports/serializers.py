from rest_framework import serializers
from apps.reports.models import Report


class ReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'name', 'report_type', 'description', 'created_by',
            'created_by_name', 'is_scheduled', 'schedule_frequency',
            'last_generated', 'parameters', 'file',
        ]
        read_only_fields = ['id', 'last_generated']
