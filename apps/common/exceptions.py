from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        data = {
            'success': False,
            'message': 'An error occurred',
            'errors': response.data,
        }

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                data['message'] = str(response.data['detail'])
                data['errors'] = {}
        elif isinstance(response.data, list):
            data['message'] = 'Validation error'
            data['errors'] = {'detail': response.data}

        response.data = data
    else:
        data = {
            'success': False,
            'message': str(exc),
            'errors': {},
        }
        response = Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
