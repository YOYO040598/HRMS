import django_filters
from apps.exit_management.models import Resignation


class ResignationFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name='employee__id')
    employee_id = django_filters.CharFilter(field_name='employee__employee_id', lookup_expr='iexact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    date_from = django_filters.DateFilter(field_name='last_working_day', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='last_working_day', lookup_expr='lte')

    class Meta:
        model = Resignation
        fields = ['employee', 'status']
