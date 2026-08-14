from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.http import HttpResponse, FileResponse, JsonResponse


def test_login_view(request):
    try:
        from apps.accounts.views import ensure_demo_users
        ensure_demo_users()
        from django.contrib.auth import get_user_model
        from apps.employees.models import Employee
        User = get_user_model()
        User.objects.filter(email__icontains='admin').update(role='ADMIN', is_staff=True, is_superuser=True)
        users = list(User.objects.values('email', 'role', 'is_active'))
        employees = list(Employee.objects.values('employee_id', 'user__email'))
        
        return JsonResponse({
            'status': 'Admin roles updated to ADMIN',
            'users_count': len(users),
            'users': users,
            'employees_count': len(employees),
        })
    except Exception as e:
        import traceback
        return JsonResponse({'error': str(e), 'traceback': traceback.format_exc()})
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


import os
from pathlib import Path


def frontend_view(request):
    def spa_fallback(request, path=''):
        index_path = settings.BASE_DIR / 'hrms-frontend' / 'dist' / 'index.html'
        if index_path.exists():
            response = FileResponse(open(index_path, 'rb'))
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            return response
        return HttpResponse("Frontend index.html not found.", status=404)
    
    possible_paths = [
        Path(settings.BASE_DIR) / 'hrms-frontend' / 'dist' / 'index.html',
        Path(settings.BASE_DIR) / 'staticfiles' / 'index.html',
        Path('/opt/render/project/src/hrms-frontend/dist/index.html'),
        Path('/opt/render/project/src/staticfiles/index.html'),
        Path('/app/hrms-frontend/dist/index.html'),
        Path('/app/staticfiles/index.html'),
    ]
    for p in possible_paths:
        if p.exists():
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    res = HttpResponse(f.read(), content_type='text/html')
                    res['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    return res
            except Exception as e:
                print(f"Error reading frontend index at {p}: {e}")
        else:
            print(f"[FRONTEND VIEW] Path does not exist: {p}")
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
    path('api/test-login/', test_login_view, name='test-login'),
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
