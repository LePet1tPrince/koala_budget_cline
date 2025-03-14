from django.test import TestCase
from django.contrib.auth import get_user_model
from budget.models import Budget
from accounts.models import Account, SubAccountType, AccountTypes, Transaction
from decimal import Decimal
from datetime import date

User = get_user_model()

class BudgetModelTest(TestCase):
    """Test cases for the Budget model"""

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
        self.expense_type = SubAccountType.objects.create(
            sub_type='Housing',
            account_type=AccountTypes.expense
        )

        self.income_type = SubAccountType.objects.create(
            sub_type='Salary',
            account_type=AccountTypes.income
        )

        self.checking_type = SubAccountType.objects.create(
            sub_type='Checking',
            account_type=AccountTypes.asset
        )

        # Create test accounts
        self.checking_account = Account.objects.create(
            name='Checking Account',
            num=1000,
            type=AccountTypes.asset,
            sub_type=self.checking_type,
            user=self.user
        )

        self.rent_account = Account.objects.create(
            name='Rent',
            num=2000,
            type=AccountTypes.expense,
            sub_type=self.expense_type,
            user=self.user
        )

        self.salary_account = Account.objects.create(
            name='Salary',
            num=3000,
            type=AccountTypes.income,
            sub_type=self.income_type,
            user=self.user
        )

        # Create a budget for January 2023
        self.january_budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

    def test_budget_creation(self):
        """Test that budgets can be created with correct attributes"""
        self.assertEqual(self.january_budget.user, self.user)
        self.assertEqual(self.january_budget.month, date(2023, 1, 1))
        self.assertEqual(self.january_budget.account, self.rent_account)
        self.assertEqual(self.january_budget.budgeted_amount, Decimal('1000.00'))

    def test_budget_str_representation(self):
        """Test the string representation of a budget"""
        expected_str = f"{self.rent_account.name} - January 2023: 1000.00"
        self.assertEqual(str(self.january_budget), expected_str)

    def test_calculate_actual_amount_no_transactions(self):
        """Test calculating actual amount with no transactions"""
        actual_amount = self.january_budget.calculate_actual_amount()
        self.assertEqual(actual_amount, Decimal('0.00'))

    def test_calculate_actual_amount_with_transactions(self):
        """Test calculating actual amount with transactions in the month"""
        # Create transactions in January 2023
        Transaction.objects.create(
            date=date(2023, 1, 5),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='Rent payment 1',
            user=self.user
        )

        Transaction.objects.create(
            date=date(2023, 1, 20),
            amount=Decimal('300.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='Rent payment 2',
            user=self.user
        )

        # Calculate actual amount
        actual_amount = self.january_budget.calculate_actual_amount()

        # For expense accounts: debits increase, credits decrease
        # 500 + 300 = 800
        self.assertEqual(actual_amount, Decimal('800.00'))

    def test_calculate_actual_amount_with_transactions_outside_month(self):
        """Test that transactions outside the budget month are not counted"""
        # Create a transaction in January 2023 (should be counted)
        Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='January rent',
            user=self.user
        )

        # Create a transaction in February 2023 (should not be counted)
        Transaction.objects.create(
            date=date(2023, 2, 1),
            amount=Decimal('1000.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='February rent',
            user=self.user
        )

        # Calculate actual amount for January
        actual_amount = self.january_budget.calculate_actual_amount()

        # Only the January transaction should be counted
        self.assertEqual(actual_amount, Decimal('500.00'))

    def test_calculate_actual_amount_income_account(self):
        """Test calculating actual amount for an income account"""
        # Create a budget for the salary account
        salary_budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.salary_account,
            budgeted_amount=Decimal('3000.00')
        )

        # Create a salary transaction
        Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('3500.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='January salary',
            user=self.user
        )

        # Calculate actual amount
        actual_amount = salary_budget.calculate_actual_amount()

        # For income accounts: credits increase, debits decrease
        self.assertEqual(actual_amount, Decimal('3500.00'))

    def test_unique_together_constraint(self):
        """Test that user, month, and account must be unique together"""
        # Attempt to create a duplicate budget for the same user, month, and account
        from django.db import transaction

        with transaction.atomic():
            with self.assertRaises(Exception):
                Budget.objects.create(
                    user=self.user,
                    month=date(2023, 1, 1),
                    account=self.rent_account,
                    budgeted_amount=Decimal('1200.00')
                )

        # Should be able to create a budget for the same user and month but different account
        Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.salary_account,
            budgeted_amount=Decimal('3000.00')
        )

        # Should be able to create a budget for the same user and account but different month
        Budget.objects.create(
            user=self.user,
            month=date(2023, 2, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        # Should be able to create a budget for a different user but same month and account
        other_user = User.objects.create_user(
            email='other@example.com',
            first_name='Other',
            last_name='User',
            password='otherpass123'
        )

        Budget.objects.create(
            user=other_user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )
