from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from decimal import Decimal

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Required fields for createsuperuser

    objects = UserManager()

    def __str__(self):
        return self.email

class AccountTypes(models.TextChoices):
    asset = 'Asset'
    liability = 'Liability'
    income = 'Income'
    expense = 'Expense'
    equity = 'Equity'
    goal = 'Goal'

# Create your models here.
#subaccount
class SubAccountType(models.Model):
    sub_type = models.CharField(max_length=50)
    account_type = models.CharField(max_length=10, choices=AccountTypes.choices)

    def __str__(self):
        return self.account_type + " - " + self.sub_type

#account model
class Account(models.Model):
    name = models.CharField(max_length=50)
    num = models.IntegerField(unique=True)
    type = models.CharField(max_length=10, choices=AccountTypes.choices)
    sub_type = models.ForeignKey(SubAccountType, on_delete=models.CASCADE, null=True, blank=True)
    # sub_type_name = models.CharField(max_length=50, blank=True, null=True)
    inBankFeed = models.BooleanField(default=False)
    balance = models.DecimalField(max_digits=10,decimal_places=2, null=True, blank=True)
    reconciled_balance = models.DecimalField(max_digits=10,decimal_places=2, null=True, blank=True, default=0)
    icon = models.CharField(max_length=10, blank=True, null=True, default='💰')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')

    def __str__(self):
        return f"{self.num} - {self.name} ({self.type})"

    def calculate_balance(self):
        """
        Calculate the account balance based on all transactions.
        """
        from django.db.models import Sum
        from decimal import Decimal

        # Get sum of all transactions where this account is debited (money coming in)
        debit_sum = self.debit.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Get sum of all transactions where this account is credited (money going out)
        credit_sum = self.credit.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Calculate balance based on account type
        if self.type in ['Asset', 'Expense', 'Goal']:
            # For asset, expense, and goal accounts:
            # Debits increase the balance, credits decrease it
            return debit_sum - credit_sum
        elif self.type in ['Liability', 'Income', 'Equity']:
            # For liability, income, and equity accounts:
            # Credits increase the balance, debits decrease it
            return credit_sum - debit_sum

        return Decimal('0.00')

    def calculate_reconciled_balance(self):
        """
        Calculate the reconciled balance based only on transactions with status='reconciled'.
        The is_reconciled flag is deprecated and should not be used.
        """
        from django.db.models import Sum
        from decimal import Decimal

        # Get sum of reconciled transactions where this account is debited (money coming in)
        # Only use status='reconciled', ignore is_reconciled flag
        reconciled_debit_sum = self.debit.filter(status='reconciled').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Get sum of reconciled transactions where this account is credited (money going out)
        # Only use status='reconciled', ignore is_reconciled flag
        reconciled_credit_sum = self.credit.filter(status='reconciled').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Calculate reconciled balance based on account type
        if self.type in ['Asset', 'Expense', 'Goal']:
            # For asset, expense, and goal accounts:
            # Debits increase the balance, credits decrease it
            return reconciled_debit_sum - reconciled_credit_sum
        elif self.type in ['Liability', 'Income', 'Equity']:
            # For liability, income, and equity accounts:
            # Credits increase the balance, debits decrease it
            return reconciled_credit_sum - reconciled_debit_sum

        return Decimal('0.00')

    def update_balance(self):
        """
        Update the account balance and reconciled balance and save it.
        """
        self.balance = self.calculate_balance()
        self.reconciled_balance = self.calculate_reconciled_balance()

        # Use update to avoid triggering signals
        type(self).objects.filter(pk=self.pk).update(
            balance=self.balance,
            reconciled_balance=self.reconciled_balance
        )

class Merchant(models.Model):
    name = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='merchants')

    # Optional fields we could add in the future:
    # logo = models.CharField(max_length=10, blank=True, null=True)  # For emoji or icon
    # category = models.ForeignKey(SubAccountType, on_delete=models.SET_NULL, null=True, blank=True)
    # website = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

class TransactionStatus(models.TextChoices):
    REVIEW = 'review', 'Review'
    CATEGORIZED = 'categorized', 'Categorized'
    RECONCILED = 'reconciled', 'Reconciled'

#Transaction model
class Transaction(models.Model):
    date = models.DateField(auto_now_add=False)
    updated = models.DateTimeField(auto_now=True)
    # Replace CharField with ForeignKey
    # merchant = models.CharField(max_length=100, null=True, blank=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    debit = models.ForeignKey(Account,
        blank=False,
        null=False,
        on_delete=models.RESTRICT,
        related_name="debit",)
    credit = models.ForeignKey(Account,
        blank=False,
        null=False,
        on_delete=models.RESTRICT,
        related_name="credit",)
    notes = models.CharField(max_length=500, null=True, blank=True)
    is_reconciled = models.BooleanField(default=False)  # Keeping for backward compatibility
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.REVIEW
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')

    def __str__(self):
        merchant_name = self.merchant.name if self.merchant else ""
        return f"{self.amount} - {self.credit} -> {self.debit} - {merchant_name} - {self.notes}"

class Saving(models.Model):
    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name='saving',
        limit_choices_to={'type': AccountTypes.goal}
    )
    target = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    contributing_accounts = models.ManyToManyField(
        Account,
        related_name='contributes_to',
        blank=True,
        limit_choices_to={'type__in': [AccountTypes.asset, AccountTypes.liability]}
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings')

    def __str__(self):
        return f"Saving for {self.account.name} - Target: {self.target}"

    @property
    def balance(self):
        """
        Return the balance of the associated account.
        """
        return self.account.balance or Decimal('0.00')

    @property
    def progress_percentage(self):
        """
        Calculate the percentage of the target that has been saved.
        """
        if self.target and self.target > 0:
            # Convert target to Decimal to ensure type compatibility
            target_decimal = Decimal(str(self.target))
            return min(100, (self.balance / target_decimal) * 100)
        return 0
