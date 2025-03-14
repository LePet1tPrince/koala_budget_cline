from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import Account, SubAccountType, AccountTypes, Transaction, TransactionStatus
from decimal import Decimal
from datetime import date

User = get_user_model()

class TransactionModelTest(TestCase):
    """Test cases for the Transaction model"""

    def setUp(self):
        """Set up test data"""
        # Create a test user
        self.user = User.objects.create_user(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password='securepassword123'
        )

        # Create some sub-account types
        self.checking_type = SubAccountType.objects.create(
            sub_type='Checking',
            account_type=AccountTypes.asset
        )

        self.credit_card_type = SubAccountType.objects.create(
            sub_type='Credit Card',
            account_type=AccountTypes.liability
        )

        self.salary_type = SubAccountType.objects.create(
            sub_type='Salary',
            account_type=AccountTypes.income
        )

        self.housing_type = SubAccountType.objects.create(
            sub_type='Housing',
            account_type=AccountTypes.expense
        )

        # Create test accounts
        self.checking_account = Account.objects.create(
            name='Checking Account',
            num=1000,
            type=AccountTypes.asset,
            sub_type=self.checking_type,
            inBankFeed=True,
            user=self.user
        )

        self.credit_card_account = Account.objects.create(
            name='Credit Card',
            num=2000,
            type=AccountTypes.liability,
            sub_type=self.credit_card_type,
            inBankFeed=True,
            user=self.user
        )

        self.salary_account = Account.objects.create(
            name='Salary',
            num=3000,
            type=AccountTypes.income,
            sub_type=self.salary_type,
            inBankFeed=False,
            user=self.user
        )

        self.rent_account = Account.objects.create(
            name='Rent',
            num=4000,
            type=AccountTypes.expense,
            sub_type=self.housing_type,
            inBankFeed=False,
            user=self.user
        )

    def test_transaction_creation(self):
        """Test that transactions can be created with correct attributes"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Salary deposit',
            user=self.user
        )

        self.assertEqual(transaction.date, date(2023, 1, 1))
        self.assertEqual(transaction.amount, Decimal('1000.00'))
        self.assertEqual(transaction.debit, self.checking_account)
        self.assertEqual(transaction.credit, self.salary_account)
        self.assertEqual(transaction.notes, 'Salary deposit')
        self.assertEqual(transaction.user, self.user)

        # Default values
        self.assertFalse(transaction.is_reconciled)
        self.assertEqual(transaction.status, TransactionStatus.REVIEW)

    def test_transaction_str_representation(self):
        """Test the string representation of a transaction"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Salary deposit',
            user=self.user
        )

        expected_str = f"1000.00 - {self.salary_account} -> {self.checking_account} - Salary deposit"
        self.assertEqual(str(transaction), expected_str)

    def test_transaction_status_update(self):
        """Test updating transaction status"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Initial status should be REVIEW
        self.assertEqual(transaction.status, TransactionStatus.REVIEW)

        # Update to CATEGORIZED
        transaction.status = TransactionStatus.CATEGORIZED
        transaction.save()

        # Refresh from database
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, TransactionStatus.CATEGORIZED)

        # Update to RECONCILED
        transaction.status = TransactionStatus.RECONCILED
        transaction.save()

        # Refresh from database
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, TransactionStatus.RECONCILED)

        # The is_reconciled flag should still be False (it's deprecated)
        self.assertFalse(transaction.is_reconciled)

    def test_transaction_effect_on_account_balance(self):
        """Test that transactions affect account balances correctly"""
        # Initial balances should be None
        self.assertEqual(self.checking_account.balance, None)
        self.assertEqual(self.salary_account.balance, None)

        # Create a transaction
        Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Update account balances
        self.checking_account.update_balance()
        self.salary_account.update_balance()

        # Refresh from database
        self.checking_account.refresh_from_db()
        self.salary_account.refresh_from_db()

        # Check that balances were updated correctly
        # For asset accounts (checking): debits increase, credits decrease
        self.assertEqual(self.checking_account.balance, Decimal('1000.00'))

        # For income accounts (salary): credits increase, debits decrease
        self.assertEqual(self.salary_account.balance, Decimal('1000.00'))

    def test_transaction_reconciliation_effect_on_account_balance(self):
        """Test that reconciled transactions affect reconciled balances correctly"""
        # Create a transaction with REVIEW status
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.REVIEW,
            user=self.user
        )

        # Update account balances
        self.checking_account.update_balance()
        self.salary_account.update_balance()

        # Refresh from database
        self.checking_account.refresh_from_db()
        self.salary_account.refresh_from_db()

        # Reconciled balances should be 0 (transaction is not reconciled)
        self.assertEqual(self.checking_account.reconciled_balance, Decimal('0.00'))
        self.assertEqual(self.salary_account.reconciled_balance, Decimal('0.00'))

        # Mark transaction as reconciled
        transaction.status = TransactionStatus.RECONCILED
        transaction.save()

        # Update account balances
        self.checking_account.update_balance()
        self.salary_account.update_balance()

        # Refresh from database
        self.checking_account.refresh_from_db()
        self.salary_account.refresh_from_db()

        # Reconciled balances should now reflect the transaction
        self.assertEqual(self.checking_account.reconciled_balance, Decimal('1000.00'))
        self.assertEqual(self.salary_account.reconciled_balance, Decimal('1000.00'))

    def test_multiple_transactions(self):
        """Test handling multiple transactions"""
        # Create several transactions
        # 1. Salary deposit
        Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('2000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Salary deposit',
            user=self.user
        )

        # 2. Rent payment
        Transaction.objects.create(
            date=date(2023, 1, 5),
            amount=Decimal('1000.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='Rent payment',
            user=self.user
        )

        # 3. Credit card charge
        Transaction.objects.create(
            date=date(2023, 1, 10),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.credit_card_account,
            notes='Additional housing expense',
            user=self.user
        )

        # 4. Credit card payment
        Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('500.00'),
            debit=self.credit_card_account,
            credit=self.checking_account,
            notes='Credit card payment',
            user=self.user
        )

        # Update all account balances
        self.checking_account.update_balance()
        self.credit_card_account.update_balance()
        self.salary_account.update_balance()
        self.rent_account.update_balance()

        # Refresh from database
        self.checking_account.refresh_from_db()
        self.credit_card_account.refresh_from_db()
        self.salary_account.refresh_from_db()
        self.rent_account.refresh_from_db()

        # Check final balances
        # Checking: +2000 (salary) -1000 (rent) -500 (cc payment) = +500
        self.assertEqual(self.checking_account.balance, Decimal('500.00'))

        # Credit Card: +500 (charge) -500 (payment) = 0
        self.assertEqual(self.credit_card_account.balance, Decimal('0.00'))

        # Salary: +2000 (income)
        self.assertEqual(self.salary_account.balance, Decimal('2000.00'))

        # Rent: +1000 (rent) +500 (additional) = +1500
        self.assertEqual(self.rent_account.balance, Decimal('1500.00'))
