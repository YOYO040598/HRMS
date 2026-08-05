from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.organization.models import Company, Department, Designation, Team, Location
from apps.organization.serializers import (
    CompanySerializer, DepartmentSerializer, DesignationSerializer,
    TeamSerializer, LocationSerializer,
)
from apps.organization.filters import (
    CompanyFilter, DepartmentFilter, DesignationFilter, TeamFilter, LocationFilter,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class CompanyViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = CompanyFilter
    search_fields = ['name', 'registration_number', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class DepartmentViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Department.objects.select_related('company', 'head__user').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = DepartmentFilter
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class DesignationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Designation.objects.select_related('department').all()
    serializer_class = DesignationSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = DesignationFilter
    search_fields = ['name']
    ordering_fields = ['name', 'level']
    ordering = ['level', 'name']


class TeamViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Team.objects.select_related('department', 'lead__user').all()
    serializer_class = TeamSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = TeamFilter
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class LocationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Location.objects.select_related('company').all()
    serializer_class = LocationSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    filterset_class = LocationFilter
    search_fields = ['name', 'city', 'country']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
