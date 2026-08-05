from django.contrib import admin
from apps.dashboard.models import DashboardWidget, DashboardLayout


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'widget_type', 'title', 'position', 'is_active')
    list_filter = ('widget_type', 'is_active')


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'columns')
    raw_id_fields = ('user',)
