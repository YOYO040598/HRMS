from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from django.contrib.auth import get_user_model
from apps.employees.models import (
    Employee, EmployeePersonalInfo, EmployeeAddress,
    EmployeeEmergencyContact, EmployeeEducation, EmployeeExperience, EmployeeDocuments,
)

User = get_user_model()


class EmployeePersonalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeePersonalInfo
        fields = [
            'id', 'employee', 'date_of_birth', 'gender', 'marital_status',
            'nationality', 'personal_email', 'blood_group', 'religion', 'father_name', 'mother_name',
            'spouse_name', 'pan_number', 'aadhaar_number', 'passport_number',
            'driving_license', 'photo',
        ]
        read_only_fields = ['id']


class EmployeeAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAddress
        fields = [
            'id', 'employee', 'address_type', 'address_line_1', 'address_line_2',
            'city', 'state', 'country', 'postal_code', 'is_default',
        ]
        read_only_fields = ['id']


class EmployeeEmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEmergencyContact
        fields = [
            'id', 'employee', 'name', 'relationship', 'phone_number',
            'alternate_phone', 'email', 'address', 'is_primary',
        ]
        read_only_fields = ['id']


class EmployeeEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEducation
        fields = [
            'id', 'employee', 'degree', 'institution', 'specialization',
            'university', 'start_year', 'end_year', 'grade', 'percentage', 'is_highest',
        ]
        read_only_fields = ['id']


class EmployeeExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeExperience
        fields = [
            'id', 'employee', 'company_name', 'designation', 'department',
            'start_date', 'end_date', 'salary_drawn', 'reason_for_leaving', 'is_current',
        ]
        read_only_fields = ['id']


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocuments
        fields = [
            'id', 'employee', 'document_type', 'title', 'file',
            'description', 'expiry_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class EmployeeListSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_full_name', 'employee_id', 'department',
            'department_name', 'designation', 'designation_name', 'employment_type',
            'status', 'date_of_joining',
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    personal_info = EmployeePersonalInfoSerializer(read_only=True)
    addresses = EmployeeAddressSerializer(many=True, read_only=True)
    emergency_contacts = EmployeeEmergencyContactSerializer(many=True, read_only=True)
    education = EmployeeEducationSerializer(many=True, read_only=True)
    experience = EmployeeExperienceSerializer(many=True, read_only=True)
    documents = EmployeeDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_full_name', 'email', 'employee_id',
            'company', 'department', 'department_name', 'designation',
            'designation_name', 'team', 'team_name', 'manager', 'manager_name',
            'reporting_to', 'employment_type', 'status', 'date_of_joining',
            'date_of_exit', 'probation_end_date', 'notice_period_days',
            'location', 'work_email', 'employee_code',
            'personal_info', 'addresses', 'emergency_contacts',
            'education', 'experience', 'documents',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.user.full_name
        return None


class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20, required=False, default='')
    employee_id = serializers.CharField(max_length=50)
    company = serializers.UUIDField()
    department = serializers.UUIDField(required=False, allow_null=True)
    designation = serializers.UUIDField(required=False, allow_null=True)
    team = serializers.UUIDField(required=False, allow_null=True)
    manager = serializers.UUIDField(required=False, allow_null=True)
    employment_type = serializers.ChoiceField(choices=Employee.EmploymentType.choices, default=Employee.EmploymentType.FULL_TIME)
    status = serializers.ChoiceField(choices=Employee.Status.choices, default=Employee.Status.ACTIVE)
    date_of_joining = serializers.DateField()
    work_email = serializers.EmailField(required=False, default='')
    location = serializers.UUIDField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value

    def create(self, validated_data):
        from apps.organization.models import Company, Department, Designation, Team, Location

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
        )

        employee = Employee.objects.create(
            user=user,
            employee_id=validated_data['employee_id'],
            company_id=validated_data['company'],
            department_id=validated_data.get('department'),
            designation_id=validated_data.get('designation'),
            team_id=validated_data.get('team'),
            manager_id=validated_data.get('manager'),
            employment_type=validated_data.get('employment_type', Employee.EmploymentType.FULL_TIME),
            status=validated_data.get('status', Employee.Status.ACTIVE),
            date_of_joining=validated_data['date_of_joining'],
            work_email=validated_data.get('work_email', ''),
            location_id=validated_data.get('location'),
        )
        return employee
