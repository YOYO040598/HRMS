import django_filters
from django.db import models
from apps.leave_management.models import LeaveApplication, LeaveBalance, LeaveType, Holiday


class LeaveApplicationFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    employee_id = django_filters.CharFilter(field_name='employee__employee_id', lookup_expr='iexact')
    leave_type = django_filters.UUIDFilter(field_name='leave_type__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_from = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_to = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    is_emergency = django_filters.BooleanFilter(field_name='is_emergency')
    year = django_filters.NumberFilter(field_name='start_date__year')

    class Meta:
        model = LeaveApplication
        fields = ['employee', 'leave_type', 'status', 'is_emergency']


class LeaveBalanceFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    leave_type = django_filters.UUIDFilter(field_name='leave_type__id')
    year = django_filters.NumberFilter(field_name='year')

    class Meta:
        model = LeaveBalance
        fields = ['employee', 'leave_type', 'year']


class HolidayFilter(django_filters.FilterSet):
    company = django_filters.UUIDFilter(field_name='company__id')
    year = django_filters.NumberFilter(field_name='date__year')
    is_recurring = django_filters.BooleanFilter(field_name='is_recurring')

    class Meta:
        model = Holiday
        fields = ['company', 'is_recurring']
