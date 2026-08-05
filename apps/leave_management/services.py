from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from apps.leave_management.models import LeaveType, LeaveBalance, LeaveApplication, LeaveApproval

User = get_user_model()


def get_or_create_leave_balance(employee, leave_type, year):
    balance, created = LeaveBalance.objects.get_or_create(
        employee=employee,
        leave_type=leave_type,
        year=year,
        defaults={
            'total_days': leave_type.days_per_year,
            'used_days': 0,
            'pending_days': 0,
            'carry_forward_days': 0,
        }
    )
    return balance


def calculate_leave_days(start_date, end_date):
    delta = (end_date - start_date).days + 1
    return max(delta, 0)


def apply_leave(employee, leave_type_id, start_date, end_date, reason, is_emergency=False, attachment=None):
    with transaction.atomic():
        try:
            leave_type = LeaveType.objects.get(id=leave_type_id, is_active=True)
        except LeaveType.DoesNotExist:
            return None, False, 'Invalid leave type'

        total_days = calculate_leave_days(start_date, end_date)
        if total_days <= 0:
            return None, False, 'Invalid date range'

        year = start_date.year
        balance = get_or_create_leave_balance(employee, leave_type, year)

        if balance.available_days < total_days:
            return None, False, f'Insufficient leave balance. Available: {balance.available_days} days'

        application = LeaveApplication.objects.create(
            employee=employee,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            reason=reason,
            status='PENDING',
            is_emergency=is_emergency,
            attachment=attachment,
        )

        balance.pending_days += total_days
        balance.save(update_fields=['pending_days'])

        create_approval_chain(application, employee)

        from apps.notifications.services import notify_leave_applied
        notify_leave_applied(application)

        return application, True, 'Leave application submitted'


def create_approval_chain(application, employee):
    from apps.employees.models import Employee

    if employee.reporting_to:
        LeaveApproval.objects.create(
            leave_application=application,
            approver=employee.reporting_to.user,
            status='PENDING',
            level=1,
        )

    hr_user = User.objects.filter(
        employee_profile__company=employee.company,
        role__in=['HR_ADMIN', 'HR_EXECUTIVE']
    ).first()
    if hr_user:
        LeaveApproval.objects.create(
            leave_application=application,
            approver=hr_user,
            status='PENDING',
            level=2,
        )


def approve_leave(approval_id, approver, comments=''):
    with transaction.atomic():
        try:
            approval = LeaveApproval.objects.select_related(
                'leave_application', 'leave_application__employee'
            ).get(id=approval_id, status='PENDING')
        except LeaveApproval.DoesNotExist:
            return None, False, 'Approval not found or already processed'

        approval.status = 'APPROVED'
        approval.comments = comments
        approval.approved_at = timezone.now()
        approval.save(update_fields=['status', 'comments', 'approved_at'])

        application = approval.leave_application

        # Admin can bypass all remaining levels
        is_admin = approver.role in ['ADMIN', 'HR_ADMIN']

        if is_admin:
            # Auto-approve all remaining pending approvals
            LeaveApproval.objects.filter(
                leave_application=application,
                status='PENDING',
            ).update(status='APPROVED', comments='Auto-approved by admin', approved_at=timezone.now())

        higher_approvals = LeaveApproval.objects.filter(
            leave_application=application,
            level__gt=approval.level,
            status='PENDING',
        )

        if is_admin or not higher_approvals.exists():
            application.status = 'APPROVED'
            application.reviewed_by = approver
            application.reviewed_at = timezone.now()
            application.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

            balance = LeaveBalance.objects.filter(
                employee=application.employee,
                leave_type=application.leave_type,
                year=application.start_date.year,
            ).first()

            if balance:
                balance.pending_days -= application.total_days
                balance.used_days += application.total_days
                balance.save(update_fields=['pending_days', 'used_days'])

            from apps.notifications.services import notify_leave_status
            notify_leave_status(application)

        return approval, True, 'Leave approved'


def reject_leave(approval_id, approver, comments=''):
    with transaction.atomic():
        try:
            approval = LeaveApproval.objects.select_related(
                'leave_application'
            ).get(id=approval_id, status='PENDING')
        except LeaveApproval.DoesNotExist:
            return None, False, 'Approval not found or already processed'

        approval.status = 'REJECTED'
        approval.comments = comments
        approval.approved_at = timezone.now()
        approval.save(update_fields=['status', 'comments', 'approved_at'])

        application = approval.leave_application
        application.status = 'REJECTED'
        application.reviewed_by = approver
        application.reviewed_at = timezone.now()
        application.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        balance = LeaveBalance.objects.filter(
            employee=application.employee,
            leave_type=application.leave_type,
            year=application.start_date.year,
        ).first()

        if balance:
            balance.pending_days -= application.total_days
            balance.save(update_fields=['pending_days'])

        from apps.notifications.services import notify_leave_status
        notify_leave_status(application)

        return approval, True, 'Leave rejected'


def cancel_leave(application_id, employee):
    with transaction.atomic():
        try:
            application = LeaveApplication.objects.get(
                id=application_id,
                employee=employee,
                status__in=['DRAFT', 'PENDING'],
            )
        except LeaveApplication.DoesNotExist:
            return None, False, 'Application not found or cannot be cancelled'

        application.status = 'CANCELLED'
        application.save(update_fields=['status'])

        balance = LeaveBalance.objects.filter(
            employee=employee,
            leave_type=application.leave_type,
            year=application.start_date.year,
        ).first()

        if balance:
            balance.pending_days -= application.total_days
            balance.save(update_fields=['pending_days'])

        return application, True, 'Leave cancelled'


def get_leave_balance_summary(employee, year=None):
    year = year or timezone.now().year
    balances = LeaveBalance.objects.filter(
        employee=employee, year=year
    ).select_related('leave_type')

    summary = []
    for balance in balances:
        summary.append({
            'id': balance.id,
            'leave_type_name': balance.leave_type.name,
            'total_days': balance.total_days,
            'used_days': balance.used_days,
            'pending_days': balance.pending_days,
            'available_days': balance.available_days,
            'carry_forward_days': balance.carry_forward_days,
        })
    return summary


def get_pending_approvals(approver):
    return LeaveApproval.objects.filter(
        approver=approver,
        status='PENDING',
        leave_application__status='PENDING',
    ).select_related(
        'leave_application__employee__user',
        'leave_application__leave_type',
    )


def get_leave_history(employee, year=None):
    year = year or timezone.now().year
    return LeaveApplication.objects.filter(
        employee=employee,
        start_date__year=year,
    ).select_related('leave_type', 'reviewed_by').order_by('-applied_at')
