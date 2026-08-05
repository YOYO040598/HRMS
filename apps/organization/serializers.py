from rest_framework import serializers
from apps.organization.models import Company, Department, Designation, Team, Location


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'registration_number', 'tax_id',
            'address', 'city', 'state', 'country', 'postal_code',
            'phone', 'email', 'website', 'logo', 'founded_date',
            'description', 'employee_count', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'employee_count', 'created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    head_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'company', 'company_name', 'name', 'slug', 'code',
            'description', 'parent', 'head', 'head_name', 'budget',
            'employee_count', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'employee_count', 'created_at']

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.user.full_name
        return None


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Designation
        fields = [
            'id', 'name', 'slug', 'department', 'department_name',
            'level', 'min_salary', 'max_salary', 'description',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TeamSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    lead_name = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'department', 'department_name', 'name', 'slug',
            'description', 'lead', 'lead_name', 'member_count',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'member_count', 'created_at']

    def get_lead_name(self, obj):
        if obj.lead:
            return obj.lead.user.full_name
        return None


class LocationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Location
        fields = [
            'id', 'name', 'slug', 'company', 'company_name',
            'address', 'city', 'state', 'country', 'postal_code',
            'phone', 'is_main', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
