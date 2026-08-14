from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.http import FileResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def root_redirect(request):
    return redirect('/api/docs/')


def static_schema_view(request):
    schema_path = settings.BASE_DIR / 'schema.yml'
    if schema_path.exists():
        return FileResponse(open(schema_path, 'rb'), content_type='text/yaml')
    return SpectacularAPIView.as_view()(request)


urlpatterns = [
    path('', root_redirect, name='root-redirect'),
    path('admin/', admin.site.urls),
    path('api/schema/', static_schema_view, name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/organization/', include('apps.organization.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/leave/', include('apps.leave_management.urls')),
    path('api/payroll/', include('apps.payroll.urls')),
    path('api/assets/', include('apps.assets.urls')),
    path('api/exit/', include('apps.exit_management.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
