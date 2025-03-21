from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SubAccountType, Account, Transaction, Saving, Merchant

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

class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ('id', 'name', 'user')
        read_only_fields = ('id', 'user')

class AccountSerializer(serializers.ModelSerializer):
    sub_type = SubAccountTypeSerializer(read_only=True)
    sub_type_id = serializers.PrimaryKeyRelatedField(
        queryset=SubAccountType.objects.all(),
        source='sub_type',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Account
        fields = ('id', 'name', 'num', 'type', 'sub_type', 'sub_type_id', 'inBankFeed', 'balance', 'reconciled_balance', 'user', 'icon')
        read_only_fields = ('id', 'user')

class TransactionSerializer(serializers.ModelSerializer):
    debit_account = AccountSerializer(source='debit', read_only=True)
    credit_account = AccountSerializer(source='credit', read_only=True)
    merchant_details = MerchantSerializer(source='merchant', read_only=True)
    merchant_id = serializers.PrimaryKeyRelatedField(
        queryset=Merchant.objects.all(),
        source='merchant',
        write_only=True,
        required=False,
        allow_null=True
    )
    merchant_name = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Transaction
        fields = ('id', 'date', 'merchant', 'merchant_details', 'merchant_id', 'merchant_name',
                 'amount', 'debit', 'credit', 'debit_account', 'credit_account',
                 'notes', 'is_reconciled', 'status', 'updated', 'user')
        read_only_fields = ('id', 'updated', 'user')

    def create(self, validated_data):
        # Handle merchant creation/lookup by name if provided
        merchant_name = validated_data.pop('merchant_name', None)
        if merchant_name and not validated_data.get('merchant'):
            user = self.context['request'].user
            merchant, created = Merchant.objects.get_or_create(
                name=merchant_name,
                user=user
            )
            validated_data['merchant'] = merchant

        # Set status to 'categorized' if both debit and credit accounts are provided
        # and they're not the same as the default accounts
        if 'debit' in validated_data and 'credit' in validated_data:
            # We'll consider a transaction categorized if both accounts are explicitly set
            # This logic can be adjusted based on your specific requirements
            validated_data['status'] = 'categorized'
        else:
            # Default to 'review' status if not categorized
            validated_data['status'] = 'review'

        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Similar logic for update method
        merchant_name = validated_data.pop('merchant_name', None)
        if merchant_name and not validated_data.get('merchant'):
            user = self.context['request'].user
            merchant, created = Merchant.objects.get_or_create(
                name=merchant_name,
                user=user
            )
            validated_data['merchant'] = merchant

        # Update status to 'categorized' if both debit and credit accounts are provided
        # and they're not the same as the default accounts
        if 'debit' in validated_data and 'credit' in validated_data:
            # We'll consider a transaction categorized if both accounts are explicitly set
            validated_data['status'] = 'categorized'

        return super().update(instance, validated_data)

class SavingSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )
    contributing_accounts = AccountSerializer(many=True, read_only=True)
    contributing_account_ids = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='contributing_accounts',
        write_only=True,
        many=True,
        required=False
    )
    balance = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    progress_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Saving
        fields = ('id', 'account', 'account_id', 'target', 'balance',
                  'contributing_accounts', 'contributing_account_ids',
                  'progress_percentage', 'user')
        read_only_fields = ('id', 'user', 'balance', 'progress_percentage')

    def create(self, validated_data):
        contributing_accounts = validated_data.pop('contributing_accounts', [])
        validated_data['user'] = self.context['request'].user
        saving = Saving.objects.create(**validated_data)

        if contributing_accounts:
            saving.contributing_accounts.set(contributing_accounts)

        return saving
