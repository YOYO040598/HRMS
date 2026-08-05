from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated

from apps.assets.models import Asset, AssetAssignment, AssetReturn, AssetHistory
from apps.assets.serializers import (
    AssetSerializer, AssetAssignmentSerializer,
    AssetReturnSerializer, AssetHistorySerializer,
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
