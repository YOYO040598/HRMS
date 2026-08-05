from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from apps.attendance.models import Attendance, AttendanceBreak, AttendanceLog


def check_in(employee, ip_address=None, device_info=None, location=None):
    today = timezone.now().date()
    now = timezone.now()

    attendance, created = Attendance.objects.get_or_create(
        employee=employee,
        date=today,
        defaults={
            'status': 'PRESENT',
            'check_in': now,
        }
    )

    if not created and attendance.check_in:
        return attendance, False, 'Already checked in today'

    if created or not attendance.check_in:
        attendance.check_in = now
        attendance.status = 'PRESENT'
        attendance.save(update_fields=['check_in', 'status'])

    AttendanceLog.objects.create(
        employee=employee,
        attendance=attendance,
        action='CHECK_IN',
        ip_address=ip_address,
        device_info=device_info or '',
        location=location or '',
    )

    work_start = now.replace(hour=9, minute=0, second=0, microsecond=0)
    if now > work_start + timedelta(minutes=15):
        attendance.status = 'LATE'
        attendance.save(update_fields=['status'])

    return attendance, True, 'Checked in successfully'


def check_out(employee, ip_address=None):
    today = timezone.now().date()
    now = timezone.now()

    try:
        attendance = Attendance.objects.get(employee=employee, date=today)
    except Attendance.DoesNotExist:
        return None, False, 'No check-in record found today'

    if attendance.check_out:
        return attendance, False, 'Already checked out today'

    attendance.check_out = now

    if attendance.check_in:
        delta = now - attendance.check_in
        hours = delta.total_seconds() / 3600
        attendance.total_hours = round(hours, 2)

        if hours > 8:
            attendance.overtime_hours = round(hours - 8, 2)

        if hours < 4:
            attendance.status = 'HALF_DAY'
        elif attendance.status != 'LATE':
            attendance.status = 'PRESENT'

    attendance.save(update_fields=['check_out', 'total_hours', 'overtime_hours', 'status'])

    AttendanceLog.objects.create(
        employee=employee,
        attendance=attendance,
        action='CHECK_OUT',
        ip_address=ip_address,
    )

    return attendance, True, 'Checked out successfully'


def start_break(attendance, break_type='LUNCH', notes=''):
    if not attendance.check_in:
        return None, False, 'Must check in before taking a break'

    if attendance.check_out:
        return None, False, 'Cannot take a break after checkout'

    active_break = attendance.breaks.filter(end_time__isnull=True).first()
    if active_break:
        return None, False, 'Already on a break'

    break_obj = AttendanceBreak.objects.create(
        attendance=attendance,
        break_type=break_type,
        start_time=timezone.now(),
        notes=notes,
    )

    AttendanceLog.objects.create(
        employee=attendance.employee,
        attendance=attendance,
        action='BREAK_START',
    )

    return break_obj, True, 'Break started'


def end_break(attendance):
    active_break = attendance.breaks.filter(end_time__isnull=True).first()
    if not active_break:
        return None, False, 'No active break found'

    active_break.end_time = timezone.now()
    delta = active_break.end_time - active_break.start_time
    active_break.duration_minutes = int(delta.total_seconds() / 60)
    active_break.save(update_fields=['end_time', 'duration_minutes'])

    AttendanceLog.objects.create(
        employee=attendance.employee,
        attendance=attendance,
        action='BREAK_END',
    )

    return active_break, True, 'Break ended'


def mark_absent(employee, date=None, reason=''):
    date = date or timezone.now().date()

    attendance, created = Attendance.objects.get_or_create(
        employee=employee,
        date=date,
        defaults={'status': 'ABSENT'}
    )

    if not created:
        attendance.status = 'ABSENT'
        attendance.notes = reason
        attendance.save(update_fields=['status', 'notes'])

    return attendance


def approve_attendance(attendance, approved_by, comments=''):
    attendance.is_approved = True
    attendance.approved_by = approved_by
    attendance.save(update_fields=['is_approved', 'approved_by'])
    return attendance


def get_monthly_attendance(employee, year, month):
    return Attendance.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    ).order_by('date')


def get_attendance_summary(employee, year, month):
    attendances = get_monthly_attendance(employee, year, month)
    total_days = attendances.count()
    present_days = attendances.filter(status__in=['PRESENT', 'LATE', 'WFH']).count()
    absent_days = attendances.filter(status='ABSENT').count()
    half_days = attendances.filter(status='HALF_DAY').count()
    total_hours = sum(a.total_hours for a in attendances)
    overtime_hours = sum(a.overtime_hours for a in attendances)

    return {
        'total_days': total_days,
        'present_days': present_days,
        'absent_days': absent_days,
        'half_days': half_days,
        'total_hours': round(total_hours, 2),
        'overtime_hours': round(overtime_hours, 2),
    }
