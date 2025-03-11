from rest_framework import serializers
from .models import PlaidItem, PlaidTransaction
from accounts.serializers import AccountSerializer, TransactionSerializer

class PlaidItemSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='account',
        queryset=AccountSerializer.Meta.model.objects.all()
    )

    class Meta:
        model = PlaidItem
        fields = [
            'id', 'user', 'account', 'account_id', 'item_id',
            'institution_name', 'last_sync', 'status', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
        extra_kwargs = {
            'access_token': {'write_only': True}  # Never expose access token in API responses
        }

class PlaidTransactionSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)

    class Meta:
        model = PlaidTransaction
        fields = ['id', 'plaid_item', 'transaction', 'plaid_transaction_id', 'imported_at']
        read_only_fields = ['id', 'imported_at']
