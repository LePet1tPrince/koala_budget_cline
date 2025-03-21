from django.db import migrations, models


def populate_merchants(apps, schema_editor):
    """
    Populate the Merchant model with unique merchant names from existing transactions
    and update the transaction.merchant ForeignKey to point to the new Merchant objects.
    """
    Transaction = apps.get_model('accounts', 'Transaction')
    Merchant = apps.get_model('accounts', 'Merchant')
    User = apps.get_model('accounts', 'User')

    # Get all unique merchant names from transactions
    merchant_names = set()
    merchant_to_user = {}

    for transaction in Transaction.objects.all():
        if transaction.merchant_old and transaction.merchant_old.strip():
            merchant_names.add(transaction.merchant_old)
            # Keep track of which user used this merchant
            if transaction.merchant_old not in merchant_to_user:
                merchant_to_user[transaction.merchant_old] = transaction.user

    # Create Merchant objects for each unique name
    merchants = {}
    for name in merchant_names:
        user = merchant_to_user.get(name)
        if user:
            merchant = Merchant.objects.create(name=name, user=user)
            merchants[name] = merchant

    # Update transactions to point to the new Merchant objects
    for transaction in Transaction.objects.all():
        if transaction.merchant_old and transaction.merchant_old.strip():
            merchant = merchants.get(transaction.merchant_old)
            if merchant:
                transaction.merchant = merchant
                transaction.save()


def reverse_populate_merchants(apps, schema_editor):
    """
    Reverse the migration by copying merchant names back to the merchant_old field.
    """
    Transaction = apps.get_model('accounts', 'Transaction')

    for transaction in Transaction.objects.all():
        if transaction.merchant:
            transaction.merchant_old = transaction.merchant.name
            transaction.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_create_merchant_model'),
    ]

    operations = [
        # Rename the old merchant field to merchant_old
        migrations.RenameField(
            model_name='transaction',
            old_name='merchant',
            new_name='merchant_old',
        ),

        # Add the new merchant field as a ForeignKey
        migrations.AddField(
            model_name='transaction',
            name='merchant',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='transactions', to='accounts.merchant'),
        ),

        # Populate the Merchant model and update Transaction.merchant
        migrations.RunPython(
            code=populate_merchants,
            reverse_code=reverse_populate_merchants,
        ),

        # Remove the temporary merchant_old field
        migrations.RemoveField(
            model_name='transaction',
            name='merchant_old',
        ),
    ]
