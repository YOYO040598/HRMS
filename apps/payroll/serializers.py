from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from apps.payroll.models import (
    SalaryStructure, Payroll, Allowance, Deduction, Reimbursement,
    Payslip, PayslipEarning, PayslipDeduction, PayslipAuditLog,
)


class SalaryStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'name', 'description', 'basic_percentage', 'hra_percentage',
            'special_allowance_percentage', 'pf_percentage', 'esi_percentage',
            'professional_tax', 'is_active',
        ]
        read_only_fields = ['id']


class AllowanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allowance
        fields = ['id', 'payroll', 'name', 'amount', 'is_taxable', 'description']
        read_only_fields = ['id']


class DeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deduction
        fields = ['id', 'payroll', 'deduction_type', 'name', 'amount', 'description']
        read_only_fields = ['id']


class ReimbursementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)

    class Meta:
        model = Reimbursement
        fields = [
            'id', 'employee', 'employee_name', 'expense_type', 'amount',
            'description', 'receipt', 'status', 'submitted_at',
            'reviewed_by', 'reviewed_at', 'comments',
        ]
        read_only_fields = ['id', 'submitted_at']


class PayslipEarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipEarning
        fields = ['id', 'name', 'amount']
        read_only_fields = ['id']


class PayslipDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipDeduction
        fields = ['id', 'name', 'amount']
        read_only_fields = ['id']


class PayslipListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    generated_by_name = serializers.SerializerMethodField()
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'month', 'year', 'gross_salary', 'total_deductions', 'net_salary',
            'status', 'generated_date', 'generated_by', 'generated_by_name',
            'has_pdf', 'pdf_file',
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return obj.generated_by.full_name
        return None

    @extend_schema_field(serializers.BooleanField())
    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)


class PayslipDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()
    earnings = PayslipEarningSerializer(many=True, read_only=True)
    payslip_deductions = PayslipDeductionSerializer(many=True, read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'department_name', 'designation_name',
            'month', 'year', 'gross_salary', 'total_deductions', 'net_salary',
            'status', 'generated_date', 'generated_by', 'generated_by_name',
            'notes', 'earnings', 'payslip_deductions', 'has_pdf', 'pdf_file',
        ]

    @extend_schema_field(serializers.CharField())
    def get_department_name(self, obj):
        if obj.employee and obj.employee.department:
            return obj.employee.department.name
        return 'N/A'

    @extend_schema_field(serializers.CharField())
    def get_designation_name(self, obj):
        if obj.employee and obj.employee.designation:
            return obj.employee.designation.name
        return 'N/A'

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return obj.generated_by.full_name
        return None

    @extend_schema_field(serializers.BooleanField())
    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)


class PayrollListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'month', 'year',
            'basic_salary', 'gross_salary', 'total_deductions', 'net_salary',
            'status', 'paid_date',
        ]


class PayrollDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    processed_by_name = serializers.SerializerMethodField()
    allowances = AllowanceSerializer(many=True, read_only=True)
    deductions = DeductionSerializer(many=True, read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'month', 'year',
            'basic_salary', 'gross_salary', 'total_deductions', 'net_salary',
            'status', 'processed_by', 'processed_by_name', 'processed_at',
            'paid_date', 'payment_method', 'transaction_id', 'notes',
            'allowances', 'deductions', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return obj.processed_by.full_name
        return None


class PayslipAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    payslip_period = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='payslip.employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='payslip.employee.user.full_name', read_only=True)

    class Meta:
        model = PayslipAuditLog
        fields = [
            'id', 'payslip', 'payslip_period', 'employee_id', 'employee_name',
            'user', 'user_name', 'action', 'timestamp', 'ip_address', 'user_agent', 'details'
        ]
        read_only_fields = ['id', 'timestamp']

    @extend_schema_field(serializers.CharField())
    def get_payslip_period(self, obj):
        if obj.payslip:
            from apps.payroll.services import MONTH_NAMES
            try:
                month_name = MONTH_NAMES[obj.payslip.month]
            except Exception:
                month_name = str(obj.payslip.month)
            return f"{month_name} {obj.payslip.year}"
        return 'N/A'
