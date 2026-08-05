from django.contrib import admin
from apps.exit_management.models import Resignation, ExitApproval, FullAndFinal, ExperienceLetter


@admin.register(Resignation)
class ResignationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'last_working_day', 'status', 'notice_period_days', 'applied_date', 'is_relieved')
    list_filter = ('status', 'is_relieved')
    search_fields = ('employee__user__first_name', 'employee__user__last_name')
    raw_id_fields = ('employee', 'approved_by')


@admin.register(ExitApproval)
class ExitApprovalAdmin(admin.ModelAdmin):
    list_display = ('resignation', 'approver', 'status', 'level', 'approved_at')
    list_filter = ('status', 'level')
    raw_id_fields = ('resignation', 'approver')


@admin.register(FullAndFinal)
class FullAndFinalAdmin(admin.ModelAdmin):
    list_display = ('employee', 'status', 'final_settlement_amount', 'assets_returned', 'completed_date')
    list_filter = ('status', 'assets_returned', 'documents_submitted')
    raw_id_fields = ('employee', 'resignation', 'completed_by')


@admin.register(ExperienceLetter)
class ExperienceLetterAdmin(admin.ModelAdmin):
    list_display = ('employee', 'issued_date', 'issued_by', 'is_sent')
    list_filter = ('is_sent',)
    raw_id_fields = ('employee', 'issued_by')
