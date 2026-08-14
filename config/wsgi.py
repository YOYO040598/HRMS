"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# Run database migrations and seed default demo users automatically on application startup
try:
    from django.core.management import call_command
    call_command('migrate', interactive=False)
    call_command('seed_data')
except Exception as e:
    print(f"Startup migration/seed status: {e}")
