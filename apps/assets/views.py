from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from apps.assets.models import Asset, AssetAssignment, AssetReturn, AssetHistory, AssetRequest
from apps.assets.serializers import (
    AssetSerializer, AssetAssignmentSerializer,
    AssetReturnSerializer, AssetHistorySerializer,
    AssetRequestSerializer,
)
from apps.assets.filters import AssetFilter, AssetAssignmentFilter
from apps.assets.services import (
    assign_asset, return_asset, transfer_asset,
    mark_asset_maintenance, retire_asset,
    get_asset_history, get_employee_assets, get_asset_stats,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class AssetViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = AssetFilter
    search_fields = ['name', 'asset_code', 'serial_number', 'brand']
    ordering_fields = ['name', 'purchase_date', 'status']
    ordering = ['name']


class AssetAssignmentViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AssetAssignment.objects.select_related(
        'asset', 'employee__user', 'assigned_by'
    ).all()
    serializer_class = AssetAssignmentSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = AssetAssignmentFilter

    def get_permissions(self):
        if self.action == 'acknowledge':
            return [IsAuthenticated()]
        return [IsHROrAdmin()]

    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        from django.utils import timezone
        assignment = self.get_object()
        
        if assignment.employee.user != request.user:
            return self.error_response("You are not authorized to acknowledge this asset assignment")
        
        status_val = request.data.get('status', 'ACCEPTED')
        comments = request.data.get('comments', '')
        
        if status_val not in ['ACCEPTED', 'REJECTED']:
            return self.error_response("Invalid status")
            
        assignment.acceptance_status = status_val
        assignment.is_acknowledged = True
        assignment.acknowledged_at = timezone.now()
        assignment.employee_comments = comments
        assignment.save()
        
        AssetHistory.objects.create(
            asset=assignment.asset,
            action='ACKNOWLEDGED',
            description=f'Receipt acknowledged by employee ({assignment.employee.user.full_name}). Status: {status_val}. Comments: {comments}',
            performed_by=request.user
        )
        
        return self.success_response(
            AssetAssignmentSerializer(assignment).data,
            f"Asset assignment status updated to {status_val}"
        )


class AssetReturnViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AssetReturn.objects.select_related(
        'assignment__asset', 'returned_by'
    ).all()
    serializer_class = AssetReturnSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination


class AssetHistoryViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AssetHistory.objects.select_related('asset', 'performed_by').all()
    serializer_class = AssetHistorySerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_fields = ['asset']


class AssignAssetView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        asset_id = request.data.get('asset_id')
        employee_id = request.data.get('employee_id')
        condition = request.data.get('condition', 'Good')
        notes = request.data.get('notes', '')

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        assignment, success, message = assign_asset(
            asset_id, employee, request.user, condition, notes
        )

        if success:
            return self.created_response(
                AssetAssignmentSerializer(assignment).data, message
            )
        return self.error_response(message)


class ReturnAssetView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        assignment_id = request.data.get('assignment_id')
        condition = request.data.get('condition', 'Good')
        remarks = request.data.get('remarks', '')
        is_damaged = request.data.get('is_damaged', False)
        damage_report = request.data.get('damage_report', '')

        assignment, success, message = return_asset(
            assignment_id, request.user, condition, remarks, is_damaged, damage_report
        )

        if success:
            from apps.assets.models import AssetRequest
            AssetRequest.objects.filter(
                employee=assignment.employee,
                assigned_asset=assignment.asset,
                request_type='RETURN',
                status='PENDING'
            ).update(
                status='APPROVED',
                approved_by=request.user,
                comments=remarks
            )
            return self.success_response(
                AssetAssignmentSerializer(assignment).data, message
            )
        return self.error_response(message)


class TransferAssetView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        asset_id = request.data.get('asset_id')
        employee_id = request.data.get('employee_id')
        notes = request.data.get('notes', '')

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        assignment, success, message = transfer_asset(
            asset_id, employee, request.user, notes
        )

        if success:
            return self.success_response(
                AssetAssignmentSerializer(assignment).data, message
            )
        return self.error_response(message)


class AssetStatsView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        stats = get_asset_stats(company)
        return self.success_response(stats)


class EmployeeAssetsView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        assets = get_employee_assets(employee)
        return self.success_response(
            AssetAssignmentSerializer(assets, many=True).data
        )


class AssetRequestViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AssetRequest.objects.select_related('employee__user', 'approved_by', 'assigned_asset').all()
    serializer_class = AssetRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ['status', 'asset_category']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id', 'reason']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return self.queryset.none()
        if user.is_superuser or getattr(user, 'is_staff', False) or user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']:
            return self.queryset
        try:
            employee = user.employee_profile
            return self.queryset.filter(employee=employee)
        except Exception:
            return self.queryset.none()

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee_profile
        except Exception:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must have an employee profile to request assets")
        serializer.save(employee=employee, status='PENDING')

    @action(detail=True, methods=['post'], permission_classes=[IsHROrAdmin], url_path='approve')
    def approve(self, request, pk=None):
        asset_request = self.get_object()
        asset_id = request.data.get('asset_id')
        comments = request.data.get('comments', '')

        if asset_request.status != 'PENDING':
            return self.error_response("This request has already been processed")

        if not asset_id:
            return self.error_response("Asset ID is required for approval")

        try:
            asset = Asset.objects.get(id=asset_id, status='AVAILABLE')
        except Asset.DoesNotExist:
            return self.error_response("Selected asset is not available")

        from apps.assets.services import assign_asset
        assignment, success, message = assign_asset(
            asset.id, asset_request.employee, request.user, 'GOOD', f"Assigned via request approval. {comments}"
        )

        if not success:
            return self.error_response(message)

        asset_request.status = 'APPROVED'
        asset_request.approved_by = request.user
        asset_request.comments = comments
        asset_request.assigned_asset = asset
        asset_request.save()

        return self.success_response(
            AssetRequestSerializer(asset_request).data,
            "Asset request approved and asset assigned"
        )

    @action(detail=True, methods=['post'], permission_classes=[IsHROrAdmin], url_path='reject')
    def reject(self, request, pk=None):
        asset_request = self.get_object()
        comments = request.data.get('comments', '')

        if asset_request.status != 'PENDING':
            return self.error_response("This request has already been processed")

        asset_request.status = 'REJECTED'
        asset_request.approved_by = request.user
        asset_request.comments = comments
        asset_request.save()

        return self.success_response(
            AssetRequestSerializer(asset_request).data,
            "Asset request rejected"
        )
