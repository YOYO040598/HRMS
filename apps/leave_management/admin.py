from django.contrib import admin
from apps.leave_management.models import LeaveType, LeaveBalance, LeaveApplication, LeaveApproval, Holiday


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'days_per_year', 'is_paid', 'is_carry_forward', 'is_active')
    list_filter = ('is_paid', 'is_carry_forward', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'year', 'total_days', 'used_days', 'pending_days')
    list_filter = ('leave_type', 'year')
    raw_id_fields = ('employee',)


@admin.register(LeaveApplication)
class LeaveApplicationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'total_days', 'status')
    list_filter = ('status', 'leave_type', 'is_emergency')
    search_fields = ('employee__user__first_name', 'employee__user__last_name')
    raw_id_fields = ('employee', 'leave_type', 'reviewed_by')


@admin.register(LeaveApproval)
class LeaveApprovalAdmin(admin.ModelAdmin):
    list_display = ('leave_application', 'approver', 'status', 'level', 'approved_at')
    list_filter = ('status', 'level')
    raw_id_fields = ('leave_application', 'approver')


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'is_recurring', 'company')
    list_filter = ('is_recurring', 'company')
    search_fields = ('name',)
