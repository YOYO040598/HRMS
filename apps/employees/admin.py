from django.contrib import admin
from apps.employees.models import (
    Employee, EmployeePersonalInfo, EmployeeAddress,
    EmployeeEmergencyContact, EmployeeEducation, EmployeeExperience, EmployeeDocuments,
)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'user', 'department', 'designation', 'status', 'date_of_joining')
    search_fields = ('employee_id', 'user__first_name', 'user__last_name', 'user__email')
    list_filter = ('status', 'employment_type', 'department', 'company')
    raw_id_fields = ('user', 'department', 'designation', 'team', 'manager', 'company', 'location')


@admin.register(EmployeePersonalInfo)
class EmployeePersonalInfoAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date_of_birth', 'gender', 'marital_status')
    raw_id_fields = ('employee',)


@admin.register(EmployeeAddress)
class EmployeeAddressAdmin(admin.ModelAdmin):
    list_display = ('employee', 'address_type', 'city', 'state', 'country')
    list_filter = ('address_type',)
    raw_id_fields = ('employee',)


@admin.register(EmployeeEmergencyContact)
class EmployeeEmergencyContactAdmin(admin.ModelAdmin):
    list_display = ('employee', 'name', 'relationship', 'phone_number', 'is_primary')
    raw_id_fields = ('employee',)


@admin.register(EmployeeEducation)
class EmployeeEducationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'degree', 'institution', 'start_year', 'end_year')
    raw_id_fields = ('employee',)


@admin.register(EmployeeExperience)
class EmployeeExperienceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'company_name', 'designation', 'start_date', 'end_date')
    raw_id_fields = ('employee',)


@admin.register(EmployeeDocuments)
class EmployeeDocumentsAdmin(admin.ModelAdmin):
    list_display = ('employee', 'title', 'document_type', 'created_at')
    list_filter = ('document_type',)
    raw_id_fields = ('employee',)
