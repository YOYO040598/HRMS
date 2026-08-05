from django.db import models
from apps.common.models import BaseModel


class Company(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    registration_number = models.CharField(max_length=100, unique=True, blank=True, default='')
    tax_id = models.CharField(max_length=100, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    postal_code = models.CharField(max_length=20, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    website = models.URLField(blank=True, default='')
    logo = models.ImageField(upload_to='company/logos/', blank=True, null=True)
    founded_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, default='')
    employee_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, default='')
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sub_departments'
    )
    head = models.ForeignKey(
        'employees.Employee', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='headed_departments'
    )
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    employee_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        unique_together = ['company', 'slug']
        ordering = ['name']

    def __str__(self):
        return f'{self.company.name} - {self.name}'


class Designation(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designations'
    )
    level = models.PositiveIntegerField(default=1, help_text='Hierarchy level (1 = lowest)')
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'
        ordering = ['level', 'name']

    def __str__(self):
        return self.name


class Team(BaseModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    description = models.TextField(blank=True, default='')
    lead = models.ForeignKey(
        'employees.Employee', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='led_teams'
    )
    member_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'
        unique_together = ['department', 'slug']
        ordering = ['name']

    def __str__(self):
        return f'{self.department.name} - {self.name}'


class Location(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='locations')
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20, blank=True, default='')
    is_main = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Location'
        verbose_name_plural = 'Locations'
        ordering = ['name']

    def __str__(self):
        return f'{self.name}, {self.city}'
