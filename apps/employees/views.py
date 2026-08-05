from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated

from apps.employees.models import (
    Employee, EmployeePersonalInfo, EmployeeAddress,
    EmployeeEmergencyContact, EmployeeEducation, EmployeeExperience, EmployeeDocuments,
)
from apps.employees.serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateSerializer,
    EmployeePersonalInfoSerializer, EmployeeAddressSerializer,
    EmployeeEmergencyContactSerializer, EmployeeEducationSerializer,
    EmployeeExperienceSerializer, EmployeeDocumentSerializer,
)
from apps.employees.filters import EmployeeFilter
from apps.accounts.permissions import IsHROrAdmin, IsManagerOrAbove
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class EmployeeViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.select_related(
        'user', 'department', 'designation', 'team', 'manager__user', 'company', 'location'
    ).all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = EmployeeFilter
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__email']
    ordering_fields = ['employee_id', 'date_of_joining', 'created_at']
    ordering = ['-date_of_joining']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return self.created_response(
            EmployeeDetailSerializer(employee).data,
            'Employee created successfully'
        )


class EmployeePersonalInfoViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeePersonalInfo.objects.all()
    serializer_class = EmployeePersonalInfoSerializer
    permission_classes = [IsHROrAdmin]


class EmployeeAddressViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeAddress.objects.all()
    serializer_class = EmployeeAddressSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['employee', 'address_type']


class EmployeeEmergencyContactViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeEmergencyContact.objects.all()
    serializer_class = EmployeeEmergencyContactSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['employee']


class EmployeeEducationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeEducation.objects.all()
    serializer_class = EmployeeEducationSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['employee']


class EmployeeExperienceViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeExperience.objects.all()
    serializer_class = EmployeeExperienceSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['employee']


class EmployeeDocumentViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeDocuments.objects.all()
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsHROrAdmin]
    filterset_fields = ['employee', 'document_type']


class GenerateEmployeeIDView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request, *args, **kwargs):
        last_employee = Employee.objects.order_by('-employee_id').first()
        if last_employee and last_employee.employee_id:
            last_num = int(''.join(filter(str.isdigit, last_employee.employee_id)))
            next_num = last_num + 1
        else:
            next_num = 1
        next_id = f'EMP{next_num:03d}'
        return self.success_response({'employee_id': next_id})
