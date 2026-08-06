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


from rest_framework.views import APIView

class EmployeeSelfProfileView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found', status_code=status.HTTP_404_NOT_FOUND)

        personal_info, _ = EmployeePersonalInfo.objects.get_or_create(employee=employee)
        address = employee.addresses.filter(is_default=True).first() or employee.addresses.first()
        contact = employee.emergency_contacts.filter(is_primary=True).first() or employee.emergency_contacts.first()

        data = {
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'phone_number': request.user.phone_number,
            'email': request.user.email,
            
            'personal_email': personal_info.personal_email,
            'date_of_birth': personal_info.date_of_birth,
            'gender': personal_info.gender,
            'marital_status': personal_info.marital_status,
            'blood_group': personal_info.blood_group,
            
            'address_line_1': address.address_line_1 if address else '',
            'address_line_2': address.address_line_2 if address else '',
            'city': address.city if address else '',
            'state': address.state if address else '',
            'country': address.country if address else '',
            'postal_code': address.postal_code if address else '',
            
            'emergency_contact_name': contact.name if contact else '',
            'emergency_contact_relationship': contact.relationship if contact else '',
            'emergency_contact_phone': contact.phone_number if contact else '',
        }
        return self.success_response(data)

    def put(self, request, *args, **kwargs):
        try:
            employee = request.user.employee_profile
        except Exception:
            return self.error_response('Employee profile not found', status_code=status.HTTP_404_NOT_FOUND)

        data = request.data
        user = request.user
        
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.save()
        
        personal_info, _ = EmployeePersonalInfo.objects.get_or_create(employee=employee)
        personal_info.personal_email = data.get('personal_email', personal_info.personal_email)
        
        dob = data.get('date_of_birth')
        if dob == '':
            personal_info.date_of_birth = None
        elif dob:
            personal_info.date_of_birth = dob
            
        personal_info.gender = data.get('gender', personal_info.gender)
        personal_info.marital_status = data.get('marital_status', personal_info.marital_status)
        personal_info.blood_group = data.get('blood_group', personal_info.blood_group)
        personal_info.save()
        
        address = employee.addresses.filter(is_default=True).first() or employee.addresses.first()
        if not address:
            address = EmployeeAddress(employee=employee, address_type='CURRENT', is_default=True)
        address.address_line_1 = data.get('address_line_1', address.address_line_1)
        address.address_line_2 = data.get('address_line_2', address.address_line_2)
        address.city = data.get('city', address.city)
        address.state = data.get('state', address.state)
        address.country = data.get('country', address.country)
        address.postal_code = data.get('postal_code', address.postal_code)
        address.save()
        
        contact = employee.emergency_contacts.filter(is_primary=True).first() or employee.emergency_contacts.first()
        if not contact:
            contact = EmployeeEmergencyContact(employee=employee, is_primary=True)
        contact.name = data.get('emergency_contact_name', contact.name)
        contact.relationship = data.get('emergency_contact_relationship', contact.relationship)
        contact.phone_number = data.get('emergency_contact_phone', contact.phone_number)
        contact.save()
        
        return self.success_response(message='Profile updated successfully')
