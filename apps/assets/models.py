from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()


class Asset(BaseModel):
    class Category(models.TextChoices):
        LAPTOP = 'LAPTOP', 'Laptop'
        DESKTOP = 'DESKTOP', 'Desktop'
        MONITOR = 'MONITOR', 'Monitor'
        KEYBOARD = 'KEYBOARD', 'Keyboard'
        MOUSE = 'MOUSE', 'Mouse'
        PHONE = 'PHONE', 'Phone'
        TABLET = 'TABLET', 'Tablet'
        CHAIR = 'CHAIR', 'Chair'
        DESK = 'DESK', 'Desk'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        MAINTENANCE = 'MAINTENANCE', 'Under Maintenance'
        RETIRED = 'RETIRED', 'Retired'
        LOST = 'LOST', 'Lost'

    name = models.CharField(max_length=255)
    asset_code = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=30, choices=Category.choices)
    description = models.TextField(blank=True, default='')
    brand = models.CharField(max_length=100, blank=True, default='')
    model_name = models.CharField(max_length=100, blank=True, default='')
    serial_number = models.CharField(max_length=100, blank=True, default='')
    purchase_date = models.DateField(blank=True, null=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    warranty_expiry = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    condition = models.CharField(max_length=50, blank=True, default='Good')
    location = models.CharField(max_length=255, blank=True, default='')
    company = models.ForeignKey(
        'organization.Company', on_delete=models.CASCADE, related_name='assets',
        null=True, blank=True
    )
    image = models.ImageField(upload_to='assets/images/', blank=True, null=True)

    class Meta:
        verbose_name = 'Asset'
        verbose_name_plural = 'Assets'
        ordering = ['-purchase_date']

    def __str__(self):
        return f'{self.name} ({self.asset_code})'


class AssetAssignment(BaseModel):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='asset_assignments')
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='asset_assignments_made'
    )
    assigned_date = models.DateField()
    expected_return_date = models.DateField(blank=True, null=True)
    actual_return_date = models.DateField(blank=True, null=True)
    condition_at_assignment = models.CharField(max_length=50, blank=True, default='Good')
    condition_at_return = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    is_returned = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Asset Assignment'
        verbose_name_plural = 'Asset Assignments'
        ordering = ['-assigned_date']

    def __str__(self):
        return f'{self.asset} assigned to {self.employee}'


class AssetReturn(BaseModel):
    assignment = models.OneToOneField(AssetAssignment, on_delete=models.CASCADE, related_name='return_record')
    returned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='asset_returns'
    )
    return_date = models.DateField()
    condition = models.CharField(max_length=50)
    remarks = models.TextField(blank=True, default='')
    damage_report = models.TextField(blank=True, default='')
    is_damaged = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Asset Return'
        verbose_name_plural = 'Asset Returns'

    def __str__(self):
        return f'Return - {self.assignment}'


class AssetHistory(BaseModel):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)
    description = models.TextField(blank=True, default='')
    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='asset_history_actions'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Asset History'
        verbose_name_plural = 'Asset History'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.asset} - {self.action}'
