from django.contrib import admin
from apps.assets.models import Asset, AssetAssignment, AssetReturn, AssetHistory


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_code', 'category', 'status', 'purchase_date', 'purchase_price')
    list_filter = ('category', 'status')
    search_fields = ('name', 'asset_code', 'serial_number')


@admin.register(AssetAssignment)
class AssetAssignmentAdmin(admin.ModelAdmin):
    list_display = ('asset', 'employee', 'assigned_by', 'assigned_date', 'is_returned')
    list_filter = ('is_returned',)
    raw_id_fields = ('asset', 'employee', 'assigned_by')


@admin.register(AssetReturn)
class AssetReturnAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'returned_by', 'return_date', 'condition', 'is_damaged')
    list_filter = ('is_damaged',)
    raw_id_fields = ('assignment', 'returned_by')


@admin.register(AssetHistory)
class AssetHistoryAdmin(admin.ModelAdmin):
    list_display = ('asset', 'action', 'performed_by', 'timestamp')
    raw_id_fields = ('asset', 'performed_by')
