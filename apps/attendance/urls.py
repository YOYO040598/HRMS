from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.attendance.views import (
    AttendanceViewSet, AttendanceBreakViewSet,
    AttendanceLogViewSet, AttendanceApprovalViewSet,
    CheckInView, CheckOutView, MonthlyAttendanceView, ApproveAttendanceView,
    StartBreakView, EndBreakView,
)

router = DefaultRouter()
router.register(r'records', AttendanceViewSet)
router.register(r'breaks', AttendanceBreakViewSet)
router.register(r'logs', AttendanceLogViewSet)
router.register(r'approvals', AttendanceApprovalViewSet)

urlpatterns = [
    path('check-in/', CheckInView.as_view(), name='attendance-check-in'),
    path('check-out/', CheckOutView.as_view(), name='attendance-check-out'),
    path('monthly/', MonthlyAttendanceView.as_view(), name='attendance-monthly'),
    path('approve/', ApproveAttendanceView.as_view(), name='attendance-approve'),
    path('start-break/', StartBreakView.as_view(), name='attendance-start-break'),
    path('end-break/', EndBreakView.as_view(), name='attendance-end-break'),
    path('', include(router.urls)),
]
