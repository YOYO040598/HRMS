from django.contrib import admin
from apps.organization.models import Company, Department, Designation, Team, Location


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'registration_number', 'city', 'country', 'employee_count', 'is_active')
    search_fields = ('name', 'registration_number')
    list_filter = ('is_active', 'country')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'company', 'head', 'employee_count', 'is_active')
    search_fields = ('name', 'code')
    list_filter = ('company', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'level', 'min_salary', 'max_salary', 'is_active')
    search_fields = ('name',)
    list_filter = ('department', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'lead', 'member_count', 'is_active')
    search_fields = ('name',)
    list_filter = ('department', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'city', 'state', 'country', 'is_main', 'is_active')
    search_fields = ('name', 'city')
    list_filter = ('company', 'is_main', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
