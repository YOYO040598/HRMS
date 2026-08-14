from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets, status, serializers
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


from apps.accounts.models import Role, UserRole
from apps.accounts.serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserListSerializer,
    UserDetailSerializer, ChangePasswordSerializer, UserProfileSerializer,
    RoleSerializer, UserRoleSerializer,
)
from apps.accounts.permissions import IsAdminUser, IsHROrAdmin
from apps.accounts.filters import UserFilter
from apps.common.pagination import StandardPagination
from apps.common.mixins import ResponseMixin, MultipleSerializerMixin

User = get_user_model()


class RegisterView(ResponseMixin, generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = RefreshToken.for_user(user)
        data = {
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'access': str(tokens.access_token),
                'refresh': str(tokens),
            },
        }
        return self.created_response(data, 'Registration successful')


def ensure_demo_users():
    try:
        from apps.organization.models import Company, Department, Designation
        from apps.employees.models import Employee
        company, _ = Company.objects.get_or_create(name='TechCorp', defaults={'slug': 'techcorp'})
        dept, _ = Department.objects.get_or_create(company=company, name='Engineering', defaults={'slug': 'engineering'})
        desig, _ = Designation.objects.get_or_create(department=dept, name='Software Engineer', defaults={'slug': 'software-engineer'})

        demo_list = [
            {'email': 'admin@hrms.com', 'first_name': 'Admin', 'last_name': 'User', 'role': 'ADMIN', 'emp_id': 'EMP001', 'is_staff': True, 'is_superuser': True},
            {'email': 'hr@hrms.com', 'first_name': 'HR', 'last_name': 'Admin', 'role': 'HR_ADMIN', 'emp_id': 'EMP002', 'is_staff': True, 'is_superuser': False},
            {'email': 'manager@hrms.com', 'first_name': 'Manager', 'last_name': 'User', 'role': 'MANAGER', 'emp_id': 'EMP003', 'is_staff': False, 'is_superuser': False},
            {'email': 'employee@hrms.com', 'first_name': 'John', 'last_name': 'Doe', 'role': 'EMPLOYEE', 'emp_id': 'EMP004', 'is_staff': False, 'is_superuser': False},
        ]
        for item in demo_list:
            u = User.objects.filter(email__iexact=item['email']).first()
            if not u:
                u = User.objects.create(
                    email=item['email'],
                    first_name=item['first_name'],
                    last_name=item['last_name'],
                    role=item['role'],
                    is_staff=item['is_staff'],
                    is_superuser=item['is_superuser'],
                    is_active=True,
                )
            u.set_password('password123')
            u.is_active = True
            u.save()

            emp = Employee.objects.filter(user=u).first() or Employee.objects.filter(employee_id__iexact=item['emp_id']).first()
            if not emp:
                Employee.objects.create(
                    user=u,
                    company=company,
                    employee_id=item['emp_id'],
                    department=dept,
                    designation=desig,
                    employment_type='FULL_TIME',
                    status='ACTIVE',
                    date_of_joining='2024-01-01',
                )
            else:
                emp.user = u
                emp.employee_id = item['emp_id']
                emp.company = company
                emp.save()
    except Exception as e:
        print(f"[DEMO USER ERROR]: {e}")


