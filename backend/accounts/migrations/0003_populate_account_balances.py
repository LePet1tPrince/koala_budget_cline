# Generated manually

from django.db import migrations, models
from decimal import Decimal

def calculate_account_balance(apps, schema_editor, account_id):
    """
    Calculate the balance of an account based on all its transactions.
    """
    Account = apps.get_model('accounts', 'Account')
    Transaction = apps.get_model('accounts', 'Transaction')

    try:
        account = Account.objects.get(id=account_id)

        # Get sum of all transactions where this account is debited (money coming in)
        debit_sum = Transaction.objects.filter(debit=account).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

        # Get sum of all transactions where this account is credited (money going out)
        credit_sum = Transaction.objects.filter(credit=account).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

        # Calculate balance based on account type
        if account.type in ['Asset', 'Expense', 'Goal']:
            # For asset, expense, and goal accounts:
            # Debits increase the balance, credits decrease it
            account.balance = debit_sum - credit_sum
        elif account.type in ['Liability', 'Income', 'Equity']:
            # For liability, income, and equity accounts:
            # Credits increase the balance, debits decrease it
            account.balance = credit_sum - debit_sum

        # Save the account without triggering signals
        Account.objects.filter(id=account.id).update(balance=account.balance)

        return account.balance
    except Account.DoesNotExist:
        return None

def populate_account_balances(apps, schema_editor):
    """
    Populate all account balances based on existing transactions.
    """
    Account = apps.get_model('accounts', 'Account')
    Transaction = apps.get_model('accounts', 'Transaction')

    # Get all accounts
    accounts = Account.objects.all()

    # For each account, calculate and update its balance
    for account in accounts:
        calculate_account_balance(apps, schema_editor, account.id)

def reverse_func(apps, schema_editor):
    """
    Reverse function to set all account balances to 0.
    """
    Account = apps.get_model('accounts', 'Account')
    Account.objects.all().update(balance=Decimal('0.00'))

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_transaction_status'),
    ]

    operations = [
        migrations.RunPython(populate_account_balances, reverse_func),
    ]
