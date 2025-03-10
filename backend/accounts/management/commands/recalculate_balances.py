from django.core.management.base import BaseCommand
from accounts.models import Account
from accounts.signals import update_account_balance

class Command(BaseCommand):
    help = 'Recalculates all account balances based on transactions'

    def handle(self, *args, **options):
        accounts = Account.objects.all()
        total = accounts.count()

        self.stdout.write(f"Recalculating balances for {total} accounts...")

        for i, account in enumerate(accounts, 1):
            old_balance = account.balance
            new_balance = update_account_balance(account.id)

            self.stdout.write(
                f"[{i}/{total}] Account {account.name} (ID: {account.id}): "
                f"Balance updated from {old_balance} to {new_balance}"
            )

        self.stdout.write(self.style.SUCCESS("All account balances have been recalculated!"))
