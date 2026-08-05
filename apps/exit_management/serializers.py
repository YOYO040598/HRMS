from rest_framework import serializers
from apps.exit_management.models import Resignation, ExitApproval, FullAndFinal, ExperienceLetter


class ExitApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.full_name', read_only=True)

    class Meta:
        model = ExitApproval
        fields = [
            'id', 'resignation', 'approver', 'approver_name', 'status',
            'level', 'comments', 'approved_at',
        ]
        read_only_fields = ['id', 'approved_at']


class ResignationListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Resignation
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'last_working_day',
            'status', 'notice_period_days', 'applied_date', 'is_relieved',
        ]


class ResignationDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    approvals = ExitApprovalSerializer(many=True, read_only=True)

    class Meta:
        model = Resignation
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'last_working_day',
            'reason', 'status', 'notice_period_days', 'applied_date',
            'approved_by', 'approved_by_name', 'approved_date', 'comments',
            'is_relieved', 'relieved_date', 'approvals',
        ]
        read_only_fields = ['id', 'applied_date']


class FullAndFinalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    completed_by_name = serializers.CharField(source='completed_by.full_name', read_only=True)

    class Meta:
        model = FullAndFinal
        fields = [
            'id', 'employee', 'employee_name', 'resignation', 'status',
            'final_settlement_amount', 'pending_dues', 'assets_returned',
            'documents_submitted', 'access_revoked', 'completed_date',
            'completed_by', 'completed_by_name', 'notes',
        ]
        read_only_fields = ['id']


class ExperienceLetterSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.full_name', read_only=True)

    class Meta:
        model = ExperienceLetter
        fields = [
            'id', 'employee', 'employee_name', 'issued_date', 'issued_by',
            'issued_by_name', 'file', 'content', 'is_sent', 'sent_at',
        ]
        read_only_fields = ['id', 'issued_date']
