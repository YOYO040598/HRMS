from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.employees.views import (
    EmployeeViewSet, EmployeePersonalInfoViewSet,
    EmployeeAddressViewSet, EmployeeEmergencyContactViewSet,
    EmployeeEducationViewSet, EmployeeExperienceViewSet,
    EmployeeDocumentViewSet, GenerateEmployeeIDView,
    EmployeeSelfProfileView,
)

router = DefaultRouter()
router.register(r'', EmployeeViewSet)
router.register(r'personal-info', EmployeePersonalInfoViewSet)
router.register(r'addresses', EmployeeAddressViewSet)
router.register(r'emergency-contacts', EmployeeEmergencyContactViewSet)
router.register(r'education', EmployeeEducationViewSet)
router.register(r'experience', EmployeeExperienceViewSet)
router.register(r'documents', EmployeeDocumentViewSet)

urlpatterns = [
    path('generate-id/', GenerateEmployeeIDView.as_view(), name='employee-generate-id'),
    path('my-profile/', EmployeeSelfProfileView.as_view(), name='employee-my-profile'),
    path('', include(router.urls)),
]
