from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.leave_management.views import (
    LeaveTypeViewSet, LeaveBalanceViewSet,
    LeaveApplicationViewSet, LeaveApprovalViewSet, HolidayViewSet,
    ApplyLeaveView, ApproveLeaveView, RejectLeaveView,
    LeaveBalanceSummaryView, PendingApprovalsView, LeaveHistoryView,
    CancelLeaveView,
)

router = DefaultRouter()
router.register(r'types', LeaveTypeViewSet)
router.register(r'balances', LeaveBalanceViewSet)
router.register(r'applications', LeaveApplicationViewSet)
router.register(r'approvals', LeaveApprovalViewSet)
router.register(r'holidays', HolidayViewSet)

urlpatterns = [
    path('apply/', ApplyLeaveView.as_view(), name='leave-apply'),
    path('approve/', ApproveLeaveView.as_view(), name='leave-approve'),
    path('reject/', RejectLeaveView.as_view(), name='leave-reject'),
    path('balance-summary/', LeaveBalanceSummaryView.as_view(), name='leave-balance-summary'),
    path('pending-approvals/', PendingApprovalsView.as_view(), name='leave-pending-approvals'),
    path('history/', LeaveHistoryView.as_view(), name='leave-history'),
    path('cancel/', CancelLeaveView.as_view(), name='leave-cancel'),
    path('', include(router.urls)),
]
