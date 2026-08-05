import re
from django.core.exceptions import ValidationError


def validate_email_domain(value):
    allowed_domains = ['company.com', 'example.com']
    domain = value.split('@')[-1] if '@' in value else ''
    if domain not in allowed_domains:
        raise ValidationError(f'Email domain must be one of: {", ".join(allowed_domains)}')


def validate_password_strength(value):
    if len(value) < 8:
        raise ValidationError('Password must be at least 8 characters long')
    if not re.search(r'[A-Z]', value):
        raise ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', value):
        raise ValidationError('Password must contain at least one lowercase letter')
    if not re.search(r'\d', value):
        raise ValidationError('Password must contain at least one digit')
    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', value):
        raise ValidationError('Password must contain at least one special character')


def validate_phone_number(value):
    pattern = r'^\+?[\d\s-]{10,15}$'
    if not re.match(pattern, value):
        raise ValidationError('Invalid phone number format')
