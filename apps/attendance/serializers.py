from rest_framework import serializers
from apps.attendance.models import Attendance, AttendanceBreak, AttendanceLog, AttendanceApproval


class AttendanceBreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceBreak
        fields = ['id', 'attendance', 'break_type', 'start_time', 'end_time', 'duration_minutes', 'notes']
        read_only_fields = ['id']


class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = ['id', 'employee', 'attendance', 'action', 'timestamp', 'ip_address', 'device_info', 'location']
        read_only_fields = ['id', 'timestamp']


class AttendanceApprovalSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = AttendanceApproval
        fields = ['id', 'attendance', 'status', 'approved_by', 'approved_by_name', 'comments', 'approved_at']
        read_only_fields = ['id', 'approved_at']


class AttendanceListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'date', 'status',
            'check_in', 'check_out', 'total_hours', 'overtime_hours', 'is_approved',
        ]


class AttendanceDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    breaks = AttendanceBreakSerializer(many=True, read_only=True)
    logs = AttendanceLogSerializer(many=True, read_only=True)
    approvals = AttendanceApprovalSerializer(many=True, read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'date', 'status',
            'check_in', 'check_out', 'total_hours', 'overtime_hours', 'is_approved',
            'approved_by', 'notes', 'breaks', 'logs', 'approvals', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
