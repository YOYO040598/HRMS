from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class Resignation(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='resignations')
    last_working_day = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notice_period_days = models.PositiveIntegerField(default=30)
    applied_date = models.DateField(auto_now_add=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_resignations'
    )
    approved_date = models.DateField(blank=True, null=True)
    comments = models.TextField(blank=True, default='')
    is_relieved = models.BooleanField(default=False)
    relieved_date = models.DateField(blank=True, null=True)

    class Meta:
        verbose_name = 'Resignation'
        verbose_name_plural = 'Resignations'
        ordering = ['-applied_date']

    def __str__(self):
        return f'{self.employee} - {self.last_working_day}'


class ExitApproval(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    resignation = models.ForeignKey(Resignation, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exit_approvals')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    level = models.PositiveIntegerField(default=1)
    comments = models.TextField(blank=True, default='')
    approved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Exit Approval'
        verbose_name_plural = 'Exit Approvals'
        ordering = ['level', '-created_at']

    def __str__(self):
        return f'{self.resignation} - Level {self.level} - {self.status}'


class FullAndFinal(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'

    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='full_and_final')
    resignation = models.ForeignKey(Resignation, on_delete=models.CASCADE, related_name='full_and_final')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    final_settlement_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pending_dues = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    assets_returned = models.BooleanField(default=False)
    documents_submitted = models.BooleanField(default=False)
    access_revoked = models.BooleanField(default=False)
    completed_date = models.DateField(blank=True, null=True)
    completed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='completed_fnf'
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Full and Final Settlement'
        verbose_name_plural = 'Full and Final Settlements'

    def __str__(self):
        return f'F&F - {self.employee}'


class ExperienceLetter(BaseModel):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='experience_letters')
    issued_date = models.DateField(auto_now_add=True)
    issued_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='issued_experience_letters'
    )
    file = models.FileField(upload_to='experience_letters/')
    content = models.TextField(blank=True, default='')
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Experience Letter'
        verbose_name_plural = 'Experience Letters'
        ordering = ['-issued_date']

    def __str__(self):
        return f'Experience Letter - {self.employee}'
