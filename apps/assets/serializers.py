from rest_framework import serializers
from apps.assets.models import Asset, AssetAssignment, AssetReturn, AssetHistory, AssetRequest


class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    acceptance_status = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'asset_code', 'category', 'description', 'brand',
            'model_name', 'serial_number', 'purchase_date', 'purchase_price',
            'warranty_expiry', 'status', 'condition', 'location', 'company',
            'image', 'assigned_to_name', 'specifications', 'acceptance_status',
        ]
        read_only_fields = ['id']

    def get_assigned_to_name(self, obj):
        if obj.status == 'ASSIGNED':
            assignment = obj.assignments.filter(is_returned=False).first()
            if assignment:
                return assignment.employee.user.full_name
        return None

    def get_acceptance_status(self, obj):
        if obj.status == 'ASSIGNED':
            assignment = obj.assignments.filter(is_returned=False).first()
            if assignment:
                return assignment.acceptance_status
        return None


class AssetAssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_code = serializers.CharField(source='asset.asset_code', read_only=True)
    asset_category = serializers.CharField(source='asset.category', read_only=True)
    asset_brand = serializers.CharField(source='asset.brand', read_only=True)
    asset_model_name = serializers.CharField(source='asset.model_name', read_only=True)
    asset_specifications = serializers.DictField(source='asset.specifications', read_only=True)

    class Meta:
        model = AssetAssignment
        fields = [
            'id', 'asset', 'asset_name', 'asset_code', 'employee', 'employee_name',
            'assigned_by', 'assigned_date', 'expected_return_date', 'actual_return_date',
            'condition_at_assignment', 'condition_at_return', 'notes', 'is_returned',
            'is_acknowledged', 'acknowledged_at', 'acceptance_status', 'employee_comments',
            'asset_category', 'asset_brand', 'asset_model_name', 'asset_specifications',
        ]
        read_only_fields = ['id']


class AssetReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetReturn
        fields = [
            'id', 'assignment', 'returned_by', 'return_date', 'condition',
            'remarks', 'damage_report', 'is_damaged',
        ]
        read_only_fields = ['id']


class AssetHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.full_name', read_only=True)

    class Meta:
        model = AssetHistory
        fields = ['id', 'asset', 'action', 'description', 'performed_by', 'performed_by_name', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class AssetRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    assigned_asset_name = serializers.CharField(source='assigned_asset.name', read_only=True)
    assigned_asset_code = serializers.CharField(source='assigned_asset.asset_code', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = AssetRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'asset_category',
            'reason', 'request_date', 'status', 'approved_by', 'approved_by_name',
            'comments', 'assigned_asset', 'assigned_asset_name', 'assigned_asset_code',
        ]
        read_only_fields = ['id', 'employee', 'request_date', 'status', 'approved_by', 'assigned_asset']
