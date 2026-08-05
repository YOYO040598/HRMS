from django.http import HttpResponse
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from apps.payroll.models import (
    SalaryStructure, Payroll, Allowance, Deduction, Reimbursement, Payslip, PayslipAuditLog,
)
from apps.payroll.serializers import (
    SalaryStructureSerializer, PayrollListSerializer, PayrollDetailSerializer,
    AllowanceSerializer, DeductionSerializer, ReimbursementSerializer,
    PayslipListSerializer, PayslipDetailSerializer, PayslipAuditLogSerializer,
)
from apps.payroll.filters import PayrollFilter, ReimbursementFilter
from apps.payroll.services import (
    generate_payroll, process_payroll, approve_payroll, mark_payroll_paid,
    submit_reimbursement, approve_reimbursement, reject_reimbursement,
    get_payroll_summary, bulk_generate_payroll,
    generate_payslip, upload_payslip, publish_payslip,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class SalaryStructureViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['name']
    ordering = ['name']


class PayrollViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related(
        'employee__user', 'processed_by'
    ).prefetch_related('allowances', 'deductions').all()
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = PayrollFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['month', 'year', 'net_salary', 'created_at']
    ordering = ['-year', '-month']

    def get_serializer_class(self):
        if self.action == 'list':
            return PayrollListSerializer
        return PayrollDetailSerializer


class AllowanceViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Allowance.objects.all()
    serializer_class = AllowanceSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['payroll']


class DeductionViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Deduction.objects.all()
    serializer_class = DeductionSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['payroll', 'deduction_type']


class ReimbursementViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Reimbursement.objects.select_related('employee__user').all()
    serializer_class = ReimbursementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = ReimbursementFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class PayslipViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Payslip.objects.select_related('employee__user', 'generated_by').all()
    serializer_class = PayslipListSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['month', 'year', 'generated_date', 'status']
    ordering = ['-year', '-month']

    def get_queryset(self):
        # Auto-publish scheduled payslips first
        try:
            from django.utils import timezone
            from apps.payroll.services import publish_payslip
            scheduled = Payslip.objects.filter(status='DRAFT', publish_at__lte=timezone.now())
            for p in scheduled:
                publish_payslip(p.id)
        except Exception:
            pass

        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        month = self.request.query_params.get('month')
        if month:
            qs = qs.filter(month=int(month))
        year = self.request.query_params.get('year')
        if year:
            qs = qs.filter(year=int(year))
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PayslipDetailSerializer
        return PayslipListSerializer


class GeneratePayrollView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        employee_id = request.data.get('employee_id')
        month = request.data.get('month')
        year = request.data.get('year')
        salary_structure_id = request.data.get('salary_structure_id')
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')
        payroll, success, message = generate_payroll(employee, int(month), int(year), salary_structure_id)
        if success:
            return self.created_response(PayrollDetailSerializer(payroll).data, message)
        return self.error_response(message)


class ProcessPayrollView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        payroll_id = request.data.get('payroll_id')
        payroll, success, message = process_payroll(payroll_id, request.user)
        if success:
            return self.success_response(PayrollDetailSerializer(payroll).data, message)
        return self.error_response(message)


class ApprovePayrollView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        payroll_id = request.data.get('payroll_id')
        payroll, success, message = approve_payroll(payroll_id)
        if success:
            return self.success_response(PayrollDetailSerializer(payroll).data, message)
        return self.error_response(message)


class MarkPayrollPaidView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        payroll_id = request.data.get('payroll_id')
        payment_method = request.data.get('payment_method', '')
        transaction_id = request.data.get('transaction_id', '')
        payroll, success, message = mark_payroll_paid(payroll_id, payment_method, transaction_id)
        if success:
            return self.success_response(PayrollDetailSerializer(payroll).data, message)
        return self.error_response(message)


class PayrollSummaryView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')
        year = request.query_params.get('year')
        summary = get_payroll_summary(employee, int(year) if year else None)
        return self.success_response(summary)


class ApproveReimbursementView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        reimbursement_id = request.data.get('reimbursement_id')
        if not reimbursement_id:
            return self.error_response('reimbursement_id is required')
        reimbursement, success, message = approve_reimbursement(reimbursement_id, request.user, request.data.get('comments', ''))
        if success:
            return self.success_response(ReimbursementSerializer(reimbursement).data, message)
        return self.error_response(message)


class RejectReimbursementView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        reimbursement_id = request.data.get('reimbursement_id')
        if not reimbursement_id:
            return self.error_response('reimbursement_id is required')
        reimbursement, success, message = reject_reimbursement(reimbursement_id, request.user, request.data.get('comments', ''))
        if success:
            return self.success_response(ReimbursementSerializer(reimbursement).data, message)
        return self.error_response(message)


class EmployeePayrollView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        payrolls = Payroll.objects.filter(employee=employee).select_related(
            'employee__user', 'processed_by'
        ).prefetch_related('allowances', 'deductions').order_by('-year', '-month')
        if month:
            payrolls = payrolls.filter(month=int(month))
        if year:
            payrolls = payrolls.filter(year=int(year))
        serializer = PayrollDetailSerializer(payrolls, many=True)
        return self.success_response(serializer.data)


class BulkGeneratePayrollView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        month = request.data.get('month')
        year = request.data.get('year')
        salary_structure_id = request.data.get('salary_structure_id')
        if not month or not year:
            return self.error_response('month and year are required')
        results = bulk_generate_payroll(int(month), int(year), salary_structure_id)
        return self.success_response(results, f'Generated {results["created"]} payrolls, {results["skipped"]} skipped')


class DownloadPayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payslip_id, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')
        try:
            payslip = Payslip.objects.get(id=payslip_id, employee=employee)
        except Payslip.DoesNotExist:
            return self.error_response('Payslip not found')
        
        if payslip.pdf_file:
            from django.http import FileResponse
            orig_name = payslip.pdf_file.name
            ext = 'pdf' if orig_name.lower().endswith('.pdf') else 'txt'
            filename = f'payslip_{employee.employee_id}_{payslip.month}_{payslip.year}.{ext}'
            
            password_protected = request.query_params.get('password_protected') == 'true'
            file_obj = payslip.pdf_file.open('rb')
            
            if password_protected and ext == 'pdf':
                from apps.payroll.services import encrypt_pdf
                from apps.employees.models import EmployeePersonalInfo
                personal_info = getattr(employee, 'personal_info', None)
                dob = personal_info.date_of_birth if personal_info else None
                dob_str = dob.strftime('%Y%m%d') if dob else '19900101'
                password = f"{dob_str}{employee.employee_id}"
                
                encrypted_file = encrypt_pdf(file_obj, password)
                response = FileResponse(encrypted_file, as_attachment=True, filename=filename)
            else:
                response = FileResponse(file_obj, as_attachment=True, filename=filename)

            # Audit logging
            from apps.payroll.services import log_payslip_action
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            details = "Password protected download" if password_protected else "Standard download"
            log_payslip_action(request.user, 'DOWNLOAD', payslip, ip_address, user_agent, details)
            
            return response
            
        return self.error_response('Payslip file not available')


class AdminPayslipDownloadView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request, payslip_id, *args, **kwargs):
        try:
            payslip = Payslip.objects.get(id=payslip_id)
        except Payslip.DoesNotExist:
            return self.error_response('Payslip not found')
        
        if payslip.pdf_file:
            from django.http import FileResponse
            file_obj = payslip.pdf_file.open('rb')
            orig_name = payslip.pdf_file.name
            ext = 'pdf' if orig_name.lower().endswith('.pdf') else 'txt'
            filename = f'payslip_{payslip.employee.employee_id if payslip.employee else "unmapped"}_{payslip.month}_{payslip.year}.{ext}'
            
            # Audit logging
            from apps.payroll.services import log_payslip_action
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            log_payslip_action(request.user, 'DOWNLOAD', payslip, ip_address, user_agent, 'Payslip downloaded by admin')
            
            return FileResponse(file_obj, as_attachment=True, filename=filename)
            
        return self.error_response('Payslip file not available')


class GeneratePayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        employee_id = request.data.get('employee_id')
        month = request.data.get('month')
        year = request.data.get('year')
        earnings = request.data.get('earnings', [])
        deductions = request.data.get('deductions', [])
        notes = request.data.get('notes', '')

        if not employee_id or not month or not year:
            return self.error_response('employee_id, month, and year are required')

        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        payslip, success, message = generate_payslip(
            employee, int(month), int(year), earnings, deductions, notes, request.user
        )

        if success:
            return self.created_response(PayslipDetailSerializer(payslip).data, message)
        return self.error_response(message)


class UploadPayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        employee_id = request.data.get('employee_id')
        month = request.data.get('month')
        year = request.data.get('year')
        pdf_file = request.FILES.get('pdf_file')

        if not employee_id or not month or not year:
            return self.error_response('employee_id, month, and year are required')
        if not pdf_file:
            return self.error_response('pdf_file is required')

        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        payslip, success, message = upload_payslip(employee, int(month), int(year), pdf_file, request.user)
        return self.success_response(PayslipDetailSerializer(payslip).data, message)


class PublishPayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        payslip_id = request.data.get('payslip_id')
        if not payslip_id:
            return self.error_response('payslip_id is required')

        payslip, success, message = publish_payslip(payslip_id)
        if success:
            return self.success_response(PayslipDetailSerializer(payslip).data, message)
        return self.error_response(message)


