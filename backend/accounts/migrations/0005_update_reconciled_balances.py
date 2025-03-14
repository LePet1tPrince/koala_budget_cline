from django.db import migrations

def update_reconciled_balances(apps, schema_editor):
    """
    Update the reconciled_balance field for all accounts.
    """
    Account = apps.get_model('accounts', 'Account')

    # Get all accounts
    accounts = Account.objects.all()

    # Update each account's reconciled balance
    for account in accounts:
        # We can't use the model methods directly in migrations,
        # so we need to recalculate the reconciled balance here
        from django.db.models import Sum
        from decimal import Decimal

        # Get sum of reconciled transactions where this account is debited
        reconciled_debit_sum = account.debit.filter(status='reconciled').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Get sum of reconciled transactions where this account is credited
        reconciled_credit_sum = account.credit.filter(status='reconciled').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Calculate reconciled balance based on account type
        if account.type in ['Asset', 'Expense', 'Goal']:
            # For asset, expense, and goal accounts:
            # Debits increase the balance, credits decrease it
            reconciled_balance = reconciled_debit_sum - reconciled_credit_sum
        elif account.type in ['Liability', 'Income', 'Equity']:
            # For liability, income, and equity accounts:
            # Credits increase the balance, debits decrease it
            reconciled_balance = reconciled_credit_sum - reconciled_debit_sum
        else:
            reconciled_balance = Decimal('0.00')

        # Update the account's reconciled_balance
        account.reconciled_balance = reconciled_balance
        account.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_account_icon'),
    ]

    operations = [
        migrations.RunPython(update_reconciled_balances),
    ]
