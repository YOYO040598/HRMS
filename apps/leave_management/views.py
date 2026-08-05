from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated

from apps.leave_management.models import LeaveType, LeaveBalance, LeaveApplication, LeaveApproval, Holiday
from apps.leave_management.serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveApplicationListSerializer, LeaveApplicationDetailSerializer,
    LeaveApprovalSerializer, HolidaySerializer,
)
from apps.leave_management.filters import LeaveApplicationFilter, LeaveBalanceFilter, HolidayFilter
from apps.leave_management.services import (
    apply_leave, approve_leave, reject_leave, cancel_leave,
    get_leave_balance_summary, get_pending_approvals, get_leave_history,
)
from apps.accounts.permissions import IsHROrAdmin, IsManagerOrAbove
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class LeaveTypeViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    pagination_class = StandardPagination
    search_fields = ['name']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class LeaveBalanceViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee__user', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = LeaveBalanceFilter

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class LeaveApplicationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = LeaveApplication.objects.select_related(
        'employee__user', 'leave_type', 'reviewed_by'
    ).all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = LeaveApplicationFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    ordering_fields = ['applied_at', 'start_date', 'status']
    ordering = ['-applied_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']:
            return qs
        return qs.filter(employee=user.employee_profile)

    def get_serializer_class(self):
        if self.action == 'list':
            return LeaveApplicationListSerializer
        return LeaveApplicationDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class LeaveApprovalViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = LeaveApproval.objects.select_related('leave_application', 'approver').all()
    serializer_class = LeaveApprovalSerializer
    permission_classes = [IsManagerOrAbove]
    pagination_class = StandardPagination
    filterset_fields = ['leave_application', 'status', 'level']


class HolidayViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['name']
    ordering_fields = ['date', 'name']
    ordering = ['date']
    filterset_class = HolidayFilter


class ApplyLeaveView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from datetime import date
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        from django.utils.dateparse import parse_date
        start_date = parse_date(request.data.get('start_date', ''))
        end_date = parse_date(request.data.get('end_date', ''))

        if not start_date or not end_date:
            return self.error_response('Start date and end date are required')

        application, success, message = apply_leave(
            employee=employee,
            leave_type_id=request.data.get('leave_type'),
            start_date=start_date,
            end_date=end_date,
            reason=request.data.get('reason', ''),
            is_emergency=request.data.get('is_emergency', False),
        )

        if success:
            return self.created_response(
                LeaveApplicationDetailSerializer(application).data, message
            )
        return self.error_response(message)


class ApproveLeaveView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]

    def post(self, request, *args, **kwargs):
        approval_id = request.data.get('approval_id')
        comments = request.data.get('comments', '')

        approval, success, message = approve_leave(approval_id, request.user, comments)

        if success:
            return self.success_response(
                LeaveApprovalSerializer(approval).data, message
            )
        return self.error_response(message)


class RejectLeaveView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]

    def post(self, request, *args, **kwargs):
        approval_id = request.data.get('approval_id')
        comments = request.data.get('comments', '')

        approval, success, message = reject_leave(approval_id, request.user, comments)

        if success:
            return self.success_response(
                LeaveApprovalSerializer(approval).data, message
            )
        return self.error_response(message)


class LeaveBalanceSummaryView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        year = request.query_params.get('year')
        summary = get_leave_balance_summary(employee, int(year) if year else None)
        return self.success_response(summary)


class PendingApprovalsView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]

    def get(self, request, *args, **kwargs):
        approvals = get_pending_approvals(request.user)
        return self.success_response(
            LeaveApprovalSerializer(approvals, many=True).data
        )


class LeaveHistoryView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        year = request.query_params.get('year')
        history = get_leave_history(employee, int(year) if year else None)
        return self.success_response(
            LeaveApplicationListSerializer(history, many=True).data
        )


class CancelLeaveView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        application_id = request.data.get('application_id')
        if not application_id:
            return self.error_response('application_id is required')

        application, success, message = cancel_leave(application_id, employee)

        if success:
            return self.success_response(
                LeaveApplicationDetailSerializer(application).data, message
            )
        return self.error_response(message)
