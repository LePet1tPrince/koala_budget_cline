from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.db.models import Sum, Q
from decimal import Decimal

from .models import Transaction, Account

def update_account_balance(account_id):
    """
    Update the balance of an account based on all its transactions.

    For double-entry accounting:
    - When account is debited (money coming in), add to balance
    - When account is credited (money going out), subtract from balance
    """
    try:
        account = Account.objects.get(id=account_id)

        # Get sum of all transactions where this account is debited (money coming in)
        debit_sum = Transaction.objects.filter(debit=account).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Get sum of all transactions where this account is credited (money going out)
        credit_sum = Transaction.objects.filter(credit=account).aggregate(
            total=Sum('amount')
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

@receiver(post_save, sender=Transaction)
def update_balances_on_transaction_change(sender, instance, created, **kwargs):
    """
    Update account balances when a transaction is created or updated.
    """
    # Use transaction.atomic to ensure both accounts are updated or neither is
    with transaction.atomic():
        # Update both accounts involved in the transaction
        update_account_balance(instance.debit.id)
        update_account_balance(instance.credit.id)

@receiver(post_delete, sender=Transaction)
def update_balances_on_transaction_delete(sender, instance, **kwargs):
    """
    Update account balances when a transaction is deleted.
    """
    # Use transaction.atomic to ensure both accounts are updated or neither is
    with transaction.atomic():
        # Update both accounts involved in the transaction
        update_account_balance(instance.debit.id)
        update_account_balance(instance.credit.id)
