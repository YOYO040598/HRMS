import os

ENVIRONMENT = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if ENVIRONMENT == 'production':
    from config.settings.production import *  # noqa
else:
    from config.settings.development import *  # noqa
