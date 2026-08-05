from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q, Sum, Avg
from apps.employees.models import Employee
from apps.attendance.models import Attendance
from apps.leave_management.models import LeaveApplication, LeaveBalance
from apps.payroll.models import Payroll
from apps.assets.models import Asset
from apps.exit_management.models import Resignation


def get_dashboard_stats(company=None):
    today = timezone.now().date()
    month_start = today.replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    employee_qs = Employee.objects.filter(is_active=True)
    if company:
        employee_qs = employee_qs.filter(company=company)

    total_employees = employee_qs.count()

    today_attendance = Attendance.objects.filter(date=today)
    if company:
        today_attendance = today_attendance.filter(employee__company=company)

    present_today = today_attendance.filter(
        status__in=['PRESENT', 'LATE', 'WFH']
    ).count()
    absent_today = today_attendance.filter(status='ABSENT').count()

    pending_leaves = LeaveApplication.objects.filter(status='PENDING')
    if company:
        pending_leaves = pending_leaves.filter(employee__company=company)

    active_leaves = LeaveApplication.objects.filter(
        start_date__lte=today, end_date__gte=today, status='APPROVED'
    )
    if company:
        active_leaves = active_leaves.filter(employee__company=company)

    new_joins_month = employee_qs.filter(date_of_joining__gte=month_start).count()

    exits_this_month = employee_qs.filter(
        date_of_exit__gte=month_start, date_of_exit__lte=month_end
    ).count()

    pending_resignations = Resignation.objects.filter(status='PENDING')
    if company:
        pending_resignations = pending_resignations.filter(employee__company=company)

    asset_stats = {
        'total': Asset.objects.filter(company=company).count() if company else Asset.objects.count(),
        'assigned': Asset.objects.filter(status='ASSIGNED', company=company).count() if company else Asset.objects.filter(status='ASSIGNED').count(),
    }

    payroll_month = Payroll.objects.filter(month=today.month, year=today.year)
    if company:
        payroll_month = payroll_month.filter(employee__company=company)

    payroll_stats = payroll_month.aggregate(
        total_gross=Sum('gross_salary'),
        total_deductions=Sum('total_deductions'),
        total_net=Sum('net_salary'),
    )

    return {
        'total_employees': total_employees,
        'present_today': present_today,
        'absent_today': absent_today,
        'pending_leaves': pending_leaves.count(),
        'active_leaves_today': active_leaves.count(),
        'new_joins_this_month': new_joins_month,
        'exits_this_month': exits_this_month,
        'pending_resignations': pending_resignations.count(),
        'asset_stats': asset_stats,
        'payroll_stats': {
            'total_gross': payroll_stats['total_gross'] or 0,
            'total_deductions': payroll_stats['total_deductions'] or 0,
            'total_net': payroll_stats['total_net'] or 0,
        },
    }


def get_department_breakdown(company=None):
    from apps.organization.models import Department

    departments = Department.objects.filter(is_active=True)
    if company:
        departments = departments.filter(company=company)

    breakdown = []
    for dept in departments:
        emp_count = dept.employees.filter(is_active=True).count()
        present_count = Attendance.objects.filter(
            employee__department=dept,
            date=timezone.now().date(),
            status__in=['PRESENT', 'LATE', 'WFH'],
        ).count()

        breakdown.append({
            'department': dept.name,
            'code': dept.code,
            'total_employees': emp_count,
            'present_today': present_count,
            'attendance_rate': round(present_count / emp_count * 100, 1) if emp_count > 0 else 0,
        })

    return breakdown


def get_monthly_attendance_trend(company=None, months=6):
    today = timezone.now().date()
    trend = []

    for i in range(months - 1, -1, -1):
        date = (today - timedelta(days=30 * i)).replace(day=1)
        month_end = (date + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        attendances = Attendance.objects.filter(
            date__gte=date, date__lte=month_end
        )
        if company:
            attendances = attendances.filter(employee__company=company)

        trend.append({
            'month': date.strftime('%b %Y'),
            'present': attendances.filter(status__in=['PRESENT', 'LATE', 'WFH']).count(),
            'absent': attendances.filter(status='ABSENT').count(),
            'half_day': attendances.filter(status='HALF_DAY').count(),
            'total_hours': float(attendances.aggregate(total=Sum('total_hours'))['total'] or 0),
        })

    return trend


def get_leave_distribution(company=None, year=None):
    year = year or timezone.now().year
    leaves = LeaveApplication.objects.filter(
        start_date__year=year, status='APPROVED'
    )
    if company:
        leaves = leaves.filter(employee__company=company)

    distribution = leaves.values(
        'leave_type__name'
    ).annotate(
        count=Count('id'),
        total_days=Sum('total_days'),
    ).order_by('-count')

    return list(distribution)


def get_payroll_trend(company=None, months=6):
    today = timezone.now().date()
    trend = []

    for i in range(months - 1, -1, -1):
        month = today.month - i
        year = today.year
        if month <= 0:
            month += 12
            year -= 1

        payrolls = Payroll.objects.filter(month=month, year=year)
        if company:
            payrolls = payrolls.filter(employee__company=company)

        stats = payrolls.aggregate(
            total_gross=Sum('gross_salary'),
            total_net=Sum('net_salary'),
            count=Count('id'),
        )

        trend.append({
            'month': f'{month}/{year}',
            'total_gross': stats['total_gross'] or 0,
            'total_net': stats['total_net'] or 0,
            'employee_count': stats['count'] or 0,
        })

    return trend
