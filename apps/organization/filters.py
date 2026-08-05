import django_filters
from django.db import models
from apps.organization.models import Company, Department, Designation, Team, Location


class CompanyFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    country = django_filters.CharFilter(field_name='country', lookup_expr='iexact')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = Company
        fields = ['country', 'is_active']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(name__icontains=value)
                | models.Q(registration_number__icontains=value)
                | models.Q(email__icontains=value)
            )
        return queryset


class DepartmentFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    company = django_filters.UUIDFilter(field_name='company__id')
    parent = django_filters.UUIDFilter(field_name='parent__id')

    class Meta:
        model = Department
        fields = ['company', 'parent', 'is_active']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(name__icontains=value)
                | models.Q(code__icontains=value)
            )
        return queryset


class DesignationFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    department = django_filters.UUIDFilter(field_name='department__id')

    class Meta:
        model = Designation
        fields = ['department', 'is_active']


class TeamFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    department = django_filters.UUIDFilter(field_name='department__id')

    class Meta:
        model = Team
        fields = ['department', 'is_active']


class LocationFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    company = django_filters.UUIDFilter(field_name='company__id')
    country = django_filters.CharFilter(field_name='country', lookup_expr='iexact')

    class Meta:
        model = Location
        fields = ['company', 'is_main']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(name__icontains=value)
                | models.Q(city__icontains=value)
            )
        return queryset
