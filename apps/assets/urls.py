from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.assets.views import (
    AssetViewSet, AssetAssignmentViewSet,
    AssetReturnViewSet, AssetHistoryViewSet,
    AssignAssetView, ReturnAssetView, TransferAssetView,
    AssetStatsView, EmployeeAssetsView, AssetRequestViewSet,
)

router = DefaultRouter()
router.register(r'requests', AssetRequestViewSet)
router.register(r'assignments', AssetAssignmentViewSet)
router.register(r'returns', AssetReturnViewSet)
router.register(r'history', AssetHistoryViewSet)
router.register(r'', AssetViewSet)

urlpatterns = [
    path('assign/', AssignAssetView.as_view(), name='asset-assign'),
    path('return/', ReturnAssetView.as_view(), name='asset-return'),
    path('transfer/', TransferAssetView.as_view(), name='asset-transfer'),
    path('stats/', AssetStatsView.as_view(), name='asset-stats'),
    path('my-assets/', EmployeeAssetsView.as_view(), name='employee-assets'),
    path('', include(router.urls)),
]
