from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class Attendance(BaseModel):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        HALF_DAY = 'HALF_DAY', 'Half Day'
        LATE = 'LATE', 'Late Mark'
        WORK_FROM_HOME = 'WFH', 'Work From Home'
        HOLIDAY = 'HOLIDAY', 'Holiday'
        LEAVE = 'LEAVE', 'Leave'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABSENT)
    check_in = models.DateTimeField(blank=True, null=True)
    check_out = models.DateTimeField(blank=True, null=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_attendances'
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendances'
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f'{self.employee} - {self.date} - {self.status}'


class AttendanceBreak(BaseModel):
    class BreakType(models.TextChoices):
        LUNCH = 'LUNCH', 'Lunch'
        TEA = 'TEA', 'Tea'
        PERSONAL = 'PERSONAL', 'Personal'
        MEETING = 'MEETING', 'Meeting'
        OTHER = 'OTHER', 'Other'

    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='breaks')
    break_type = models.CharField(max_length=20, choices=BreakType.choices, default=BreakType.LUNCH)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Attendance Break'
        verbose_name_plural = 'Attendance Breaks'
        ordering = ['start_time']

    def __str__(self):
        return f'{self.get_break_type_display()} - {self.attendance}'


class AttendanceLog(BaseModel):
    class Action(models.TextChoices):
        CHECK_IN = 'CHECK_IN', 'Check In'
        CHECK_OUT = 'CHECK_OUT', 'Check Out'
        BREAK_START = 'BREAK_START', 'Break Start'
        BREAK_END = 'BREAK_END', 'Break End'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='attendance_logs')
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='logs', null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    device_info = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        verbose_name = 'Attendance Log'
        verbose_name_plural = 'Attendance Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.employee} - {self.action} - {self.timestamp}'


class AttendanceApproval(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='approvals')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='attendance_approvals'
    )
    comments = models.TextField(blank=True, default='')
    approved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Attendance Approval'
        verbose_name_plural = 'Attendance Approvals'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.attendance} - {self.status}'
