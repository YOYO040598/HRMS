from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications.models import Notification, NotificationTemplate, NotificationPreference
from apps.notifications.serializers import (
    NotificationSerializer, NotificationTemplateSerializer, NotificationPreferenceSerializer,
)
from apps.accounts.permissions import IsHROrAdmin
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin


class NotificationViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    search_fields = ['title', 'message']
    ordering = ['-created_at']
    filterset_fields = ['notification_type', 'is_read']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def mark_as_read(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        from django.utils import timezone
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return Response({'message': 'Notification marked as read'})


class NotificationTemplateViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['name', 'subject']
    ordering = ['name']
    filterset_fields = ['notification_type', 'is_active']


class NotificationPreferenceViewSet(ResponseMixin, generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj


class MarkAllReadView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from apps.notifications.services import mark_all_read
        updated = mark_all_read(request.user)
        return self.success_response({'updated': updated}, 'Notifications marked as read')


class UnreadCountView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from apps.notifications.services import get_unread_count
        count = get_unread_count(request.user)
        return self.success_response({'unread_count': count})
