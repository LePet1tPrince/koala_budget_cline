from django.db import migrations


def copy_plaid_items(apps, schema_editor):
    """
    Copy PlaidItem data from accounts app to plaid app.
    """
    AccountsPlaidItem = apps.get_model('accounts', 'PlaidItem')
    PlaidPlaidItem = apps.get_model('plaid', 'PlaidItem')

    # Delete any existing data in the plaid app's PlaidItem table
    PlaidPlaidItem.objects.all().delete()

    # Copy data from accounts app to plaid app
    for item in AccountsPlaidItem.objects.all():
        PlaidPlaidItem.objects.create(
            id=item.id,
            user=item.user,
            account=item.account,
            item_id=item.item_id,
            access_token=item.access_token,
            plaid_account_id=item.plaid_account_id,
            institution_name=item.institution_name,
            last_sync=item.last_sync,
            cursor=item.cursor,
            status=item.status,
            error_message=item.error_message,
            created_at=item.created_at,
            updated_at=item.updated_at
        )


def copy_plaid_transactions(apps, schema_editor):
    """
    Copy PlaidTransaction data from accounts app to plaid app.
    """
    AccountsPlaidTransaction = apps.get_model('accounts', 'PlaidTransaction')
    PlaidPlaidTransaction = apps.get_model('plaid', 'PlaidTransaction')
    PlaidPlaidItem = apps.get_model('plaid', 'PlaidItem')

    # Delete any existing data in the plaid app's PlaidTransaction table
    PlaidPlaidTransaction.objects.all().delete()

    # Copy data from accounts app to plaid app
    for txn in AccountsPlaidTransaction.objects.all():
        try:
            # Get the corresponding PlaidItem from the plaid app
            plaid_item = PlaidPlaidItem.objects.get(id=txn.plaid_item.id)

            PlaidPlaidTransaction.objects.create(
                id=txn.id,
                plaid_item=plaid_item,
                transaction=txn.transaction,
                plaid_transaction_id=txn.plaid_transaction_id,
                imported_at=txn.imported_at
            )
        except PlaidPlaidItem.DoesNotExist:
            # Skip if the PlaidItem doesn't exist in the plaid app
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('plaid', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(copy_plaid_items),
        migrations.RunPython(copy_plaid_transactions),
    ]
