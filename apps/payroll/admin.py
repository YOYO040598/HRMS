from django.contrib import admin
from apps.payroll.models import SalaryStructure, Payroll, Allowance, Deduction, Reimbursement, Payslip, PayslipEarning, PayslipDeduction


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'basic_percentage', 'hra_percentage', 'pf_percentage', 'is_active')
    list_filter = ('is_active',)


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'month', 'year', 'gross_salary', 'total_deductions', 'net_salary', 'status')
    list_filter = ('status', 'month', 'year')
    search_fields = ('employee__user__first_name', 'employee__user__last_name', 'employee__employee_id')
    raw_id_fields = ('employee', 'processed_by')


@admin.register(Allowance)
class AllowanceAdmin(admin.ModelAdmin):
    list_display = ('payroll', 'name', 'amount', 'is_taxable')
    raw_id_fields = ('payroll',)


@admin.register(Deduction)
class DeductionAdmin(admin.ModelAdmin):
    list_display = ('payroll', 'deduction_type', 'name', 'amount')
    list_filter = ('deduction_type',)
    raw_id_fields = ('payroll',)


@admin.register(Reimbursement)
class ReimbursementAdmin(admin.ModelAdmin):
    list_display = ('employee', 'expense_type', 'amount', 'status', 'submitted_at')
    list_filter = ('status',)
    raw_id_fields = ('employee', 'reviewed_by')


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ('employee', 'month', 'year', 'gross_salary', 'net_salary', 'status', 'generated_date')
    list_filter = ('status', 'month', 'year')
    search_fields = ('employee__user__first_name', 'employee__user__last_name', 'employee__employee_id')
    raw_id_fields = ('employee', 'generated_by')


@admin.register(PayslipEarning)
class PayslipEarningAdmin(admin.ModelAdmin):
    list_display = ('payslip', 'name', 'amount')
    raw_id_fields = ('payslip',)


@admin.register(PayslipDeduction)
class PayslipDeductionAdmin(admin.ModelAdmin):
    list_display = ('payslip', 'name', 'amount')
    raw_id_fields = ('payslip',)
