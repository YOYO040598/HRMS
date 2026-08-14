from rest_framework import viewsets, generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.dashboard.models import DashboardWidget, DashboardLayout
from apps.dashboard.serializers import DashboardWidgetSerializer, DashboardLayoutSerializer
from apps.dashboard.services import (
    get_dashboard_stats, get_department_breakdown,
    get_monthly_attendance_trend, get_leave_distribution, get_payroll_trend,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class DashboardWidgetViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    ordering_fields = ['position', 'name']
    ordering = ['position']
    filterset_fields = ['widget_type', 'is_active']


class DashboardLayoutViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = DashboardLayout.objects.prefetch_related('widgets').all()
    serializer_class = DashboardLayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DashboardLayout.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(request=None, responses={200: inline_serializer('DashboardStatsResponse', fields={'total_employees': serializers.IntegerField()})})
class DashboardStatsView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        stats = get_dashboard_stats(company)
        return self.success_response(stats, 'Dashboard statistics loaded')


@extend_schema(request=None, responses={200: inline_serializer('DepartmentBreakdownResponse', fields={'departments': serializers.ListField()})})
class DepartmentBreakdownView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        breakdown = get_department_breakdown(company)
        return self.success_response(breakdown, 'Department breakdown loaded')


@extend_schema(request=None, responses={200: inline_serializer('AttendanceTrendResponse', fields={'trend': serializers.ListField()})})
class AttendanceTrendView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        trend = get_monthly_attendance_trend(company)
        return self.success_response(trend, 'Attendance trend loaded')


@extend_schema(request=None, responses={200: inline_serializer('LeaveDistributionResponse', fields={'distribution': serializers.ListField()})})
class LeaveDistributionView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        distribution = get_leave_distribution(company)
        return self.success_response(distribution, 'Leave distribution loaded')


@extend_schema(request=None, responses={200: inline_serializer('PayrollTrendResponse', fields={'trend': serializers.ListField()})})
class PayrollTrendView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        company = getattr(request.user, 'employee_profile', None)
        company = company.company if company else None
        trend = get_payroll_trend(company)
        return self.success_response(trend, 'Payroll trend loaded')
