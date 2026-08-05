from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.reports.views import ReportViewSet, GenerateReportView

router = DefaultRouter()
router.register(r'', ReportViewSet)

urlpatterns = [
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
    path('', include(router.urls)),
]
