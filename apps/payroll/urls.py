from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.payroll.views import (
    SalaryStructureViewSet, PayrollViewSet,
    AllowanceViewSet, DeductionViewSet,
    ReimbursementViewSet, PayslipViewSet,
    GeneratePayrollView, ProcessPayrollView,
    ApprovePayrollView, MarkPayrollPaidView, PayrollSummaryView,
    ApproveReimbursementView, RejectReimbursementView,
    EmployeePayrollView, BulkGeneratePayrollView,
    DownloadPayslipView, AdminPayslipDownloadView,
    GeneratePayslipView, UploadPayslipView, PublishPayslipView,
    EmployeePayslipListView,
    BulkUploadPayslipView, BulkConfirmPayslipView, PayslipAuditLogViewSet,
    EmployeeSalaryPreviewView,
)

router = DefaultRouter()
router.register(r'salary-structures', SalaryStructureViewSet)
router.register(r'payrolls', PayrollViewSet)
router.register(r'allowances', AllowanceViewSet)
router.register(r'deductions', DeductionViewSet)
router.register(r'reimbursements', ReimbursementViewSet)
router.register(r'payslips', PayslipViewSet)
router.register(r'audit-logs', PayslipAuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('generate/', GeneratePayrollView.as_view(), name='payroll-generate'),
    path('bulk-generate/', BulkGeneratePayrollView.as_view(), name='payroll-bulk-generate'),
    path('generate-payslip/', GeneratePayslipView.as_view(), name='payroll-generate-payslip'),
    path('employee-salary-preview/', EmployeeSalaryPreviewView.as_view(), name='payroll-employee-salary-preview'),
    path('upload-payslip/', UploadPayslipView.as_view(), name='payroll-upload-payslip'),
    path('publish-payslip/', PublishPayslipView.as_view(), name='payroll-publish-payslip'),
    path('bulk-upload-payslip/', BulkUploadPayslipView.as_view(), name='payroll-bulk-upload-payslip'),
    path('bulk-confirm-payslip/', BulkConfirmPayslipView.as_view(), name='payroll-bulk-confirm-payslip'),
    path('process/', ProcessPayrollView.as_view(), name='payroll-process'),
    path('approve/', ApprovePayrollView.as_view(), name='payroll-approve'),
    path('mark-paid/', MarkPayrollPaidView.as_view(), name='payroll-mark-paid'),
    path('summary/', PayrollSummaryView.as_view(), name='payroll-summary'),
    path('my-payrolls/', EmployeePayrollView.as_view(), name='payroll-my-payrolls'),
    path('my-payslips/', EmployeePayslipListView.as_view(), name='payroll-my-payslips'),
    path('<uuid:payslip_id>/download/', DownloadPayslipView.as_view(), name='payroll-payslip-download'),
    path('<uuid:payslip_id>/admin-download/', AdminPayslipDownloadView.as_view(), name='payroll-payslip-admin-download'),
    path('approve-reimbursement/', ApproveReimbursementView.as_view(), name='payroll-approve-reimbursement'),
    path('reject-reimbursement/', RejectReimbursementView.as_view(), name='payroll-reject-reimbursement'),
    path('', include(router.urls)),
]

