from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SubAccountType, Account, Transaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class SubAccountTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubAccountType
        fields = '__all__'

class AccountSerializer(serializers.ModelSerializer):
    sub_type = SubAccountTypeSerializer(read_only=True)
    sub_type_id = serializers.PrimaryKeyRelatedField(
        queryset=SubAccountType.objects.all(),
        source='sub_type',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_plaid_linked = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Account
        fields = ('id', 'name', 'num', 'type', 'sub_type', 'sub_type_id', 'inBankFeed', 'balance', 'reconciled_balance', 'user', 'is_plaid_linked')
        read_only_fields = ('id', 'user', 'is_plaid_linked')

    def get_is_plaid_linked(self, obj):
        # Check if there's an active PlaidItem for this account
        return obj.plaid_connection.filter(status='active').exists()

class TransactionSerializer(serializers.ModelSerializer):
    debit_account = AccountSerializer(source='debit', read_only=True)
    credit_account = AccountSerializer(source='credit', read_only=True)

    class Meta:
        model = Transaction
        fields = ('id', 'date', 'amount', 'debit', 'credit', 'debit_account', 'credit_account',
                 'notes', 'is_reconciled', 'status', 'updated', 'user')
        read_only_fields = ('id', 'updated', 'user')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
