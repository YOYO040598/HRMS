import django_filters
from apps.payroll.models import Payroll, Reimbursement


class PayrollFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    employee_id = django_filters.CharFilter(field_name='employee__employee_id', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    month = django_filters.NumberFilter(field_name='month')
    year = django_filters.NumberFilter(field_name='year')
    min_salary = django_filters.NumberFilter(field_name='net_salary', lookup_expr='gte')
    max_salary = django_filters.NumberFilter(field_name='net_salary', lookup_expr='lte')

    class Meta:
        model = Payroll
        fields = ['employee', 'status', 'month', 'year']


class ReimbursementFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')

    class Meta:
        model = Reimbursement
        fields = ['employee', 'status']
