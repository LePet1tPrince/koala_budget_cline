from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

User = get_user_model()

class UserModelTest(TestCase):
    """Test cases for the User model"""

    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'securepassword123'
        }

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(**self.user_data)
        self.assertEqual(admin_user.email, self.user_data['email'])
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_email_required(self):
        """Test that email is required"""
        user_data = self.user_data.copy()
        user_data.pop('email')
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', **user_data)

    def test_email_unique(self):
        """Test that email must be unique"""
        User.objects.create_user(**self.user_data)
        with self.assertRaises(IntegrityError):
            User.objects.create_user(**self.user_data)

    def test_first_name_required(self):
        """Test that first_name is required"""
        user_data = self.user_data.copy()
        user_data['first_name'] = ''
        user = User.objects.create_user(**user_data)
        with self.assertRaises(Exception):
            user.full_clean()  # This will validate all fields

    def test_last_name_required(self):
        """Test that last_name is required"""
        user_data = self.user_data.copy()
        user_data['last_name'] = ''
        user = User.objects.create_user(**user_data)
        with self.assertRaises(Exception):
            user.full_clean()  # This will validate all fields

    def test_username_not_used(self):
        """Test that username field is not used"""
        user = User.objects.create_user(**self.user_data)
        self.assertIsNone(user.username)
