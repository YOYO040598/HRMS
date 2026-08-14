from rest_framework import viewsets, generics, serializers
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.exit_management.models import Resignation, ExitApproval, FullAndFinal, ExperienceLetter
from apps.exit_management.serializers import (
    ResignationListSerializer, ResignationDetailSerializer,
    ExitApprovalSerializer, FullAndFinalSerializer, ExperienceLetterSerializer,
)
from apps.exit_management.filters import ResignationFilter
from apps.exit_management.services import (
    apply_resignation, approve_resignation, reject_resignation,
    relieve_employee, init_fnf, complete_fnf, generate_experience_letter,
)
from apps.accounts.permissions import IsHROrAdmin, IsManagerOrAbove
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class ResignationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Resignation.objects.select_related(
        'employee__user', 'approved_by'
    ).prefetch_related('approvals').all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = ResignationFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['applied_date', 'last_working_day', 'status']
    ordering = ['-applied_date']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return self.queryset.none()
        if user.is_superuser or getattr(user, 'is_staff', False) or user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']:
            return self.queryset
        try:
            employee = user.employee_profile
            return self.queryset.filter(employee=employee)
        except Exception:
            return self.queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return ResignationListSerializer
        return ResignationDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]


class ExitApprovalViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = ExitApproval.objects.select_related('resignation', 'approver').all()
    serializer_class = ExitApprovalSerializer
    permission_classes = [IsManagerOrAbove]
    pagination_class = StandardPagination
    filterset_fields = ['resignation', 'status', 'level']


class FullAndFinalViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = FullAndFinal.objects.select_related(
        'employee__user', 'resignation', 'completed_by'
    ).all()
    serializer_class = FullAndFinalSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_fields = ['employee', 'status']


class ExperienceLetterViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = ExperienceLetter.objects.select_related(
        'employee__user', 'issued_by'
    ).all()
    serializer_class = ExperienceLetterSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_fields = ['employee', 'is_sent']


