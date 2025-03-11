from django.db import models
from django.contrib.auth import get_user_model
from .models import Account, Transaction

User = get_user_model()

class PlaidItem(models.Model):
    """
    Represents a connection to a financial institution through Plaid.
    Each PlaidItem is associated with a user and an account in the system.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plaid_items')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='plaid_connection')
    item_id = models.CharField(max_length=255)
    access_token = models.CharField(max_length=255)
    plaid_account_id = models.CharField(max_length=255, null=True, blank=True)
    institution_name = models.CharField(max_length=255, null=True, blank=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    cursor = models.CharField(max_length=255, null=True, blank=True)  # Store cursor for transaction syncing
    status = models.CharField(max_length=50, default='active')  # active, error, disconnected
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.institution_name} - {self.account.name}"

    class Meta:
        unique_together = ('user', 'account')

class PlaidTransaction(models.Model):
    """
    Represents a transaction imported from Plaid.
    Links a Plaid transaction to a transaction in the system.
    """
    plaid_item = models.ForeignKey(PlaidItem, on_delete=models.CASCADE, related_name='plaid_transactions')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='plaid_source')
    plaid_transaction_id = models.CharField(max_length=255, unique=True)
    imported_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Plaid Transaction: {self.plaid_transaction_id}"
