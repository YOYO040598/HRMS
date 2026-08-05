from django.db import transaction
from django.utils import timezone
from apps.employees.models import (
    Employee, EmployeePersonalInfo, EmployeeAddress,
    EmployeeEmergencyContact, EmployeeEducation, EmployeeExperience, EmployeeDocuments,
)


def generate_employee_id(company):
    prefix = company.name[:3].upper()
    last_employee = Employee.objects.filter(
        company=company
    ).order_by('-created_at').first()

    if last_employee and last_employee.employee_id:
        try:
            last_num = int(last_employee.employee_id.split('-')[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1

    return f'{prefix}-{new_num:05d}'


def create_employee(user, company, department, designation, data):
    with transaction.atomic():
        employee_id = generate_employee_id(company)

        employee = Employee.objects.create(
            user=user,
            employee_id=employee_id,
            company=company,
            department=department,
            designation=designation,
            team=data.get('team'),
            manager=data.get('manager'),
            reporting_to=data.get('reporting_to'),
            employment_type=data.get('employment_type', 'FULL_TIME'),
            status='ACTIVE',
            date_of_joining=data.get('date_of_joining', timezone.now().date()),
            probation_end_date=data.get('probation_end_date'),
            notice_period_days=data.get('notice_period_days', 30),
            location=data.get('location'),
            work_email=data.get('work_email', ''),
        )

        EmployeePersonalInfo.objects.create(employee=employee)
        company.employee_count = company.employees.filter(is_active=True).count()
        company.save(update_fields=['employee_count'])

        if department:
            department.employee_count = department.employees.filter(is_active=True).count()
            department.save(update_fields=['employee_count'])

        return employee


def update_employee(employee, data):
    allowed_fields = [
        'department', 'designation', 'team', 'manager', 'reporting_to',
        'employment_type', 'status', 'notice_period_days', 'location',
        'work_email', 'employee_code',
    ]
    with transaction.atomic():
        for field in allowed_fields:
            if field in data:
                setattr(employee, field, data[field])

        if 'date_of_exit' in data:
            employee.date_of_exit = data['date_of_exit']
            employee.status = 'EXITED'

        employee.save()

        company = employee.company
        company.employee_count = company.employees.filter(is_active=True).count()
        company.save(update_fields=['employee_count'])

        if employee.department:
            employee.department.employee_count = employee.department.employees.filter(is_active=True).count()
            employee.department.save(update_fields=['employee_count'])

        return employee


def deactivate_employee(employee):
    with transaction.atomic():
        employee.status = 'INACTIVE'
        employee.is_active = False
        employee.save(update_fields=['status', 'is_active'])

        company = employee.company
        company.employee_count = company.employees.filter(is_active=True).count()
        company.save(update_fields=['employee_count'])
        return employee


def get_employee_profile(employee):
    return {
        'basic': employee,
        'personal_info': getattr(employee, 'personal_info', None),
        'addresses': employee.addresses.all(),
        'emergency_contacts': employee.emergency_contacts.all(),
        'education': employee.education.all(),
        'experience': employee.experience.all(),
        'documents': employee.documents.all(),
    }


def search_employees(queryset, search_term):
    if not search_term:
        return queryset
    return queryset.filter(
        models.Q(user__first_name__icontains=search_term)
        | models.Q(user__last_name__icontains=search_term)
        | models.Q(employee_id__icontains=search_term)
        | models.Q(user__email__icontains=search_term)
    )
