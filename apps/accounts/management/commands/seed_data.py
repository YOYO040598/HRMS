from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.employees.models import Employee
from apps.organization.models import Company, Department, Designation

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo users and employees'

    def handle(self, *args, **options):
        company, _ = Company.objects.get_or_create(name='TechCorp', defaults={'slug': 'techcorp'})
        dept, _ = Department.objects.get_or_create(company=company, name='Engineering', defaults={'slug': 'engineering'})
        desig, _ = Designation.objects.get_or_create(department=dept, name='Software Engineer', defaults={'slug': 'software-engineer'})

        users_data = [
            {'email': 'admin1@hrms.com', 'first_name': 'Admin', 'last_name': 'One', 'role': 'ADMIN', 'emp_id': 'admin1', 'is_staff': True, 'is_superuser': True, 'pass': 'admin12345!'},
            {'email': 'admin1', 'first_name': 'Admin', 'last_name': 'One', 'role': 'ADMIN', 'emp_id': 'admin1', 'is_staff': True, 'is_superuser': True, 'pass': 'admin1'},
            {'email': 'admin@hrms.com', 'first_name': 'Admin', 'last_name': 'User', 'role': 'ADMIN', 'emp_id': 'EMP001', 'is_staff': True, 'is_superuser': True, 'pass': 'admin1'},
            {'email': 'hr@hrms.com', 'first_name': 'HR', 'last_name': 'Admin', 'role': 'HR_ADMIN', 'emp_id': 'EMP002', 'is_staff': True, 'is_superuser': False, 'pass': 'admin1'},
            {'email': 'empy1@hrms.com', 'first_name': 'John', 'last_name': 'Doe', 'role': 'EMPLOYEE', 'emp_id': 'empy1', 'is_staff': False, 'is_superuser': False, 'pass': 'employee12345!'},
            {'email': 'empy1', 'first_name': 'John', 'last_name': 'Doe', 'role': 'EMPLOYEE', 'emp_id': 'empy1', 'is_staff': False, 'is_superuser': False, 'pass': 'employee1'},
            {'email': 'employee@hrms.com', 'first_name': 'John', 'last_name': 'Doe', 'role': 'EMPLOYEE', 'emp_id': 'EMP004', 'is_staff': False, 'is_superuser': False, 'pass': 'employee1'},
        ]

        for item in users_data:
            user = User.objects.filter(email__iexact=item['email']).first()
            if not user:
                user = User.objects.create(
                    email=item['email'],
                    first_name=item['first_name'],
                    last_name=item['last_name'],
                    role=item['role'],
                    is_staff=item['is_staff'],
                    is_superuser=item['is_superuser'],
                    is_active=True,
                )
            user.role = item['role']
            user.is_staff = item['is_staff']
            user.is_superuser = item['is_superuser']
            user.set_password(item['pass'])
            user.save()
            
            Employee.objects.get_or_create(
                user=user,
                defaults={
                    'company': company,
                    'employee_id': item['emp_id'],
                    'department': dept,
                    'designation': desig,
                    'employment_type': 'FULL_TIME',
                    'status': 'ACTIVE',
                    'date_of_joining': '2024-01-01',
                }
            )
            self.stdout.write(self.style.SUCCESS(f"User {item['email']} (Role: {item['role']}) ready."))
