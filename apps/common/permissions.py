from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsHROrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.role in ['ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE']
            )
        )


class IsManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['ADMIN', 'HR_ADMIN', 'MANAGER', 'TEAM_LEAD']
        )


class IsEmployeeOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role in ['ADMIN', 'HR_ADMIN']:
            return True
        return obj.user == request.user
