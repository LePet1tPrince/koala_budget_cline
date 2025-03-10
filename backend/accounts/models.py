from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')

    def __str__(self):
        return f"{self.num} - {self.name} ({self.type})"

#Transaction model
class Transaction(models.Model):
    date = models.DateField(auto_now_add=False)
    updated = models.DateTimeField(auto_now=True)
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
    is_reconciled = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')

    def __str__(self):
        return str(self.amount) + " - " + str(self.credit) + " -> " + str(self.debit) + " - " + str(self.notes)
