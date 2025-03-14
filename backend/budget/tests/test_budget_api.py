from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from budget.models import Budget
from budget.serializers import BudgetSerializer
from accounts.models import Account, SubAccountType, AccountTypes
from decimal import Decimal
from datetime import date

User = get_user_model()

BUDGETS_URL = reverse('budget-list')

def detail_url(budget_id):
    """Return budget detail URL"""
    return reverse('budget-detail', args=[budget_id])

class PublicBudgetApiTests(TestCase):
    """Test the publicly available budget API"""

    def setUp(self):
        self.client = APIClient()

    def test_login_required(self):
        """Test that login is required for retrieving budgets"""
        res = self.client.get(BUDGETS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PrivateBudgetApiTests(TestCase):
    """Test the authorized user budget API"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create some sub-account types
        self.expense_type = SubAccountType.objects.create(
            sub_type='Housing',
            account_type=AccountTypes.expense
        )

        self.income_type = SubAccountType.objects.create(
            sub_type='Salary',
            account_type=AccountTypes.income
        )

        # Create test accounts
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

    def test_retrieve_budgets(self):
        """Test retrieving budgets"""
        Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )
        Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.salary_account,
            budgeted_amount=Decimal('3000.00')
        )

        res = self.client.get(BUDGETS_URL)

        budgets = Budget.objects.filter(user=self.user).order_by('id')
        serializer = BudgetSerializer(budgets, many=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def test_budgets_limited_to_user(self):
        """Test that budgets returned are for the authenticated user"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )

        # Create account for other user
        other_account = Account.objects.create(
            name='Other Account',
            num=5000,
            type=AccountTypes.expense,
            user=other_user
        )

        # Create budget for other user
        Budget.objects.create(
            user=other_user,
            month=date(2023, 1, 1),
            account=other_account,
            budgeted_amount=Decimal('1000.00')
        )

        # Create budget for authenticated user
        budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        res = self.client.get(BUDGETS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]['budgeted_amount']), budget.budgeted_amount)
        self.assertEqual(res.data[0]['account'], budget.account.id)

    def test_create_budget_successful(self):
        """Test creating a new budget"""
        payload = {
            'month': '2023-02-01',
            'account': self.rent_account.id,
            'budgeted_amount': '1200.00'
        }
        res = self.client.post(BUDGETS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        budget = Budget.objects.get(id=res.data['id'])
        self.assertEqual(budget.month, date(2023, 2, 1))
        self.assertEqual(budget.account.id, payload['account'])
        self.assertEqual(budget.budgeted_amount, Decimal('1200.00'))
        self.assertEqual(budget.user, self.user)

    def test_create_budget_invalid(self):
        """Test creating an invalid budget fails"""
        payload = {
            'month': '',
            'account': '',
            'budgeted_amount': ''
        }
        res = self.client.post(BUDGETS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_budget(self):
        """Test updating a budget with patch"""
        budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        payload = {'budgeted_amount': '1500.00'}
        url = detail_url(budget.id)
        res = self.client.patch(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        budget.refresh_from_db()
        self.assertEqual(budget.budgeted_amount, Decimal('1500.00'))

    def test_full_update_budget(self):
        """Test updating a budget with put"""
        budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        payload = {
            'month': '2023-02-01',
            'account': self.salary_account.id,
            'budgeted_amount': '3500.00'
        }
        url = detail_url(budget.id)
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        budget.refresh_from_db()
        self.assertEqual(budget.month, date(2023, 2, 1))
        self.assertEqual(budget.account.id, payload['account'])
        self.assertEqual(budget.budgeted_amount, Decimal('3500.00'))
        self.assertEqual(budget.user, self.user)

    def test_delete_budget(self):
        """Test deleting a budget"""
        budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        url = detail_url(budget.id)
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Budget.objects.filter(id=budget.id).exists())

    def test_filter_budgets_by_month(self):
        """Test filtering budgets by month"""
        # January budget
        b1 = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        # February budget
        b2 = Budget.objects.create(
            user=self.user,
            month=date(2023, 2, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1100.00')
        )

        # Filter by January
        res = self.client.get(BUDGETS_URL, {'month': '2023-01-01'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]['budgeted_amount']), b1.budgeted_amount)

        # Filter by February
        res = self.client.get(BUDGETS_URL, {'month': '2023-02-01'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]['budgeted_amount']), b2.budgeted_amount)

    def test_actual_amount_included_in_response(self):
        """Test that actual_amount is included in the budget response"""
        from accounts.models import Transaction

        # Create a budget
        budget = Budget.objects.create(
            user=self.user,
            month=date(2023, 1, 1),
            account=self.rent_account,
            budgeted_amount=Decimal('1000.00')
        )

        # Create a transaction for this account in this month
        Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('800.00'),
            debit=self.rent_account,
            credit=Account.objects.create(
                name='Checking',
                num=1000,
                type=AccountTypes.asset,
                user=self.user
            ),
            user=self.user
        )

        # Get the budget
        url = detail_url(budget.id)
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('actual_amount', res.data)
        self.assertEqual(Decimal(res.data['actual_amount']), Decimal('800.00'))