class EmployeePayslipListView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Auto-publish scheduled payslips first
        try:
            from django.utils import timezone
            from apps.payroll.services import publish_payslip
            scheduled = Payslip.objects.filter(status='DRAFT', publish_at__lte=timezone.now())
            for p in scheduled:
                publish_payslip(p.id)
        except Exception:
            pass

        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found')

        month = request.query_params.get('month')
        year = request.query_params.get('year')

        payslips = Payslip.objects.filter(
            employee=employee, status='PUBLISHED'
        ).select_related('employee__user', 'generated_by').order_by('-year', '-month')

        if month:
            payslips = payslips.filter(month=int(month))
        if year:
            payslips = payslips.filter(year=int(year))

        serializer = PayslipDetailSerializer(payslips, many=True)
        return self.success_response(serializer.data)


from django.db import transaction

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class BulkUploadPayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        month = request.data.get('month')
        year = request.data.get('year')
        upload_file = request.FILES.get('file')

        if not month or not year:
            return self.error_response('month and year are required')
        if not upload_file:
            return self.error_response('file is required')

        from apps.payroll.services import process_bulk_payslip_upload, log_payslip_action
        try:
            results = process_bulk_payslip_upload(upload_file, int(month), int(year), request.user)
            
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            log_payslip_action(
                request.user, 'UPLOAD', None, ip_address, user_agent,
                f"Bulk uploaded file: {upload_file.name}. Parsed {len(results)} items."
            )
            
            return self.success_response(results, 'Bulk upload processed successfully')
        except Exception as e:
            return self.error_response(f"Bulk upload failed: {str(e)}")


