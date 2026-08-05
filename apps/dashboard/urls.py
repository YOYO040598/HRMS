from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.dashboard.views import (
    DashboardWidgetViewSet, DashboardLayoutViewSet,
    DashboardStatsView, DepartmentBreakdownView,
    AttendanceTrendView, LeaveDistributionView, PayrollTrendView,
)

router = DefaultRouter()
router.register(r'widgets', DashboardWidgetViewSet)
router.register(r'layouts', DashboardLayoutViewSet)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('department-breakdown/', DepartmentBreakdownView.as_view(), name='department-breakdown'),
    path('attendance-trend/', AttendanceTrendView.as_view(), name='attendance-trend'),
    path('leave-distribution/', LeaveDistributionView.as_view(), name='leave-distribution'),
    path('payroll-trend/', PayrollTrendView.as_view(), name='payroll-trend'),
    path('', include(router.urls)),
]
