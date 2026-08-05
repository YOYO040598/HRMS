from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification, NotificationTemplate, NotificationPreference

User = get_user_model()


def create_notification(user, notification_type, title, message, action_url='', metadata=None):
    try:
        preference = NotificationPreference.objects.get(user=user)
    except NotificationPreference.DoesNotExist:
        preference = NotificationPreference.objects.create(user=user)

    type_attr = f'{notification_type.lower()}_notifications'
    if hasattr(preference, type_attr) and not getattr(preference, type_attr):
        return None

    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        metadata=metadata or {},
    )
    return notification


def mark_notification_read(notification_id, user):
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
    except Notification.DoesNotExist:
        return False

    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=['is_read', 'read_at'])
    return True


def mark_all_read(user):
    updated = Notification.objects.filter(
        user=user, is_read=False
    ).update(is_read=True, read_at=timezone.now())
    return updated


def get_unread_count(user):
    return Notification.objects.filter(user=user, is_read=False).count()


def get_user_notifications(user, notification_type=None, limit=50):
    qs = Notification.objects.filter(user=user)
    if notification_type:
        qs = qs.filter(notification_type=notification_type)
    return qs[:limit]


def notify_leave_applied(application):
    employee = application.employee
    approvers = []

    if employee.reporting_to:
        approvers.append(employee.reporting_to.user)

    hr_users = User.objects.filter(
        employee_profile__company=employee.company,
        role__in=['HR_ADMIN', 'HR_EXECUTIVE']
    )
    approvers.extend(hr_users)

    for approver in approvers:
        create_notification(
            user=approver,
            notification_type='LEAVE',
            title='New Leave Application',
            message=f'{employee.user.full_name} has applied for {application.leave_type.name} '
                    f'from {application.start_date} to {application.end_date}',
            action_url=f'/leave/applications/{application.id}',
        )


def notify_leave_status(application):
    status_text = 'approved' if application.status == 'APPROVED' else 'rejected'
    create_notification(
        user=application.employee.user,
        notification_type='LEAVE',
        title=f'Leave {status_text.title()}',
        message=f'Your {application.leave_type.name} application has been {status_text}',
        action_url=f'/leave/applications/{application.id}',
    )


def notify_attendance_marked(attendance):
    create_notification(
        user=attendance.employee.user,
        notification_type='ATTENDANCE',
        title='Attendance Marked',
        message=f'Your attendance for {attendance.date} has been marked as {attendance.status}',
    )


def notify_payroll_generated(payroll):
    create_notification(
        user=payroll.employee.user,
        notification_type='PAYROLL',
        title='Payroll Generated',
        message=f'Your salary for {payroll.month}/{payroll.year} has been processed. '
                f'Net salary: ₹{payroll.net_salary}',
        action_url=f'/payroll/payslips/{payroll.id}',
    )


def notify_resignation_applied(resignation):
    hr_users = User.objects.filter(
        employee_profile__company=resignation.employee.company,
        role__in=['HR_ADMIN', 'HR_EXECUTIVE']
    )
    for hr in hr_users:
        create_notification(
            user=hr,
            notification_type='EXIT',
            title='New Resignation',
            message=f'{resignation.employee.user.full_name} has submitted resignation. '
                    f'Last working day: {resignation.last_working_day}',
            action_url=f'/exit/resignations/{resignation.id}',
        )


def notify_asset_assigned(assignment):
    create_notification(
        user=assignment.employee.user,
        notification_type='ASSET',
        title='Asset Assigned',
        message=f'{assignment.asset.name} ({assignment.asset.asset_code}) has been assigned to you',
        action_url=f'/assets/assignments/{assignment.id}',
    )


def notify_asset_returned(assignment):
    create_notification(
        user=assignment.employee.user,
        notification_type='ASSET',
        title='Asset Return Confirmed',
        message=f'{assignment.asset.name} ({assignment.asset.asset_code}) return has been recorded',
    )


def cleanup_old_notifications(days=90):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = Notification.objects.filter(
        created_at__lt=cutoff, is_read=True
    ).delete()
    return deleted