class BulkConfirmPayslipView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def post(self, request, *args, **kwargs):
        payslip_ids = request.data.get('payslip_ids', [])
        action = request.data.get('action', 'publish')  # 'publish', 'draft', 'delete'
        publish_at_str = request.data.get('publish_at') # ISO string or None

        if not payslip_ids:
            return self.error_response('payslip_ids list is required')

        from apps.payroll.services import log_payslip_action, publish_payslip
        from django.utils.dateparse import parse_datetime
        from apps.payroll.models import Payslip

        publish_at = None
        if publish_at_str:
            publish_at = parse_datetime(publish_at_str)

        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        with transaction.atomic():
            payslips = Payslip.objects.filter(id__in=payslip_ids)
            count = 0

            if action == 'delete':
                for p in payslips:
                    log_payslip_action(request.user, 'DELETE', None, ip_address, user_agent, f"Deleted draft payslip of employee {p.employee}")
                    p.delete()
                return self.success_response(message=f"Deleted {payslips.count()} payslips")

            for p in payslips:
                if action == 'publish':
                    if publish_at:
                        p.status = 'DRAFT'
                        p.publish_at = publish_at
                        p.save(update_fields=['status', 'publish_at'])
                        log_payslip_action(request.user, 'PUBLISH', p, ip_address, user_agent, f"Scheduled publishing at {publish_at_str}")
                        count += 1
                    else:
                        p.status = 'PUBLISHED'
                        p.publish_at = None
                        p.save(update_fields=['status', 'publish_at'])
                        
                        # Trigger notifications
                        from apps.payroll.services import MONTH_NAMES
                        from apps.notifications.services import create_notification
                        month_name = MONTH_NAMES[p.month]
                        if p.employee:
                            create_notification(
                                user=p.employee.user,
                                notification_type='PAYROLL',
                                title='Payslip Available',
                                message=f'Your payslip for {month_name} {p.year} is now available for download.',
                                action_url='/emp/payslips',
                            )
                        log_payslip_action(request.user, 'PUBLISH', p, ip_address, user_agent, "Published payslip")
                        count += 1
                elif action == 'draft':
                    p.status = 'DRAFT'
                    p.publish_at = None
                    p.save(update_fields=['status', 'publish_at'])
                    log_payslip_action(request.user, 'PUBLISH', p, ip_address, user_agent, "Moved payslip to Draft")
                    count += 1

        return self.success_response(message=f"Successfully processed {count} payslips")


class PayslipAuditLogViewSet(ResponseMixin, viewsets.ReadOnlyModelViewSet):
    queryset = PayslipAuditLog.objects.select_related('payslip__employee__user', 'user').all()
    serializer_class = PayslipAuditLogSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    ordering = ['-timestamp']

    def get_queryset(self):
        qs = super().get_queryset()
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            qs = qs.filter(payslip__employee__employee_id=employee_id)
        return qs


from rest_framework.views import APIView

class EmployeeSalaryPreviewView(ResponseMixin, APIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request, *args, **kwargs):
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return self.error_response('employee_id is required')

        from apps.employees.models import Employee
        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        from apps.payroll.models import SalaryStructure
        from apps.payroll.services import calculate_salary
        from decimal import Decimal

        structure = SalaryStructure.objects.filter(is_active=True).first()
        if not structure:
            return self.error_response('No active salary structure found')

        gross_salary = getattr(employee.designation, 'max_salary', Decimal('50000'))
        if not gross_salary:
            gross_salary = Decimal('50000')

        calc = calculate_salary(structure, gross_salary)

        data = {
            'earnings': [
                { 'name': 'Basic Salary', 'amount': float(calc['basic_salary']) },
                { 'name': 'HRA', 'amount': float(calc['hra']) },
                { 'name': 'Special Allowance', 'amount': float(calc['special_allowance']) },
                { 'name': 'Conveyance Allowance', 'amount': 0.0 },
                { 'name': 'Medical Allowance', 'amount': 0.0 },
                { 'name': 'Bonus', 'amount': 0.0 },
            ],
            'deductions': [
                { 'name': 'Provident Fund (PF)', 'amount': float(calc['pf']) },
                { 'name': 'Professional Tax', 'amount': float(calc['professional_tax']) },
                { 'name': 'ESI', 'amount': float(calc['esi']) },
                { 'name': 'Income Tax (TDS)', 'amount': 0.0 },
            ]
        }
        return self.success_response(data)
