from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import Account, SubAccountType, AccountTypes
from decimal import Decimal

User = get_user_model()

class AccountModelTest(TestCase):
    """Test cases for the Account model"""

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

    def test_account_creation(self):
        """Test that accounts can be created with correct attributes"""
        self.assertEqual(self.checking_account.name, 'Checking Account')
        self.assertEqual(self.checking_account.num, 1000)
        self.assertEqual(self.checking_account.type, AccountTypes.asset)
        self.assertEqual(self.checking_account.sub_type, self.checking_type)
        self.assertTrue(self.checking_account.inBankFeed)
        self.assertEqual(self.checking_account.user, self.user)

        # Default values
        self.assertEqual(self.checking_account.balance, None)
        self.assertEqual(self.checking_account.reconciled_balance, Decimal('0'))
        self.assertEqual(self.checking_account.icon, '💰')  # Default icon

    def test_account_str_representation(self):
        """Test the string representation of an account"""
        expected_str = f"1000 - Checking Account ({AccountTypes.asset})"
        self.assertEqual(str(self.checking_account), expected_str)

    def test_calculate_balance_asset_account(self):
        """Test balance calculation for asset accounts"""
        from accounts.models import Transaction

        # Create transactions
        # Deposit to checking (debit checking, credit income)
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Pay rent (debit expense, credit checking)
        Transaction.objects.create(
            date='2023-01-02',
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            user=self.user
        )

        # Calculate balance
        balance = self.checking_account.calculate_balance()

        # For asset accounts: debits increase, credits decrease
        # 1000 (deposit) - 500 (rent payment) = 500
        self.assertEqual(balance, Decimal('500.00'))

    def test_calculate_balance_liability_account(self):
        """Test balance calculation for liability accounts"""
        from accounts.models import Transaction

        # Create transactions
        # Charge to credit card (debit expense, credit liability)
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('200.00'),
            debit=self.rent_account,
            credit=self.credit_card_account,
            user=self.user
        )

        # Pay credit card (debit liability, credit asset)
        Transaction.objects.create(
            date='2023-01-15',
            amount=Decimal('100.00'),
            debit=self.credit_card_account,
            credit=self.checking_account,
            user=self.user
        )

        # Calculate balance
        balance = self.credit_card_account.calculate_balance()

        # For liability accounts: credits increase, debits decrease
        # 200 (charge) - 100 (payment) = 100
        self.assertEqual(balance, Decimal('100.00'))

    def test_calculate_balance_income_account(self):
        """Test balance calculation for income accounts"""
        from accounts.models import Transaction

        # Create transactions
        # Salary income (debit asset, credit income)
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('2000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Another salary payment
        Transaction.objects.create(
            date='2023-01-15',
            amount=Decimal('2000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Calculate balance
        balance = self.salary_account.calculate_balance()

        # For income accounts: credits increase, debits decrease
        # 2000 + 2000 = 4000
        self.assertEqual(balance, Decimal('4000.00'))

    def test_calculate_balance_expense_account(self):
        """Test balance calculation for expense accounts"""
        from accounts.models import Transaction

        # Create transactions
        # Rent payment (debit expense, credit asset)
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('1000.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            user=self.user
        )

        # Another rent payment
        Transaction.objects.create(
            date='2023-02-01',
            amount=Decimal('1000.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            user=self.user
        )

        # Calculate balance
        balance = self.rent_account.calculate_balance()

        # For expense accounts: debits increase, credits decrease
        # 1000 + 1000 = 2000
        self.assertEqual(balance, Decimal('2000.00'))

    def test_calculate_reconciled_balance(self):
        """Test reconciled balance calculation"""
        from accounts.models import Transaction, TransactionStatus

        # Create transactions
        # Reconciled transaction
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.RECONCILED,
            user=self.user
        )

        # Non-reconciled transaction
        Transaction.objects.create(
            date='2023-01-02',
            amount=Decimal('500.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.CATEGORIZED,
            user=self.user
        )

        # Calculate reconciled balance
        reconciled_balance = self.checking_account.calculate_reconciled_balance()

        # Only the reconciled transaction should be counted
        self.assertEqual(reconciled_balance, Decimal('1000.00'))

    def test_update_balance(self):
        """Test updating account balance"""
        from accounts.models import Transaction

        # Create a transaction
        Transaction.objects.create(
            date='2023-01-01',
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Initially balance is None
        self.assertEqual(self.checking_account.balance, None)

        # Update balance
        self.checking_account.update_balance()

        # Refresh from database
        self.checking_account.refresh_from_db()

        # Check that balance was updated
        self.assertEqual(self.checking_account.balance, Decimal('1000.00'))
        self.assertEqual(self.checking_account.reconciled_balance, Decimal('0.00'))
