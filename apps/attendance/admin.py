from django.contrib import admin
from apps.attendance.models import Attendance, AttendanceBreak, AttendanceLog, AttendanceApproval


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status', 'check_in', 'check_out', 'total_hours', 'is_approved')
    list_filter = ('status', 'is_approved', 'date')
    search_fields = ('employee__user__first_name', 'employee__user__last_name', 'employee__employee_id')
    raw_id_fields = ('employee', 'approved_by')


@admin.register(AttendanceBreak)
class AttendanceBreakAdmin(admin.ModelAdmin):
    list_display = ('attendance', 'break_type', 'start_time', 'end_time', 'duration_minutes')
    list_filter = ('break_type',)
    raw_id_fields = ('attendance',)


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('employee', 'action', 'timestamp', 'ip_address')
    list_filter = ('action',)
    raw_id_fields = ('employee', 'attendance')


@admin.register(AttendanceApproval)
class AttendanceApprovalAdmin(admin.ModelAdmin):
    list_display = ('attendance', 'status', 'approved_by', 'approved_at')
    list_filter = ('status',)
    raw_id_fields = ('attendance', 'approved_by')
