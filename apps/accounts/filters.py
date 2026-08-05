import django_filters
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    role = django_filters.CharFilter(field_name='role', lookup_expr='exact')
    is_active = django_filters.BooleanFilter(field_name='is_active')
    date_from = django_filters.DateFilter(field_name='date_joined', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date_joined', lookup_expr='lte')

    class Meta:
        model = User
        fields = ['role', 'is_active']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(email__icontains=value)
                | models.Q(first_name__icontains=value)
                | models.Q(last_name__icontains=value)
            )
        return queryset
