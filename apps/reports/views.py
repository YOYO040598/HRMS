from rest_framework import viewsets, generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.reports.models import Report
from apps.reports.serializers import ReportSerializer
from apps.reports.services import (
    generate_employee_report, generate_attendance_report,
    generate_leave_report, generate_payroll_report,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class ReportViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Report.objects.select_related('created_by').all()
    serializer_class = ReportSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'last_generated']
    ordering = ['-created_at']
    filterset_fields = ['report_type', 'is_scheduled']


class GenerateReportView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = ReportSerializer

    @extend_schema(
        request=inline_serializer('GenerateReportRequest', fields={
            'report_type': serializers.CharField(),
            'parameters': serializers.JSONField(required=False, default=dict),
        }),
        responses={200: ReportSerializer}
    )
    def post(self, request, *args, **kwargs):
        report_type = request.data.get('report_type')
        parameters = request.data.get('parameters', {})

        generators = {
            'EMPLOYEE': generate_employee_report,
            'ATTENDANCE': generate_attendance_report,
            'LEAVE': generate_leave_report,
            'PAYROLL': generate_payroll_report,
        }

        generator = generators.get(report_type)
        if not generator:
            return self.error_response(f'Unknown report type: {report_type}')

        report = Report.objects.create(
            name=f'{report_type} Report - {timezone.now().strftime("%Y-%m-%d")}',
            report_type=report_type,
            parameters=parameters,
            created_by=request.user,
        )

        try:
            result = generator(parameters)
            report.status = 'COMPLETED'
            report.save(update_fields=['status'])
        except Exception as e:
            report.status = 'FAILED'
            report.save(update_fields=['status'])
            return self.error_response(f'Report generation failed: {str(e)}')

        return self.success_response(
            ReportSerializer(report).data, 'Report generated successfully'
        )
