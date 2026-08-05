from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class SalaryStructure(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    basic_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=40)
    hra_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    special_allowance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    pf_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=12)
    esi_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.75)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=200)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Salary Structure'
        verbose_name_plural = 'Salary Structures'
        ordering = ['name']

    def __str__(self):
        return self.name


class Payroll(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PROCESSING = 'PROCESSING', 'Processing'
        PROCESSED = 'PROCESSED', 'Processed'
        APPROVED = 'APPROVED', 'Approved'
        PAID = 'PAID', 'Paid'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='payrolls')
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    processed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='processed_payrolls'
    )
    processed_at = models.DateTimeField(blank=True, null=True)
    paid_date = models.DateField(blank=True, null=True)
    payment_method = models.CharField(max_length=50, blank=True, default='')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Payroll'
        verbose_name_plural = 'Payrolls'
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f'{self.employee} - {self.month}/{self.year}'


class Allowance(BaseModel):
    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='allowances')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_taxable = models.BooleanField(default=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Allowance'
        verbose_name_plural = 'Allowances'

    def __str__(self):
        return f'{self.name} - {self.amount}'


class Deduction(BaseModel):
    class DeductionType(models.TextChoices):
        PF = 'PF', 'Provident Fund'
        ESI = 'ESI', 'Employee State Insurance'
        TDS = 'TDS', 'Tax Deducted at Source'
        PROFESSIONAL_TAX = 'PROFESSIONAL_TAX', 'Professional Tax'
        LOAN = 'LOAN', 'Loan EMI'
        ADVANCE = 'ADVANCE', 'Salary Advance'
        OTHER = 'OTHER', 'Other'

    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='deductions')
    deduction_type = models.CharField(max_length=30, choices=DeductionType.choices)
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Deduction'
        verbose_name_plural = 'Deductions'

    def __str__(self):
        return f'{self.name} - {self.amount}'


class Reimbursement(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        PAID = 'PAID', 'Paid'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='reimbursements')
    expense_type = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    receipt = models.FileField(upload_to='reimbursements/receipts/')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_reimbursements'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    comments = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Reimbursement'
        verbose_name_plural = 'Reimbursements'
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.employee} - {self.expense_type} - {self.amount}'


class Payslip(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED = 'ARCHIVED', 'Archived'

    employee = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='payslips')
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pdf_file = models.FileField(upload_to='payslips/', blank=True, null=True)
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='generated_payslips'
    )
    generated_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    publish_at = models.DateTimeField(blank=True, null=True)
    original_filename = models.CharField(max_length=255, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Payslip'
        verbose_name_plural = 'Payslips'
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f'Payslip - {self.employee} - {self.month}/{self.year}'


class PayslipEarning(BaseModel):
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='earnings')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Payslip Earning'
        verbose_name_plural = 'Payslip Earnings'

    def __str__(self):
        return f'{self.name} - {self.amount}'


class PayslipDeduction(BaseModel):
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='payslip_deductions')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Payslip Deduction'
        verbose_name_plural = 'Payslip Deductions'

    def __str__(self):
        return f'{self.name} - {self.amount}'


class PayslipAuditLog(BaseModel):
    class Action(models.TextChoices):
        UPLOAD = 'UPLOAD', 'Upload'
        PUBLISH = 'PUBLISH', 'Publish'
        VIEW = 'VIEW', 'View'
        DOWNLOAD = 'DOWNLOAD', 'Download'
        DELETE = 'DELETE', 'Delete'

    payslip = models.ForeignKey(Payslip, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payslip_audit_logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, default='')
    details = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Payslip Audit Log'
        verbose_name_plural = 'Payslip Audit Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.user.email if self.user else "System"} - {self.action} - {self.timestamp}'

