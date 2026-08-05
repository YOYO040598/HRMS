from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.organization.views import (
    CompanyViewSet, DepartmentViewSet, DesignationViewSet,
    TeamViewSet, LocationViewSet,
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'designations', DesignationViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'locations', LocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
