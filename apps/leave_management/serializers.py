from rest_framework import serializers
from apps.leave_management.models import LeaveType, LeaveBalance, LeaveApplication, LeaveApproval, Holiday


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'slug', 'days_per_year', 'is_paid', 'is_carry_forward',
            'max_carry_forward_days', 'is_encashable', 'description', 'is_active',
        ]
        read_only_fields = ['id']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    available_days = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
            'year', 'total_days', 'used_days', 'pending_days',
            'carry_forward_days', 'available_days',
        ]
        read_only_fields = ['id', 'available_days']


class LeaveApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.full_name', read_only=True)

    class Meta:
        model = LeaveApproval
        fields = [
            'id', 'leave_application', 'approver', 'approver_name',
            'status', 'level', 'comments', 'approved_at',
        ]
        read_only_fields = ['id', 'approved_at']


class LeaveApplicationListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, default=None)
    approvals = LeaveApprovalSerializer(many=True, read_only=True)

    class Meta:
        model = LeaveApplication
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'total_days', 'reason', 'status', 'is_emergency', 'applied_at',
            'reviewed_by', 'reviewed_by_name', 'approvals',
        ]


class LeaveApplicationDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    approvals = LeaveApprovalSerializer(many=True, read_only=True)

    class Meta:
        model = LeaveApplication
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'total_days', 'reason', 'status',
            'applied_at', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_comments', 'is_emergency', 'attachment', 'approvals',
        ]
        read_only_fields = ['id', 'applied_at']


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'is_recurring', 'description', 'company', 'is_active']
        read_only_fields = ['id']
