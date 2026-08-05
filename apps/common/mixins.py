from rest_framework.response import Response
from rest_framework import status


class ResponseMixin:
    def success_response(self, data=None, message='Success', status_code=status.HTTP_200_OK):
        response_data = {
            'success': True,
            'message': message,
            'data': data,
        }
        return Response(response_data, status=status_code)

    def error_response(self, message='Error occurred', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            'success': False,
            'message': message,
            'errors': errors or {},
        }
        return Response(response_data, status=status_code)

    def created_response(self, data=None, message='Created successfully'):
        return self.success_response(data, message, status.HTTP_201_CREATED)

    def deleted_response(self, message='Deleted successfully'):
        return self.success_response(message=message, status_code=status.HTTP_204_NO_CONTENT)


class MultipleSerializerMixin:
    serializer_class = None
    serializer_action_classes = {}

    def get_serializer_class(self):
        try:
            return self.serializer_action_classes[self.action]
        except (KeyError, AttributeError):
            return super().get_serializer_class()