class LoginView(ResponseMixin, generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        ensure_demo_users()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            from django.db.models import Q
            user = User.objects.filter(
                Q(email__iexact=email) | Q(employee_profile__employee_id__iexact=email)
            ).first()
            if not user:
                return self.error_response(f'User account not found for "{email}". Please check credentials.', status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return self.error_response(f'User query error: {e}', status_code=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return self.error_response('Invalid password provided.', status_code=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return self.error_response('Account is disabled', status_code=status.HTTP_403_FORBIDDEN)

        tokens = RefreshToken.for_user(user)
        data = {
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'access': str(tokens.access_token),
                'refresh': str(tokens),
            },
        }
        return self.success_response(data, 'Login successful')


@extend_schema(request=None, responses={200: inline_serializer('LogoutResponse', fields={'message': serializers.CharField()})})
class LogoutView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            return self.success_response(message='Logged out successfully')
        except Exception:
            return self.error_response('Error during logout', status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserViewSet(ResponseMixin, MultipleSerializerMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    pagination_class = StandardPagination
    filterset_class = UserFilter
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['date_joined', 'email', 'first_name']
    ordering = ['-date_joined']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsHROrAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserDetailSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return self.deleted_response('User deactivated successfully')


class UserProfileView(ResponseMixin, MultipleSerializerMixin, generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(ResponseMixin, generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return self.success_response(message='Password changed successfully')


class RoleViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsHROrAdmin]
    pagination_class = StandardPagination
    search_fields = ['name', 'description']
    ordering = ['name']


class UserRoleViewSet(ResponseMixin, generics.CreateAPIView, generics.DestroyAPIView):
    serializer_class = UserRoleSerializer
    queryset = UserRole.objects.none()
    permission_classes = [IsHROrAdmin]

    @extend_schema(request=inline_serializer('UserRoleAssignRequest', fields={'user_id': serializers.UUIDField(), 'role_id': serializers.UUIDField()}), responses={201: UserRoleSerializer})
    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')

        try:
            user = User.objects.get(id=user_id)
            role = Role.objects.get(id=role_id)
        except (User.DoesNotExist, Role.DoesNotExist):
            return self.error_response('User or Role not found')

        user_role, created = UserRole.objects.get_or_create(
            user=user, role=role,
            defaults={'assigned_by': request.user}
        )
        if created:
            user.role = role.slug.upper()
            user.save(update_fields=['role'])
            return self.created_response(UserRoleSerializer(user_role).data, 'Role assigned')
        return self.error_response('User already has this role')

    @extend_schema(request=inline_serializer('UserRoleRemoveRequest', fields={'user_id': serializers.UUIDField(), 'role_id': serializers.UUIDField()}))
    def delete(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')

        try:
            user_role = UserRole.objects.get(user_id=user_id, role_id=role_id)
            user_role.delete()
            return self.deleted_response('Role removed')
        except UserRole.DoesNotExist:
            return self.error_response('UserRole not found')


class EmployeeLoginView(ResponseMixin, generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserDetailSerializer
    queryset = User.objects.none()

    @extend_schema(request=inline_serializer('EmployeeLoginRequest', fields={'employee_id': serializers.CharField(), 'password': serializers.CharField()}), responses={200: UserDetailSerializer})
    def post(self, request, *args, **kwargs):
        ensure_demo_users()
        employee_id = request.data.get('employee_id', '').strip()
        password = request.data.get('password', '')

        if not employee_id or not password:
            return self.error_response('Employee ID and password are required', status_code=status.HTTP_400_BAD_REQUEST)

        try:
            from apps.employees.models import Employee
            from django.db.models import Q
            employee = Employee.objects.select_related('user').filter(
                Q(employee_id__iexact=employee_id) | Q(user__email__iexact=employee_id)
            ).first()
            if not employee:
                return self.error_response(f'Employee profile not found for "{employee_id}".', status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return self.error_response(f'Employee query error: {e}', status_code=status.HTTP_400_BAD_REQUEST)

        user = employee.user

        if not user.check_password(password):
            return self.error_response('Invalid password provided.', status_code=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return self.error_response('Account is disabled', status_code=status.HTTP_403_FORBIDDEN)

        tokens = RefreshToken.for_user(user)
        data = {
            'user': UserDetailSerializer(user).data,
            'employee': {
                'id': str(employee.id),
                'employee_id': employee.employee_id,
                'department': employee.department.name if employee.department else '',
                'designation': employee.designation.name if employee.designation else '',
                'employment_type': employee.employment_type,
                'status': employee.status,
                'date_of_joining': str(employee.date_of_joining),
            },
            'tokens': {
                'access': str(tokens.access_token),
                'refresh': str(tokens),
            },
        }
        return self.success_response(data, 'Login successful')
