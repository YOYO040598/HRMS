import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from apps.employees.models import Employee
from django.contrib.auth import get_user_model
User = get_user_model()

emp = Employee.objects.filter(employee_id='EMP001').first()
if emp:
    print(f'EMP001 found: {emp.user.email}, active={emp.user.is_active}')
    print(f'Has password: {bool(emp.user.password)}')
    print(f'Can authenticate: {emp.user.check_password("password123")}')
else:
    print('EMP001 NOT FOUND')
    print('All employees:', list(Employee.objects.values_list('employee_id', flat=True)))
    print('All users:', list(User.objects.values_list('email', flat=True)))