class ApplyResignationView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResignationDetailSerializer

    @extend_schema(
        request=inline_serializer('ApplyResignationRequest', fields={
            'employee_id': serializers.UUIDField(required=False),
            'last_working_day': serializers.DateField(),
            'reason': serializers.CharField(required=False, default=''),
            'notice_period_days': serializers.IntegerField(required=False, default=30),
            'force_exit': serializers.BooleanField(required=False, default=False),
        }),
        responses={201: ResignationDetailSerializer}
    )
    def post(self, request, *args, **kwargs):
        from django.utils.dateparse import parse_date
        from apps.employees.models import Employee
        
        employee_id = request.data.get('employee_id')
        if employee_id and (request.user.is_superuser or getattr(request.user, 'is_staff', False) or request.user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']):
            try:
                employee = Employee.objects.get(id=employee_id)
            except Employee.DoesNotExist:
                return self.error_response('Employee not found')
        else:
            try:
                employee = request.user.employee_profile
            except Exception:
                return self.error_response('Employee profile not found')

        last_working_day = parse_date(request.data.get('last_working_day', ''))
        if not last_working_day:
            return self.error_response('Last working day is required')

        force_exit = request.data.get('force_exit', False)

        resignation, success, message = apply_resignation(
            employee=employee,
            last_working_day=last_working_day,
            reason=request.data.get('reason', ''),
            notice_period_days=int(request.data.get('notice_period_days', 30)),
        )

        if success:
            if force_exit and (request.user.is_superuser or getattr(request.user, 'is_staff', False) or request.user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']):
                from django.utils import timezone
                resignation.status = 'APPROVED'
                resignation.approved_by = request.user
                resignation.approved_date = timezone.now().date()
                resignation.save(update_fields=['status', 'approved_by', 'approved_date'])
                resignation.approvals.all().update(status='APPROVED', approved_at=timezone.now(), comments='Force exited by administrator.')
            
            return self.created_response(
                ResignationDetailSerializer(resignation).data, message
            )
        return self.error_response(message)


class ApproveResignationView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]
    serializer_class = ExitApprovalSerializer

    @extend_schema(
        request=inline_serializer('ApproveResignationRequest', fields={
            'approval_id': serializers.UUIDField(required=False),
            'resignation_id': serializers.UUIDField(required=False),
            'comments': serializers.CharField(required=False, default=''),
        }),
        responses={200: ExitApprovalSerializer}
    )
    def post(self, request, *args, **kwargs):
        from django.utils import timezone
        approval_id = request.data.get('approval_id')
        resignation_id = request.data.get('resignation_id')
        comments = request.data.get('comments', '')

        if resignation_id and (request.user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'] or request.user.is_superuser):
            # Admin/HR can directly approve the resignation
            try:
                res = Resignation.objects.get(id=resignation_id)
                res.status = 'APPROVED'
                res.approved_by = request.user
                res.approved_date = timezone.now().date()
                res.comments = comments
                res.save(update_fields=['status', 'approved_by', 'approved_date', 'comments'])
                
                # Auto-approve any pending clearance approvals
                ExitApproval.objects.filter(resignation_id=resignation_id, status='PENDING').update(
                    status='APPROVED', 
                    approved_at=timezone.now(),
                    comments=comments or 'Approved by administrator.'
                )
                return self.success_response(None, 'Resignation fully approved')
            except Resignation.DoesNotExist:
                return self.error_response('Resignation not found')

        if not approval_id and resignation_id:
            try:
                approval = ExitApproval.objects.filter(resignation_id=resignation_id, approver=request.user, status='PENDING').first()
                if approval:
                    approval_id = approval.id
            except Exception:
                pass

        approval, success, message = approve_resignation(approval_id, request.user, comments)

        if success:
            return self.success_response(
                ExitApprovalSerializer(approval).data, message
            )
        return self.error_response(message)


class RejectResignationView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsManagerOrAbove]
    serializer_class = ExitApprovalSerializer

    @extend_schema(
        request=inline_serializer('RejectResignationRequest', fields={
            'approval_id': serializers.UUIDField(required=False),
            'resignation_id': serializers.UUIDField(required=False),
            'comments': serializers.CharField(required=False, default=''),
        }),
        responses={200: ExitApprovalSerializer}
    )
    def post(self, request, *args, **kwargs):
        from django.utils import timezone
        approval_id = request.data.get('approval_id')
        resignation_id = request.data.get('resignation_id')
        comments = request.data.get('comments', '')

        if resignation_id and (request.user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'] or request.user.is_superuser):
            # Admin/HR can directly reject the resignation
            try:
                res = Resignation.objects.get(id=resignation_id)
                res.status = 'REJECTED'
                res.comments = comments
                res.save(update_fields=['status', 'comments'])
                
                # Auto-reject any pending clearance approvals
                ExitApproval.objects.filter(resignation_id=resignation_id, status='PENDING').update(
                    status='REJECTED', 
                    approved_at=timezone.now(),
                    comments=comments or 'Rejected by administrator.'
                )
                return self.success_response(None, 'Resignation fully rejected')
            except Resignation.DoesNotExist:
                return self.error_response('Resignation not found')

        if not approval_id and resignation_id:
            try:
                approval = ExitApproval.objects.filter(resignation_id=resignation_id, approver=request.user, status='PENDING').first()
                if approval:
                    approval_id = approval.id
            except Exception:
                pass

        approval, success, message = reject_resignation(approval_id, request.user, comments)

        if success:
            return self.success_response(
                ExitApprovalSerializer(approval).data, message
            )
        return self.error_response(message)


class RelieveEmployeeView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = ResignationDetailSerializer

    @extend_schema(
        request=inline_serializer('RelieveEmployeeRequest', fields={
            'resignation_id': serializers.UUIDField(),
        }),
        responses={200: ResignationDetailSerializer}
    )
    def post(self, request, *args, **kwargs):
        resignation_id = request.data.get('resignation_id')

        resignation, success, message = relieve_employee(resignation_id, request.user)

        if success:
            return self.success_response(
                ResignationDetailSerializer(resignation).data, message
            )
        return self.error_response(message)


class GenerateExperienceLetterView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = ExperienceLetterSerializer

    @extend_schema(
        request=inline_serializer('GenerateExperienceLetterRequest', fields={
            'employee_id': serializers.UUIDField(),
            'content': serializers.CharField(required=False, default=''),
        }),
        responses={201: ExperienceLetterSerializer}
    )
    def post(self, request, *args, **kwargs):
        from apps.employees.models import Employee
        employee_id = request.data.get('employee_id')

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return self.error_response('Employee not found')

        content = request.data.get('content', '')
        letter = generate_experience_letter(employee, request.user, content)

        return self.created_response(
            ExperienceLetterSerializer(letter).data, 'Experience letter generated'
        )


class InitiateFnFView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = FullAndFinalSerializer

    @extend_schema(
        request=inline_serializer('InitiateFnFRequest', fields={
            'resignation_id': serializers.UUIDField(),
        }),
        responses={201: FullAndFinalSerializer}
    )
    def post(self, request, *args, **kwargs):
        resignation_id = request.data.get('resignation_id')
        if not resignation_id:
            return self.error_response('resignation_id is required')

        try:
            resignation = Resignation.objects.get(id=resignation_id)
        except Resignation.DoesNotExist:
            return self.error_response('Resignation not found')

        fnf = init_fnf(resignation.employee, resignation)

        return self.created_response(
            FullAndFinalSerializer(fnf).data, 'F&F initiated'
        )


class CompleteFnFView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = FullAndFinalSerializer

    @extend_schema(
        request=inline_serializer('CompleteFnFRequest', fields={
            'fnf_id': serializers.UUIDField(),
            'final_amount': serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0),
        }),
        responses={200: FullAndFinalSerializer}
    )
    def post(self, request, *args, **kwargs):
        fnf_id = request.data.get('fnf_id')
        final_amount = request.data.get('final_amount', 0)

        if not fnf_id:
            return self.error_response('fnf_id is required')

        fnf, success, message = complete_fnf(fnf_id, request.user, final_amount)

        if success:
            return self.success_response(
                FullAndFinalSerializer(fnf).data, message
            )
        return self.error_response(message)
