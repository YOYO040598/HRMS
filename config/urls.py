from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.http import HttpResponse, FileResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def frontend_view(request):
    frontend_index = settings.BASE_DIR / 'hrms-frontend' / 'dist' / 'index.html'
    if frontend_index.exists():
        try:
            with open(frontend_index, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html')
        except Exception:
            pass
    return redirect('/api/docs/')


def static_schema_view(request):
    schema_path = settings.BASE_DIR / 'schema.yml'
    if schema_path.exists():
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                content = f.read()
            response = HttpResponse(content, content_type='application/x-yaml')
            response['Access-Control-Allow-Origin'] = '*'
            return response
        except Exception:
            pass
    return SpectacularAPIView.as_view()(request)


urlpatterns = [
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
    re_path(r'^(?:(?!api|admin|static|media).)*$', frontend_view, name='frontend'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
