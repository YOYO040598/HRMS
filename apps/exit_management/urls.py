from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.exit_management.views import (
    ResignationViewSet, ExitApprovalViewSet,
    FullAndFinalViewSet, ExperienceLetterViewSet,
    ApplyResignationView, ApproveResignationView, RejectResignationView,
    RelieveEmployeeView, GenerateExperienceLetterView,
    InitiateFnFView, CompleteFnFView,
)

router = DefaultRouter()
router.register(r'resignations', ResignationViewSet)
router.register(r'approvals', ExitApprovalViewSet)
router.register(r'fnf', FullAndFinalViewSet)
router.register(r'experience-letters', ExperienceLetterViewSet)

urlpatterns = [
    path('apply/', ApplyResignationView.as_view(), name='resignation-apply'),
    path('approve/', ApproveResignationView.as_view(), name='resignation-approve'),
    path('reject/', RejectResignationView.as_view(), name='resignation-reject'),
    path('relieve/', RelieveEmployeeView.as_view(), name='employee-relieve'),
    path('experience-letter/', GenerateExperienceLetterView.as_view(), name='generate-experience-letter'),
    path('init-fnf/', InitiateFnFView.as_view(), name='exit-init-fnf'),
    path('complete-fnf/', CompleteFnFView.as_view(), name='exit-complete-fnf'),
    path('', include(router.urls)),
]
