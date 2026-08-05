from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.notifications.views import (
    NotificationViewSet, NotificationTemplateViewSet, NotificationPreferenceViewSet,
    MarkAllReadView, UnreadCountView,
)

router = DefaultRouter()
router.register(r'', NotificationViewSet)
router.register(r'templates', NotificationTemplateViewSet)

urlpatterns = [
    path('preferences/', NotificationPreferenceViewSet.as_view(), name='notification-preferences'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('unread-count/', UnreadCountView.as_view(), name='notification-unread-count'),
    path('', include(router.urls)),
]
