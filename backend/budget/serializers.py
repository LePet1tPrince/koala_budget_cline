from rest_framework import serializers
from .models import Budget
from accounts.serializers import AccountSerializer

class BudgetSerializer(serializers.ModelSerializer):
    actual_amount = serializers.SerializerMethodField()
    difference = serializers.SerializerMethodField()
    account_name = serializers.SerializerMethodField()
    account_details = AccountSerializer(source='account', read_only=True)

    class Meta:
        model = Budget
        fields = ('id', 'month', 'account', 'account_name', 'account_details',
                 'budgeted_amount', 'actual_amount', 'difference', 'user')
        read_only_fields = ('id', 'user')

    def get_actual_amount(self, obj):
        return obj.calculate_actual_amount()

    def get_difference(self, obj):
        return obj.budgeted_amount - obj.calculate_actual_amount()

    def get_account_name(self, obj):
        return obj.account.name
