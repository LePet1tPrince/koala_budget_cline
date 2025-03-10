from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from .models import SubAccountType, Account, Transaction
from .serializers import (
    UserSerializer, UserCreateSerializer, SubAccountTypeSerializer,
    AccountSerializer, TransactionSerializer
)
from .permissions import IsOwner

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy', 'me']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        print(f"Creating user with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class SubAccountTypeViewSet(viewsets.ModelViewSet):
    queryset = SubAccountType.objects.all()
    serializer_class = SubAccountTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        # Create default sub-account types if none exist
        if SubAccountType.objects.count() == 0:
            default_types = [
                {"sub_type": "Checking", "account_type": "Asset"},
                {"sub_type": "Savings", "account_type": "Asset"},
                {"sub_type": "Credit Card", "account_type": "Liability"},
                {"sub_type": "Loan", "account_type": "Liability"},
                {"sub_type": "Salary", "account_type": "Income"},
                {"sub_type": "Investment", "account_type": "Income"},
                {"sub_type": "Housing", "account_type": "Expense"},
                {"sub_type": "Food", "account_type": "Expense"},
                {"sub_type": "Transportation", "account_type": "Expense"},
                {"sub_type": "Entertainment", "account_type": "Expense"},
                {"sub_type": "Retained Earnings", "account_type": "Equity"},
                {"sub_type": "Vacation", "account_type": "Goal"},
                {"sub_type": "Emergency Fund", "account_type": "Goal"},
            ]

            for type_data in default_types:
                SubAccountType.objects.create(**type_data)

        return super().list(request, *args, **kwargs)

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error creating account: {e}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
