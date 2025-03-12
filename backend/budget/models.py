from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Account
from decimal import Decimal
from django.db.models import Sum, Q
from datetime import datetime, timedelta

User = get_user_model()

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    month = models.DateField()  # We'll store the first day of the month
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='budgets')
    budgeted_amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('user', 'month', 'account')

    def __str__(self):
        return f"{self.account.name} - {self.month.strftime('%B %Y')}: {self.budgeted_amount}"

    def calculate_actual_amount(self):
        """
        Calculate the sum of transactions for this account in this month.
        """
        from accounts.models import Transaction

        # Get the start and end of the month
        start_date = self.month
        # Calculate the first day of the next month
        if self.month.month == 12:
            end_date = datetime(self.month.year + 1, 1, 1).date()
        else:
            end_date = datetime(self.month.year, self.month.month + 1, 1).date()

        # Get all transactions for this account in this month
        transactions = Transaction.objects.filter(
            Q(debit=self.account) | Q(credit=self.account),
            date__gte=start_date,
            date__lt=end_date,
            user=self.user
        )

        # Calculate the sum based on account type
        debit_sum = transactions.filter(debit=self.account).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        credit_sum = transactions.filter(credit=self.account).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Calculate actual amount based on account type
        if self.account.type in ['Asset', 'Expense', 'Goal']:
            # For asset, expense, and goal accounts:
            # Debits increase the balance, credits decrease it
            return debit_sum - credit_sum
        elif self.account.type in ['Liability', 'Income', 'Equity']:
            # For liability, income, and equity accounts:
            # Credits increase the balance, debits decrease it
            return credit_sum - debit_sum

        return Decimal('0.00')
