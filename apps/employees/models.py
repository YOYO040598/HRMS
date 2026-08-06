from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel
from apps.organization.models import Department, Designation, Team, Company, Location

User = get_user_model()


class Employee(BaseModel):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'FULL_TIME', 'Full Time'
        PART_TIME = 'PART_TIME', 'Part Time'
        CONTRACT = 'CONTRACT', 'Contract'
        INTERN = 'INTERN', 'Intern'
        PROBATION = 'PROBATION', 'Probation'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        ON_NOTICE = 'ON_NOTICE', 'On Notice'
        EXITED = 'EXITED', 'Exited'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, related_name='employees')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reportees')
    reporting_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_reports')
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    date_of_joining = models.DateField()
    date_of_exit = models.DateField(blank=True, null=True)
    probation_end_date = models.DateField(blank=True, null=True)
    notice_period_days = models.PositiveIntegerField(default=30)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    work_email = models.EmailField(blank=True, default='')
    employee_code = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-date_of_joining']

    def __str__(self):
        return f'{self.user.full_name} ({self.employee_id})'


class EmployeePersonalInfo(BaseModel):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='personal_info')
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')],
        blank=True, default=''
    )
    marital_status = models.CharField(
        max_length=20,
        choices=[('SINGLE', 'Single'), ('MARRIED', 'Married'), ('DIVORCED', 'Divorced'), ('WIDOWED', 'Widowed')],
        blank=True, default=''
    )
    nationality = models.CharField(max_length=50, blank=True, default='')
    personal_email = models.EmailField(blank=True, default='')
    blood_group = models.CharField(max_length=5, blank=True, default='')
    religion = models.CharField(max_length=50, blank=True, default='')
    father_name = models.CharField(max_length=255, blank=True, default='')
    mother_name = models.CharField(max_length=255, blank=True, default='')
    spouse_name = models.CharField(max_length=255, blank=True, default='')
    pan_number = models.CharField(max_length=20, blank=True, default='')
    aadhaar_number = models.CharField(max_length=20, blank=True, default='')
    passport_number = models.CharField(max_length=50, blank=True, default='')
    driving_license = models.CharField(max_length=50, blank=True, default='')
    photo = models.ImageField(upload_to='employees/photos/', blank=True, null=True)

    class Meta:
        verbose_name = 'Employee Personal Info'
        verbose_name_plural = 'Employee Personal Info'

    def __str__(self):
        return f'Personal Info - {self.employee}'


class EmployeeAddress(BaseModel):
    class AddressType(models.TextChoices):
        PERMANENT = 'PERMANENT', 'Permanent'
        CURRENT = 'CURRENT', 'Current'
        CORRESPONDENCE = 'CORRESPONDENCE', 'Correspondence'

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=20, choices=AddressType.choices)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Employee Address'
        verbose_name_plural = 'Employee Addresses'

    def __str__(self):
        return f'{self.get_address_type_display()} - {self.employee}'


class EmployeeEmergencyContact(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Employee Emergency Contact'
        verbose_name_plural = 'Employee Emergency Contacts'

    def __str__(self):
        return f'{self.name} ({self.relationship}) - {self.employee}'


class EmployeeEducation(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='education')
    degree = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255, blank=True, default='')
    university = models.CharField(max_length=255, blank=True, default='')
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField(blank=True, null=True)
    grade = models.CharField(max_length=20, blank=True, default='')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    is_highest = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Employee Education'
        verbose_name_plural = 'Employee Education'
        ordering = ['-end_year']

    def __str__(self):
        return f'{self.degree} - {self.institution}'


class EmployeeExperience(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='experience')
    company_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True, default='')
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    salary_drawn = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    reason_for_leaving = models.CharField(max_length=255, blank=True, default='')
    is_current = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Employee Experience'
        verbose_name_plural = 'Employee Experience'
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.designation} at {self.company_name}'


class EmployeeDocuments(BaseModel):
    class DocumentType(models.TextChoices):
        AADHAAR = 'AADHAAR', 'Aadhaar Card'
        PAN = 'PAN', 'PAN Card'
        PASSPORT = 'PASSPORT', 'Passport'
        DRIVING_LICENSE = 'DRIVING_LICENSE', 'Driving License'
        RESUME = 'RESUME', 'Resume'
        OFFER_LETTER = 'OFFER_LETTER', 'Offer Letter'
        APPOINTMENT_LETTER = 'APPOINTMENT_LETTER', 'Appointment Letter'
        EXPERIENCE = 'EXPERIENCE', 'Experience Letter'
        EDUCATION = 'EDUCATION', 'Education Certificate'
        OTHER = 'OTHER', 'Other'

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='employees/documents/')
    description = models.TextField(blank=True, default='')
    expiry_date = models.DateField(blank=True, null=True)

    class Meta:
        verbose_name = 'Employee Document'
        verbose_name_plural = 'Employee Documents'

    def __str__(self):
        return f'{self.title} ({self.get_document_type_display()}) - {self.employee}'
