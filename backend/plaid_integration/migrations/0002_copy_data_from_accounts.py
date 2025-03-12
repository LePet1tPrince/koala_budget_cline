from django.db import migrations


def copy_plaid_items(apps, schema_editor):
    """
    Copy PlaidItem records from accounts app to plaid_integration app.
    """
    AccountsPlaidItem = apps.get_model('accounts', 'PlaidItem')
    PlaidIntegrationPlaidItem = apps.get_model('plaid_integration', 'PlaidItem')

    # Get all PlaidItem records from accounts app
    accounts_plaid_items = AccountsPlaidItem.objects.all()

    # Create new PlaidItem records in plaid_integration app
    for item in accounts_plaid_items:
        PlaidIntegrationPlaidItem.objects.create(
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
    Copy PlaidTransaction records from accounts app to plaid_integration app.
    """
    AccountsPlaidTransaction = apps.get_model('accounts', 'PlaidTransaction')
    PlaidIntegrationPlaidTransaction = apps.get_model('plaid_integration', 'PlaidTransaction')
    PlaidIntegrationPlaidItem = apps.get_model('plaid_integration', 'PlaidItem')

    # Get all PlaidTransaction records from accounts app
    accounts_plaid_transactions = AccountsPlaidTransaction.objects.all()

    # Create new PlaidTransaction records in plaid_integration app
    for txn in accounts_plaid_transactions:
        # Find the corresponding PlaidItem in the plaid_integration app
        try:
            plaid_item = PlaidIntegrationPlaidItem.objects.get(
                user=txn.plaid_item.user,
                account=txn.plaid_item.account
            )

            PlaidIntegrationPlaidTransaction.objects.create(
                plaid_item=plaid_item,
                transaction=txn.transaction,
                plaid_transaction_id=txn.plaid_transaction_id,
                imported_at=txn.imported_at
            )
        except PlaidIntegrationPlaidItem.DoesNotExist:
            # Skip if the corresponding PlaidItem doesn't exist
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('plaid_integration', '0001_initial'),
        ('accounts', '0006_plaiditem_cursor'),
    ]

    operations = [
        migrations.RunPython(copy_plaid_items),
        migrations.RunPython(copy_plaid_transactions),
    ]
