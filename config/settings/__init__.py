import os

ENVIRONMENT = os.environ.get('DJANGO_ENVIRONMENT', '').lower()
IS_RENDER = os.environ.get('RENDER') == 'true' or 'RENDER_SERVICE_ID' in os.environ

if ENVIRONMENT == 'production' or IS_RENDER or os.environ.get('DJANGO_SETTINGS_MODULE', '').endswith('production'):
    from config.settings.production import *  # noqa
else:
    from config.settings.development import *  # noqa
