from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class DashboardWidget(BaseModel):
    class WidgetType(models.TextChoices):
        STAT_CARD = 'STAT_CARD', 'Stat Card'
        CHART = 'CHART', 'Chart'
        TABLE = 'TABLE', 'Table'
        LIST = 'LIST', 'List'
        CALENDAR = 'CALENDAR', 'Calendar'

    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WidgetType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    config = models.JSONField(default=dict, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    allowed_roles = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = 'Dashboard Widget'
        verbose_name_plural = 'Dashboard Widgets'
        ordering = ['position']

    def __str__(self):
        return self.title


class DashboardLayout(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_layout')
    widgets = models.ManyToManyField(DashboardWidget, blank=True, related_name='layouts')
    columns = models.PositiveIntegerField(default=12)
    name = models.CharField(max_length=100, default='Default Layout')

    class Meta:
        verbose_name = 'Dashboard Layout'
        verbose_name_plural = 'Dashboard Layouts'

    def __str__(self):
        return f'{self.user} - {self.name}'
