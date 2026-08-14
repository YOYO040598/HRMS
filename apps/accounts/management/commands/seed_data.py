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
            {'email': 'admin@hrms.com', 'first_name': 'Admin', 'last_name': 'User', 'role': 'ADMIN', 'emp_id': 'EMP001', 'is_staff': True, 'is_superuser': True},
            {'email': 'hr@hrms.com', 'first_name': 'HR', 'last_name': 'Admin', 'role': 'HR_ADMIN', 'emp_id': 'EMP002', 'is_staff': True, 'is_superuser': False},
            {'email': 'manager@hrms.com', 'first_name': 'Manager', 'last_name': 'User', 'role': 'MANAGER', 'emp_id': 'EMP003', 'is_staff': False, 'is_superuser': False},
            {'email': 'employee@hrms.com', 'first_name': 'John', 'last_name': 'Doe', 'role': 'EMPLOYEE', 'emp_id': 'EMP004', 'is_staff': False, 'is_superuser': False},
        ]

        for item in users_data:
            user, created = User.objects.get_or_create(
                email=item['email'],
                defaults={
                    'first_name': item['first_name'],
                    'last_name': item['last_name'],
                    'role': item['role'],
                    'is_staff': item['is_staff'],
                    'is_superuser': item['is_superuser'],
                    'is_active': True,
                }
            )
            if created or not user.check_password('password123'):
                user.set_password('password123')
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
            self.stdout.write(self.style.SUCCESS(f"User {item['email']} (Employee ID: {item['emp_id']}) ready."))
