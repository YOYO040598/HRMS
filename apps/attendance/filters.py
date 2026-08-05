import django_filters
from django.db import models
from apps.attendance.models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    employee_id = django_filters.CharFilter(field_name='employee__employee_id', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    date = django_filters.DateFilter(field_name='date', lookup_expr='exact')
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    is_approved = django_filters.BooleanFilter(field_name='is_approved')
    department = django_filters.UUIDFilter(field_name='employee__department__id')

    class Meta:
        model = Attendance
        fields = ['employee', 'status', 'is_approved', 'date']
