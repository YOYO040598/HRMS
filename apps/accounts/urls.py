from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    RegisterView, LoginView, LogoutView, EmployeeLoginView,
    UserViewSet, UserProfileView, ChangePasswordView,
    RoleViewSet, UserRoleViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('employee-login/', EmployeeLoginView.as_view(), name='employee-login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('user-roles/', UserRoleViewSet.as_view(), name='user-roles'),
    path('', include(router.urls)),
]
