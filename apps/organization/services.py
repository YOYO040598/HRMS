from django.db import transaction
from apps.organization.models import Company, Department, Designation, Team, Location


def create_company(data):
    with transaction.atomic():
        company = Company.objects.create(**data)
        return company


def update_company(company, data):
    for key, value in data.items():
        setattr(company, key, value)
    company.save()
    return company


def deactivate_company(company):
    company.is_active = False
    company.save(update_fields=['is_active'])
    return company


def create_department(company, data):
    with transaction.atomic():
        department = Department.objects.create(company=company, **data)
        company.employee_count = company.departments.count()
        company.save(update_fields=['employee_count'])
        return department


def update_department(department, data):
    for key, value in data.items():
        setattr(department, key, value)
    department.save()
    return department


def create_designation(data):
    designation = Designation.objects.create(**data)
    return designation


def create_team(department, data):
    with transaction.atomic():
        team = Team.objects.create(department=department, **data)
        department.employee_count = department.teams.count()
        department.save(update_fields=['member_count'])
        return team


def get_company_stats(company):
    return {
        'total_departments': company.departments.filter(is_active=True).count(),
        'total_designations': Designation.objects.filter(department__company=company, is_active=True).count(),
        'total_teams': Team.objects.filter(department__company=company, is_active=True).count(),
        'total_locations': company.locations.filter(is_active=True).count(),
        'total_employees': company.employees.filter(is_active=True).count(),
    }


def get_department_tree(department):
    tree = {
        'department': department,
        'sub_departments': [],
        'teams': list(department.teams.filter(is_active=True)),
        'employee_count': department.employees.filter(is_active=True).count(),
    }
    for sub in department.sub_departments.filter(is_active=True):
        tree['sub_departments'].append(get_department_tree(sub))
    return tree
