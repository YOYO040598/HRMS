from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class LeaveType(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    days_per_year = models.PositiveIntegerField(default=0)
    is_paid = models.BooleanField(default=True)
    is_carry_forward = models.BooleanField(default=False)
    max_carry_forward_days = models.PositiveIntegerField(default=0)
    is_encashable = models.BooleanField(default=False)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Leave Type'
        verbose_name_plural = 'Leave Types'
        ordering = ['name']

    def __str__(self):
        return self.name


class LeaveBalance(BaseModel):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    year = models.PositiveIntegerField()
    total_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    used_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pending_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    carry_forward_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Leave Balance'
        verbose_name_plural = 'Leave Balances'
        unique_together = ['employee', 'leave_type', 'year']

    def __str__(self):
        return f'{self.employee} - {self.leave_type} - {self.year}'

    @property
    def available_days(self):
        return self.total_days + self.carry_forward_days - self.used_days - self.pending_days


class LeaveApplication(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='leave_applications')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='applications')
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_leaves'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    review_comments = models.TextField(blank=True, default='')
    is_emergency = models.BooleanField(default=False)
    attachment = models.FileField(upload_to='leave/attachments/', blank=True, null=True)

    class Meta:
        verbose_name = 'Leave Application'
        verbose_name_plural = 'Leave Applications'
        ordering = ['-applied_at']

    def __str__(self):
        return f'{self.employee} - {self.leave_type} - {self.start_date} to {self.end_date}'


class LeaveApproval(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    leave_application = models.ForeignKey(LeaveApplication, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_approvals', null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    level = models.PositiveIntegerField(default=1, help_text='Approval level (1=Team Lead, 2=HR)')
    comments = models.TextField(blank=True, default='')
    approved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Leave Approval'
        verbose_name_plural = 'Leave Approvals'
        ordering = ['level', '-created_at']

    def __str__(self):
        return f'{self.leave_application} - Level {self.level} - {self.status}'


class Holiday(BaseModel):
    name = models.CharField(max_length=255)
    date = models.DateField()
    is_recurring = models.BooleanField(default=True)
    description = models.TextField(blank=True, default='')
    company = models.ForeignKey(
        'organization.Company', on_delete=models.CASCADE, related_name='holidays',
        null=True, blank=True
    )

    class Meta:
        verbose_name = 'Holiday'
        verbose_name_plural = 'Holidays'
        ordering = ['date']

    def __str__(self):
        return f'{self.name} - {self.date}'
