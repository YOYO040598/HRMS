import os
import uuid
from datetime import datetime

from django.utils.text import slugify


def generate_unique_filename(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4().hex}.{ext}'
    return os.path.join('uploads/', filename)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def create_slug(text, model_class=None):
    slug = slugify(text)
    if model_class:
        original_slug = slug
        counter = 1
        while model_class.objects.filter(slug=slug).exists():
            slug = f'{original_slug}-{counter}'
            counter += 1
    return slug


def get_current_academic_year():
    now = datetime.now()
    if now.month >= 4:
        return f'{now.year}-{now.year + 1}'
    return f'{now.year - 1}-{now.year}'


def format_currency(amount):
    return f'₹{amount:,.2f}' if amount else '₹0.00'
