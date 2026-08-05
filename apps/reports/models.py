from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class Report(BaseModel):
    class ReportType(models.TextChoices):
        EMPLOYEE = 'EMPLOYEE', 'Employee Report'
        ATTENDANCE = 'ATTENDANCE', 'Attendance Report'
        LEAVE = 'LEAVE', 'Leave Report'
        PAYROLL = 'PAYROLL', 'Payroll Report'
        ASSET = 'ASSET', 'Asset Report'
        EXIT = 'EXIT', 'Exit Report'
        DEPARTMENT = 'DEPARTMENT', 'Department Report'
        CUSTOM = 'CUSTOM', 'Custom Report'

    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=20, blank=True, default='')
    last_generated = models.DateTimeField(blank=True, null=True)
    parameters = models.JSONField(default=dict, blank=True)
    file = models.FileField(upload_to='reports/', blank=True, null=True)

    class Meta:
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-last_generated']

    def __str__(self):
        return f'{self.name} ({self.get_report_type_display()})'
