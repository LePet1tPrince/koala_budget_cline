from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Account, SubAccountType, AccountTypes
from accounts.serializers import AccountSerializer
from decimal import Decimal

User = get_user_model()

ACCOUNTS_URL = reverse('account-list')

def detail_url(account_id):
    """Return account detail URL"""
    return reverse('account-detail', args=[account_id])

class PublicAccountApiTests(TestCase):
    """Test the publicly available account API"""

    def setUp(self):
        self.client = APIClient()

    def test_login_required(self):
        """Test that login is required for retrieving accounts"""
        res = self.client.get(ACCOUNTS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PrivateAccountApiTests(TestCase):
    """Test the authorized user account API"""

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

        self.credit_card_type = SubAccountType.objects.create(
            sub_type='Credit Card',
            account_type=AccountTypes.liability
        )

    def test_retrieve_accounts(self):
        """Test retrieving accounts"""
        Account.objects.create(
            name='Checking Account',
            num=1000,
            type=AccountTypes.asset,
            sub_type=self.checking_type,
            user=self.user
        )
        Account.objects.create(
            name='Credit Card',
            num=2000,
            type=AccountTypes.liability,
            sub_type=self.credit_card_type,
            user=self.user
        )

        res = self.client.get(ACCOUNTS_URL)

        accounts = Account.objects.filter(user=self.user).order_by('id')
        serializer = AccountSerializer(accounts, many=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def test_accounts_limited_to_user(self):
        """Test that accounts returned are for the authenticated user"""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )
        # Create account for other user
        Account.objects.create(
            name='Other Account',
            num=3000,
            type=AccountTypes.asset,
            user=other_user
        )
        # Create account for authenticated user
        account = Account.objects.create(
            name='My Account',
            num=1000,
            type=AccountTypes.asset,
            user=self.user
        )

        res = self.client.get(ACCOUNTS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], account.name)
        self.assertEqual(res.data[0]['num'], account.num)

    def test_create_account_successful(self):
        """Test creating a new account"""
        payload = {
            'name': 'New Account',
            'num': 1000,
            'type': AccountTypes.asset,
            'sub_type': self.checking_type.id,
            'inBankFeed': True,
            'icon': '💰'
        }
        res = self.client.post(ACCOUNTS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        account = Account.objects.get(id=res.data['id'])
        for key in payload:
            if key == 'sub_type':
                if account.sub_type:
                    self.assertEqual(account.sub_type.id, payload[key])
            else:
                self.assertEqual(getattr(account, key), payload[key])
        self.assertEqual(account.user, self.user)

    def test_create_account_invalid(self):
        """Test creating an invalid account fails"""
        payload = {
            'name': '',
            'num': '',
            'type': ''
        }
        res = self.client.post(ACCOUNTS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_account(self):
        """Test updating an account with patch"""
        account = Account.objects.create(
            name='Original Name',
            num=1000,
            type=AccountTypes.asset,
            user=self.user
        )

        payload = {'name': 'New Name'}
        url = detail_url(account.id)
        self.client.patch(url, payload)

        account.refresh_from_db()
        self.assertEqual(account.name, payload['name'])

    def test_full_update_account(self):
        """Test updating an account with put"""
        account = Account.objects.create(
            name='Original Name',
            num=1000,
            type=AccountTypes.asset,
            user=self.user
        )

        payload = {
            'name': 'New Name',
            'num': 2000,
            'type': AccountTypes.liability,
            'sub_type': self.credit_card_type.id,
            'inBankFeed': True,
            'icon': '💳'
        }
        url = detail_url(account.id)
        self.client.put(url, payload)

        account.refresh_from_db()
        for key in payload:
            if key == 'sub_type':
                if account.sub_type:
                    self.assertEqual(account.sub_type.id, payload[key])
            else:
                self.assertEqual(getattr(account, key), payload[key])
        self.assertEqual(account.user, self.user)

    def test_delete_account(self):
        """Test deleting an account"""
        account = Account.objects.create(
            name='Account to Delete',
            num=9999,
            type=AccountTypes.asset,
            user=self.user
        )

        url = detail_url(account.id)
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Account.objects.filter(id=account.id).exists())

    def test_filter_accounts_by_inBankFeed(self):
        """Test filtering accounts by inBankFeed parameter"""
        account1 = Account.objects.create(
            name='Bank Feed Account',
            num=1000,
            type=AccountTypes.asset,
            inBankFeed=True,
            user=self.user
        )
        account2 = Account.objects.create(
            name='Regular Account',
            num=2000,
            type=AccountTypes.expense,
            inBankFeed=False,
            user=self.user
        )

        res = self.client.get(ACCOUNTS_URL, {'inBankFeed': 'true'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], account1.name)

        res = self.client.get(ACCOUNTS_URL, {'inBankFeed': 'false'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], account2.name)
