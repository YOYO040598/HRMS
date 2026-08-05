import django_filters
from django.db import models
from apps.assets.models import Asset, AssetAssignment


class AssetFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    category = django_filters.CharFilter(field_name='category', lookup_expr='exact')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    company = django_filters.UUIDFilter(field_name='company__id')
    purchase_date_from = django_filters.DateFilter(field_name='purchase_date', lookup_expr='gte')
    purchase_date_to = django_filters.DateFilter(field_name='purchase_date', lookup_expr='lte')

    class Meta:
        model = Asset
        fields = ['category', 'status', 'company']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(name__icontains=value)
                | models.Q(asset_code__icontains=value)
                | models.Q(serial_number__icontains=value)
                | models.Q(brand__icontains=value)
            )
        return queryset


class AssetAssignmentFilter(django_filters.FilterSet):
    asset = django_filters.UUIDFilter(field_name='asset__id')
    employee = django_filters.UUIDFilter(field_name='employee__id')
    is_returned = django_filters.BooleanFilter(field_name='is_returned')
    assigned_date_from = django_filters.DateFilter(field_name='assigned_date', lookup_expr='gte')
    assigned_date_to = django_filters.DateFilter(field_name='assigned_date', lookup_expr='lte')

    class Meta:
        model = AssetAssignment
        fields = ['asset', 'employee', 'is_returned']
