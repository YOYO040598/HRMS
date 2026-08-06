from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.exit_management.models import Resignation, ExitApproval, FullAndFinal, ExperienceLetter

User = get_user_model()


def apply_resignation(employee, last_working_day, reason, notice_period_days=30):
    with transaction.atomic():
        existing_active = Resignation.objects.filter(
            employee=employee,
            status__in=['DRAFT', 'PENDING', 'APPROVED', 'ACCEPTED'],
        ).exists()

        if existing_active:
            return None, False, 'You already have an active resignation'

        resignation = Resignation.objects.create(
            employee=employee,
            last_working_day=last_working_day,
            reason=reason,
            notice_period_days=notice_period_days,
            status='PENDING',
        )

        create_exit_approval_chain(resignation, employee)

        # Notify HR & active level 1 approver
        try:
            from apps.notifications.services import notify_resignation_applied, create_notification
            notify_resignation_applied(resignation)
            first_approval = resignation.approvals.filter(status='PENDING').order_by('level').first()
            if first_approval:
                create_notification(
                    user=first_approval.approver,
                    notification_type='EXIT',
                    title='Resignation Approval Required',
                    message=f'Exit clearance approval requested for {employee.user.full_name}.',
                    action_url=f'/exit/resignations/{resignation.id}',
                )
        except Exception as e:
            print("Failed to send resignation notification:", e)

        return resignation, True, 'Resignation submitted'


def create_exit_approval_chain(resignation, employee):
    approvers = []

    if employee.reporting_to:
        approvers.append(employee.reporting_to.user)

    hr_user = User.objects.filter(
        employee_profile__company=employee.company,
        role__in=['HR_ADMIN', 'HR_EXECUTIVE']
    ).first()
    if hr_user:
        approvers.append(hr_user)

    for level, approver in enumerate(approvers, 1):
        ExitApproval.objects.create(
            resignation=resignation,
            approver=approver,
            status='PENDING',
            level=level,
        )


def approve_resignation(approval_id, approver, comments=''):
    with transaction.atomic():
        try:
            approval = ExitApproval.objects.select_related(
                'resignation'
            ).get(id=approval_id, status='PENDING')
        except ExitApproval.DoesNotExist:
            return None, False, 'Approval not found or already processed'

        approval.status = 'APPROVED'
        approval.comments = comments
        approval.approved_at = timezone.now()
        approval.save(update_fields=['status', 'comments', 'approved_at'])

        resignation = approval.resignation
        higher_approvals = ExitApproval.objects.filter(
            resignation=resignation,
            level__gt=approval.level,
            status='PENDING',
        )

        try:
            from apps.notifications.services import create_notification
            if not higher_approvals.exists():
                resignation.status = 'APPROVED'
                resignation.approved_by = approver
                resignation.approved_date = timezone.now().date()
                resignation.save(update_fields=['status', 'approved_by', 'approved_date'])
                
                create_notification(
                    user=resignation.employee.user,
                    notification_type='EXIT',
                    title='Resignation Approved',
                    message=f'Your resignation has been approved. Last working day: {resignation.last_working_day}',
                    action_url='/emp/exit',
                )
            else:
                next_approval = higher_approvals.order_by('level').first()
                if next_approval:
                    create_notification(
                        user=next_approval.approver,
                        notification_type='EXIT',
                        title='Resignation Approval Required',
                        message=f'Exit clearance approval requested for {resignation.employee.user.full_name}.',
                        action_url=f'/exit/resignations/{resignation.id}',
                    )
        except Exception as e:
            print("Failed to send approval notification:", e)

        return approval, True, 'Resignation approved'


def reject_resignation(approval_id, approver, comments=''):
    with transaction.atomic():
        try:
            approval = ExitApproval.objects.select_related(
                'resignation'
            ).get(id=approval_id, status='PENDING')
        except ExitApproval.DoesNotExist:
            return None, False, 'Approval not found or already processed'

        approval.status = 'REJECTED'
        approval.comments = comments
        approval.approved_at = timezone.now()
        approval.save(update_fields=['status', 'comments', 'approved_at'])

        resignation = approval.resignation
        resignation.status = 'REJECTED'
        resignation.save(update_fields=['status'])

        try:
            from apps.notifications.services import create_notification
            create_notification(
                user=resignation.employee.user,
                notification_type='EXIT',
                title='Resignation Rejected',
                message=f'Your resignation request was rejected. Remarks: {comments}',
                action_url='/emp/exit',
            )
        except Exception as e:
            print("Failed to send rejection notification:", e)

        return approval, True, 'Resignation rejected'


def relieve_employee(resignation_id, relieved_by):
    with transaction.atomic():
        try:
            resignation = Resignation.objects.get(
                id=resignation_id, status='APPROVED'
            )
        except Resignation.DoesNotExist:
            return None, False, 'Resignation not found or not approved'

        employee = resignation.employee
        employee.status = 'EXITED'
        employee.date_of_exit = resignation.last_working_day
        employee.is_active = False
        employee.save(update_fields=['status', 'date_of_exit', 'is_active'])

        resignation.is_relieved = True
        resignation.relieved_date = timezone.now().date()
        resignation.save(update_fields=['is_relieved', 'relieved_date'])

        company = employee.company
        company.employee_count = company.employees.filter(is_active=True).count()
        company.save(update_fields=['employee_count'])

        return resignation, True, 'Employee relieved'


def init_fnf(employee, resignation):
    with transaction.atomic():
        fnf = FullAndFinal.objects.create(
            employee=employee,
            resignation=resignation,
            status='IN_PROGRESS',
        )

        pending_assets = employee.asset_assignments.filter(is_returned=False)
        if pending_assets.exists():
            fnf.assets_returned = False
        else:
            fnf.assets_returned = True

        fnf.save(update_fields=['assets_returned'])
        return fnf


def complete_fnf(fnf_id, completed_by, final_amount=0):
    with transaction.atomic():
        try:
            fnf = FullAndFinal.objects.get(id=fnf_id, status='IN_PROGRESS')
        except FullAndFinal.DoesNotExist:
            return None, False, 'F&F not found or not in progress'

        fnf.status = 'COMPLETED'
        fnf.final_settlement_amount = final_amount
        fnf.completed_by = completed_by
        fnf.completed_date = timezone.now().date()
        fnf.documents_submitted = True
        fnf.access_revoked = True
        fnf.save()

        return fnf, True, 'F&F completed'


def generate_experience_letter(employee, issued_by, content=''):
    letter = ExperienceLetter.objects.create(
        employee=employee,
        issued_by=issued_by,
        content=content or generate_experience_content(employee),
    )
    return letter


def generate_experience_content(employee):
    return (
        f"To whom it may concern,\n\n"
        f"This is to certify that {employee.user.full_name} "
        f"(Employee ID: {employee.employee_id}) was employed with us "
        f"as {employee.designation.name if employee.designation else 'Employee'} "
        f"in the {employee.department.name if employee.department else 'N/A'} department "
        f"from {employee.date_of_joining} to {employee.date_of_exit or 'present'}.\n\n"
        f"During their tenure, they have been found to be sincere, hardworking, "
        f"and dedicated to their duties.\n\n"
        f"We wish them all the best in their future endeavors.\n\n"
        f"Regards,\nHR Department"
    )
