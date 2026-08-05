import django_filters
from django.db import models
from apps.employees.models import Employee


class EmployeeFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    employee_id = django_filters.CharFilter(field_name='employee_id', lookup_expr='icontains')
    department = django_filters.UUIDFilter(field_name='department__id')
    designation = django_filters.UUIDFilter(field_name='designation__id')
    team = django_filters.UUIDFilter(field_name='team__id')
    manager = django_filters.UUIDFilter(field_name='manager__id')
    company = django_filters.UUIDFilter(field_name='company__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    employment_type = django_filters.CharFilter(field_name='employment_type', lookup_expr='exact')
    date_from = django_filters.DateFilter(field_name='date_of_joining', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date_of_joining', lookup_expr='lte')

    class Meta:
        model = Employee
        fields = ['department', 'designation', 'team', 'manager', 'company', 'status', 'employment_type']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(user__first_name__icontains=value)
                | models.Q(user__last_name__icontains=value)
                | models.Q(employee_id__icontains=value)
                | models.Q(user__email__icontains=value)
            )
        return queryset
