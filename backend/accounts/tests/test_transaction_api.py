from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Account, SubAccountType, AccountTypes, Transaction, TransactionStatus
from accounts.serializers import TransactionSerializer
from decimal import Decimal
from datetime import date

User = get_user_model()

TRANSACTIONS_URL = reverse('transaction-list')

def detail_url(transaction_id):
    """Return transaction detail URL"""
    return reverse('transaction-detail', args=[transaction_id])

def status_update_url(transaction_id):
    """Return transaction status update URL"""
    return reverse('transaction-update-status', args=[transaction_id])

def bulk_update_url():
    """Return transaction bulk update URL"""
    return reverse('transaction-bulk-update')

class PublicTransactionApiTests(TestCase):
    """Test the publicly available transaction API"""

    def setUp(self):
        self.client = APIClient()

    def test_login_required(self):
        """Test that login is required for retrieving transactions"""
        res = self.client.get(TRANSACTIONS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PrivateTransactionApiTests(TestCase):
    """Test the authorized user transaction API"""

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
        self.checking_type = SubAccountType.objects.create(
            sub_type='Checking',
            account_type=AccountTypes.asset
        )

        self.expense_type = SubAccountType.objects.create(
            sub_type='Housing',
            account_type=AccountTypes.expense
        )

        self.income_type = SubAccountType.objects.create(
            sub_type='Salary',
            account_type=AccountTypes.income
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

    def test_retrieve_transactions(self):
        """Test retrieving transactions"""
        Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Salary deposit',
            user=self.user
        )
        Transaction.objects.create(
            date=date(2023, 1, 5),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='Rent payment',
            user=self.user
        )

        res = self.client.get(TRANSACTIONS_URL)

        transactions = Transaction.objects.filter(user=self.user).order_by('-date', '-updated')
        serializer = TransactionSerializer(transactions, many=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def test_transactions_limited_to_user(self):
        """Test that transactions returned are for the authenticated user"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )

        # Create accounts for other user
        other_checking = Account.objects.create(
            name='Other Checking',
            num=5000,
            type=AccountTypes.asset,
            user=other_user
        )

        other_expense = Account.objects.create(
            name='Other Expense',
            num=6000,
            type=AccountTypes.expense,
            user=other_user
        )

        # Create transaction for other user
        Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=other_expense,
            credit=other_checking,
            user=other_user
        )

        # Create transaction for authenticated user
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='My transaction',
            user=self.user
        )

        res = self.client.get(TRANSACTIONS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['notes'], transaction.notes)
        self.assertEqual(Decimal(res.data[0]['amount']), transaction.amount)

    def test_create_transaction_successful(self):
        """Test creating a new transaction"""
        payload = {
            'date': '2023-01-15',
            'amount': '750.00',
            'debit': self.rent_account.id,
            'credit': self.checking_account.id,
            'notes': 'Test transaction'
        }
        res = self.client.post(TRANSACTIONS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        transaction = Transaction.objects.get(id=res.data['id'])
        self.assertEqual(transaction.date, date(2023, 1, 15))
        self.assertEqual(transaction.amount, Decimal('750.00'))
        self.assertEqual(transaction.debit.id, payload['debit'])
        self.assertEqual(transaction.credit.id, payload['credit'])
        self.assertEqual(transaction.notes, payload['notes'])
        self.assertEqual(transaction.user, self.user)
        self.assertEqual(transaction.status, TransactionStatus.REVIEW)  # Default status

    def test_create_transaction_invalid(self):
        """Test creating an invalid transaction fails"""
        payload = {
            'date': '',
            'amount': '',
            'debit': '',
            'credit': ''
        }
        res = self.client.post(TRANSACTIONS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_transaction(self):
        """Test updating a transaction with patch"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Original note',
            user=self.user
        )

        payload = {'notes': 'Updated note'}
        url = detail_url(transaction.id)
        res = self.client.patch(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        transaction.refresh_from_db()
        self.assertEqual(transaction.notes, payload['notes'])

    def test_full_update_transaction(self):
        """Test updating a transaction with put"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Original note',
            user=self.user
        )

        payload = {
            'date': '2023-02-01',
            'amount': '1500.00',
            'debit': self.rent_account.id,
            'credit': self.checking_account.id,
            'notes': 'Updated transaction'
        }
        url = detail_url(transaction.id)
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        transaction.refresh_from_db()
        self.assertEqual(transaction.date, date(2023, 2, 1))
        self.assertEqual(transaction.amount, Decimal('1500.00'))
        self.assertEqual(transaction.debit.id, payload['debit'])
        self.assertEqual(transaction.credit.id, payload['credit'])
        self.assertEqual(transaction.notes, payload['notes'])
        self.assertEqual(transaction.user, self.user)

    def test_delete_transaction(self):
        """Test deleting a transaction"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        url = detail_url(transaction.id)
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transaction.objects.filter(id=transaction.id).exists())

    def test_filter_transactions_by_account(self):
        """Test filtering transactions by account parameter"""
        # Transaction 1: Checking (debit) and Salary (credit)
        t1 = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Transaction 2: Rent (debit) and Checking (credit)
        t2 = Transaction.objects.create(
            date=date(2023, 1, 5),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            user=self.user
        )

        # Filter by checking account (should return both transactions)
        res = self.client.get(TRANSACTIONS_URL, {'account': self.checking_account.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # Filter by rent account (should return only transaction 2)
        res = self.client.get(TRANSACTIONS_URL, {'account': self.rent_account.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]['amount']), t2.amount)

        # Filter by salary account (should return only transaction 1)
        res = self.client.get(TRANSACTIONS_URL, {'account': self.salary_account.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]['amount']), t1.amount)

    def test_filter_transactions_by_date_range(self):
        """Test filtering transactions by date range"""
        # Transaction 1: January 1
        t1 = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Transaction 2: January 15
        t2 = Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            user=self.user
        )

        # Transaction 3: February 1
        t3 = Transaction.objects.create(
            date=date(2023, 2, 1),
            amount=Decimal('750.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            user=self.user
        )

        # Filter by start_date only (January 10 onwards)
        res = self.client.get(TRANSACTIONS_URL, {'start_date': '2023-01-10'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)  # Should return t2 and t3

        # Filter by end_date only (up to January 20)
        res = self.client.get(TRANSACTIONS_URL, {'end_date': '2023-01-20'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)  # Should return t1 and t2

        # Filter by both start_date and end_date (January 10 to January 20)
        res = self.client.get(TRANSACTIONS_URL, {
            'start_date': '2023-01-10',
            'end_date': '2023-01-20'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)  # Should return only t2
        self.assertEqual(Decimal(res.data[0]['amount']), t2.amount)

    def test_filter_transactions_by_status(self):
        """Test filtering transactions by status"""
        # Transaction 1: Review status
        t1 = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.REVIEW,
            user=self.user
        )

        # Transaction 2: Categorized status
        t2 = Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            status=TransactionStatus.CATEGORIZED,
            user=self.user
        )

        # Transaction 3: Reconciled status
        t3 = Transaction.objects.create(
            date=date(2023, 2, 1),
            amount=Decimal('750.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.RECONCILED,
            user=self.user
        )

        # Filter by review status
        res = self.client.get(TRANSACTIONS_URL, {'status': TransactionStatus.REVIEW})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['status'], TransactionStatus.REVIEW)

        # Filter by categorized status
        res = self.client.get(TRANSACTIONS_URL, {'status': TransactionStatus.CATEGORIZED})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['status'], TransactionStatus.CATEGORIZED)

        # Filter by reconciled status
        res = self.client.get(TRANSACTIONS_URL, {'status': TransactionStatus.RECONCILED})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['status'], TransactionStatus.RECONCILED)

    def test_update_transaction_status(self):
        """Test updating a transaction's status"""
        transaction = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            status=TransactionStatus.REVIEW,
            user=self.user
        )

        url = status_update_url(transaction.id)
        payload = {'status': TransactionStatus.RECONCILED}
        res = self.client.patch(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, TransactionStatus.RECONCILED)

    def test_bulk_update_transactions(self):
        """Test bulk updating multiple transactions"""
        # Create test transactions
        t1 = Transaction.objects.create(
            date=date(2023, 1, 1),
            amount=Decimal('1000.00'),
            debit=self.checking_account,
            credit=self.salary_account,
            notes='Original note 1',
            user=self.user
        )

        t2 = Transaction.objects.create(
            date=date(2023, 1, 15),
            amount=Decimal('500.00'),
            debit=self.rent_account,
            credit=self.checking_account,
            notes='Original note 2',
            user=self.user
        )

        # Test bulk update of notes
        url = bulk_update_url()
        payload = {
            'ids': [t1.id, t2.id],
            'notes': 'Updated note for both'
        }
        # Use format='json' to ensure the data is sent as JSON
        res = self.client.post(url, payload, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        t1.refresh_from_db()
        t2.refresh_from_db()
        self.assertEqual(t1.notes, 'Updated note for both')
        self.assertEqual(t2.notes, 'Updated note for both')

        # Test bulk update of status
        payload = {
            'ids': [t1.id, t2.id],
            'status': TransactionStatus.RECONCILED
        }
        res = self.client.post(url, payload, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        t1.refresh_from_db()
        t2.refresh_from_db()
        self.assertEqual(t1.status, TransactionStatus.RECONCILED)
        self.assertEqual(t2.status, TransactionStatus.RECONCILED)

        # Test bulk update of category (changing the credit account for transactions with checking as debit)
        payload = {
            'ids': [t1.id],
            'category': self.rent_account.id,
            'selectedAccountId': self.checking_account.id
        }
        res = self.client.post(url, payload, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        t1.refresh_from_db()
        self.assertEqual(t1.credit.id, self.rent_account.id)
