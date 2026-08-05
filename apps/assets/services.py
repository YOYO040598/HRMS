from django.db import transaction
from django.utils import timezone
from apps.assets.models import Asset, AssetAssignment, AssetReturn, AssetHistory


def create_asset(data):
    asset = Asset.objects.create(**data)
    AssetHistory.objects.create(
        asset=asset,
        action='CREATED',
        description=f'Asset created: {asset.name}',
    )
    return asset


def assign_asset(asset_id, employee, assigned_by, condition='Good', notes=''):
    with transaction.atomic():
        try:
            asset = Asset.objects.get(id=asset_id, status='AVAILABLE')
        except Asset.DoesNotExist:
            return None, False, 'Asset not available'

        assignment = AssetAssignment.objects.create(
            asset=asset,
            employee=employee,
            assigned_by=assigned_by,
            assigned_date=timezone.now().date(),
            condition_at_assignment=condition,
            notes=notes,
        )

        asset.status = 'ASSIGNED'
        asset.save(update_fields=['status'])

        AssetHistory.objects.create(
            asset=asset,
            action='ASSIGNED',
            description=f'Assigned to {employee.user.full_name}',
            performed_by=assigned_by,
        )

        return assignment, True, 'Asset assigned successfully'


def return_asset(assignment_id, returned_by, condition, remarks='', is_damaged=False, damage_report=''):
    with transaction.atomic():
        try:
            assignment = AssetAssignment.objects.get(id=assignment_id, is_returned=False)
        except Exception:
            # Fallback: check if assignment_id was actually an asset_id
            try:
                assignment = AssetAssignment.objects.get(asset_id=assignment_id, is_returned=False)
            except AssetAssignment.DoesNotExist:
                return None, False, 'Active assignment not found'

        assignment.is_returned = True
        assignment.actual_return_date = timezone.now().date()
        assignment.condition_at_return = condition
        assignment.save(update_fields=['is_returned', 'actual_return_date', 'condition_at_return'])

        AssetReturn.objects.create(
            assignment=assignment,
            returned_by=returned_by,
            return_date=timezone.now().date(),
            condition=condition,
            remarks=remarks,
            is_damaged=is_damaged,
            damage_report=damage_report,
        )

        assignment.asset.status = 'AVAILABLE' if not is_damaged else 'MAINTENANCE'
        assignment.asset.save(update_fields=['status'])

        AssetHistory.objects.create(
            asset=assignment.asset,
            action='RETURNED',
            description=f'Returned by {assignment.employee.user.full_name}. Condition: {condition}',
            performed_by=returned_by,
        )

        return assignment, True, 'Asset returned successfully'


def transfer_asset(asset_id, new_employee, transferred_by, notes=''):
    with transaction.atomic():
        try:
            asset = Asset.objects.get(id=asset_id, status='ASSIGNED')
        except Asset.DoesNotExist:
            return None, False, 'Asset not currently assigned'

        old_assignment = AssetAssignment.objects.filter(
            asset=asset, is_returned=False
        ).first()

        if old_assignment:
            old_assignment.is_returned = True
            old_assignment.actual_return_date = timezone.now().date()
            old_assignment.condition_at_return = 'Good'
            old_assignment.notes = f'Transferred to {new_employee.user.full_name}'
            old_assignment.save()

        new_assignment = AssetAssignment.objects.create(
            asset=asset,
            employee=new_employee,
            assigned_by=transferred_by,
            assigned_date=timezone.now().date(),
            condition_at_assignment='Good',
            notes=notes or f'Transferred from {old_assignment.employee.user.full_name if old_assignment else "unknown"}',
        )

        AssetHistory.objects.create(
            asset=asset,
            action='TRANSFERRED',
            description=f'Transferred to {new_employee.user.full_name}',
            performed_by=transferred_by,
        )

        return new_assignment, True, 'Asset transferred'


def mark_asset_maintenance(asset_id, performed_by):
    try:
        asset = Asset.objects.get(id=asset_id)
    except Asset.DoesNotExist:
        return None, False, 'Asset not found'

    asset.status = 'MAINTENANCE'
    asset.condition = 'Under Maintenance'
    asset.save(update_fields=['status', 'condition'])

    AssetHistory.objects.create(
        asset=asset,
        action='MAINTENANCE',
        description='Asset sent for maintenance',
        performed_by=performed_by,
    )

    return asset, True, 'Asset marked for maintenance'


def retire_asset(asset_id, performed_by):
    try:
        asset = Asset.objects.get(id=asset_id)
    except Asset.DoesNotExist:
        return None, False, 'Asset not found'

    asset.status = 'RETIRED'
    asset.save(update_fields=['status'])

    AssetHistory.objects.create(
        asset=asset,
        action='RETIRED',
        description='Asset retired from service',
        performed_by=performed_by,
    )

    return asset, True, 'Asset retired'


def get_asset_history(asset_id):
    return AssetHistory.objects.filter(asset_id=asset_id).select_related(
        'performed_by'
    ).order_by('-timestamp')


def get_employee_assets(employee):
    return AssetAssignment.objects.filter(
        employee=employee, is_returned=False
    ).select_related('asset')


def get_asset_stats(company=None):
    from django.db.models import Count, Q
    qs = Asset.objects.all()
    if company:
        qs = qs.filter(company=company)

    return {
        'total_assets': qs.count(),
        'available': qs.filter(status='AVAILABLE').count(),
        'assigned': qs.filter(status='ASSIGNED').count(),
        'maintenance': qs.filter(status='MAINTENANCE').count(),
        'retired': qs.filter(status='RETIRED').count(),
        'lost': qs.filter(status='LOST').count(),
    }
