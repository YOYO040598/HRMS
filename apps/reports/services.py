from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta


def generate_employee_report(parameters):
    from apps.employees.models import Employee

    qs = Employee.objects.filter(is_active=True)

    if 'department' in parameters:
        qs = qs.filter(department_id=parameters['department'])
    if 'company' in parameters:
        qs = qs.filter(company_id=parameters['company'])
    if 'status' in parameters:
        qs = qs.filter(status=parameters['status'])

    report_data = {
        'total_employees': qs.count(),
        'by_department': list(
            qs.values('department__name').annotate(count=Count('id')).order_by('-count')
        ),
        'by_employment_type': list(
            qs.values('employment_type').annotate(count=Count('id')).order_by('-count')
        ),
        'by_status': list(
            qs.values('status').annotate(count=Count('id')).order_by('-count')
        ),
    }

    return report_data


def generate_attendance_report(parameters):
    from apps.attendance.models import Attendance

    qs = Attendance.objects.all()

    if 'date_from' in parameters:
        qs = qs.filter(date__gte=parameters['date_from'])
    if 'date_to' in parameters:
        qs = qs.filter(date__lte=parameters['date_to'])
    if 'department' in parameters:
        qs = qs.filter(employee__department_id=parameters['department'])

    report_data = {
        'total_records': qs.count(),
        'by_status': list(
            qs.values('status').annotate(count=Count('id')).order_by('-count')
        ),
        'avg_hours': qs.aggregate(avg=Avg('total_hours'))['avg'] or 0,
        'total_overtime': qs.aggregate(total=Sum('overtime_hours'))['total'] or 0,
    }

    return report_data


def generate_leave_report(parameters):
    from apps.leave_management.models import LeaveApplication

    qs = LeaveApplication.objects.filter(status='APPROVED')

    if 'year' in parameters:
        qs = qs.filter(start_date__year=parameters['year'])
    if 'department' in parameters:
        qs = qs.filter(employee__department_id=parameters['department'])

    report_data = {
        'total_applications': qs.count(),
        'total_days_taken': qs.aggregate(total=Sum('total_days'))['total'] or 0,
        'by_leave_type': list(
            qs.values('leave_type__name').annotate(
                count=Count('id'),
                total_days=Sum('total_days'),
            ).order_by('-count')
        ),
    }

    return report_data


def generate_payroll_report(parameters):
    from apps.payroll.models import Payroll

    qs = Payroll.objects.all()

    if 'month' in parameters:
        qs = qs.filter(month=parameters['month'])
    if 'year' in parameters:
        qs = qs.filter(year=parameters['year'])
    if 'status' in parameters:
        qs = qs.filter(status=parameters['status'])

    report_data = {
        'total_payrolls': qs.count(),
        'total_gross': qs.aggregate(total=Sum('gross_salary'))['total'] or 0,
        'total_deductions': qs.aggregate(total=Sum('total_deductions'))['total'] or 0,
        'total_net': qs.aggregate(total=Sum('net_salary'))['total'] or 0,
        'by_status': list(
            qs.values('status').annotate(count=Count('id')).order_by('-count')
        ),
    }

    return report_data
