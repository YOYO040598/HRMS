from django.contrib import admin
from apps.reports.models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_type', 'created_by', 'is_scheduled', 'last_generated')
    list_filter = ('report_type', 'is_scheduled')
    search_fields = ('name', 'description')
    raw_id_fields = ('created_by',)
