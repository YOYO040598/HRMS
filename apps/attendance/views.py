from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from apps.attendance.models import Attendance, AttendanceBreak, AttendanceLog, AttendanceApproval
from apps.attendance.serializers import (
    AttendanceListSerializer, AttendanceDetailSerializer,
    AttendanceBreakSerializer, AttendanceLogSerializer, AttendanceApprovalSerializer,
)
from apps.attendance.filters import AttendanceFilter
from apps.attendance.services import (
    check_in, check_out, start_break, end_break, approve_attendance,
    get_monthly_attendance, get_attendance_summary,
)
from apps.accounts.permissions import IsHROrAdmin, IsManagerOrAbove
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class AttendanceViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee__user', 'approved_by').all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = AttendanceFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['date', 'check_in', 'total_hours']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return AttendanceListSerializer
        return AttendanceDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class CheckInView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        attendance, success, message = check_in(
            employee,
            ip_address=request.META.get('REMOTE_ADDR'),
            device_info=request.META.get('HTTP_USER_AGENT', ''),
        )

        if success:
            return self.created_response(
                AttendanceDetailSerializer(attendance).data, message
            )
        return self.error_response(message)


class CheckOutView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        attendance, success, message = check_out(
            employee,
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        if success:
            return self.success_response(
                AttendanceDetailSerializer(attendance).data, message
            )
        return self.error_response(message)


class AttendanceBreakViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AttendanceBreak.objects.all()
    serializer_class = AttendanceBreakSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['attendance']


class AttendanceLogViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'action']


class AttendanceApprovalViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = AttendanceApproval.objects.all()
    serializer_class = AttendanceApprovalSerializer
    permission_classes = [IsManagerOrAbove]
    pagination_class = StandardPagination
    filterset_fields = ['attendance', 'status']


class MonthlyAttendanceView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        year = request.query_params.get('year', timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)

        attendances = get_monthly_attendance(employee, int(year), int(month))
        summary = get_attendance_summary(employee, int(year), int(month))

        return self.success_response({
            'attendances': AttendanceListSerializer(attendances, many=True).data,
            'summary': summary,
        })


class ApproveAttendanceView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]

    def post(self, request, *args, **kwargs):
        attendance_id = request.data.get('attendance_id')
        try:
            attendance = Attendance.objects.get(id=attendance_id)
        except Attendance.DoesNotExist:
            return self.error_response('Attendance not found')

        attendance = approve_attendance(attendance, request.user, request.data.get('comments', ''))
        return self.success_response(
            AttendanceDetailSerializer(attendance).data, 'Attendance approved'
        )


class StartBreakView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        today = timezone.now().date()
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            return self.error_response('No attendance record found for today')

        break_type = request.data.get('break_type', 'LUNCH')
        notes = request.data.get('notes', '')

        break_obj, success, message = start_break(attendance, break_type, notes)

        if success:
            return self.created_response(
                AttendanceBreakSerializer(break_obj).data, message
            )
        return self.error_response(message)


class EndBreakView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        today = timezone.now().date()
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            return self.error_response('No attendance record found for today')

        break_obj, success, message = end_break(attendance)

        if success:
            return self.success_response(
                AttendanceBreakSerializer(break_obj).data, message
            )
        return self.error_response(message)
