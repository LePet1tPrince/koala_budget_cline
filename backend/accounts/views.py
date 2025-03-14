from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from datetime import datetime
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q, Sum
from .models import SubAccountType, Account, Transaction, AccountTypes
from .serializers import (
    UserSerializer, UserCreateSerializer, SubAccountTypeSerializer,
    AccountSerializer, TransactionSerializer
)
from decimal import Decimal
from .permissions import IsOwner

User = get_user_model()

class AccountBalanceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get account balances as of a specific date.

        Query parameters:
        - as_of_date: The date to calculate balances up to (format: YYYY-MM-DD)
        """
        try:
            # Get the as_of_date parameter
            as_of_date_str = request.query_params.get('as_of_date')
            if not as_of_date_str:
                return Response(
                    {"detail": "as_of_date parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse the date
            try:
                as_of_date = datetime.strptime(as_of_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Expected YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get all accounts for the user
            accounts = Account.objects.filter(user=request.user)

            # Calculate balance for each account
            account_balances = []
            for account in accounts:
                # Get all transactions for this account up to the as_of_date
                transactions = Transaction.objects.filter(
                    Q(debit=account) | Q(credit=account),
                    date__lte=as_of_date,
                    user=request.user
                )

                # Calculate the balance
                debit_sum = transactions.filter(debit=account).aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')

                credit_sum = transactions.filter(credit=account).aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')

                # Calculate balance based on account type
                if account.type in ['Asset', 'Expense', 'Goal']:
                    # For asset, expense, and goal accounts:
                    # Debits increase the balance, credits decrease it
                    balance = debit_sum - credit_sum
                elif account.type in ['Liability', 'Income', 'Equity']:
                    # For liability, income, and equity accounts:
                    # Credits increase the balance, debits decrease it
                    balance = credit_sum - debit_sum
                else:
                    balance = Decimal('0.00')

                account_balances.append({
                    'account_id': account.id,
                    'account_name': account.name,
                    'account_type': account.type,
                    'balance': balance
                })

            return Response(account_balances)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        queryset = Account.objects.filter(user=self.request.user)

        # Filter by inBankFeed if specified
        in_bank_feed = self.request.query_params.get('inBankFeed', None)
        if in_bank_feed is not None:
            # Convert string 'true'/'false' to boolean
            in_bank_feed_bool = in_bank_feed.lower() == 'true'
            queryset = queryset.filter(inBankFeed=in_bank_feed_bool)

        return queryset

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
        queryset = Transaction.objects.filter(user=self.request.user)

        # Filter by status if specified
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by account if specified
        account_id = self.request.query_params.get('account', None)
        if account_id:
            try:
                # Convert to integer to avoid type issues
                account_id = int(account_id)

                # Match transactions where this account is either the debit or credit account
                queryset = queryset.filter(
                    models.Q(debit_id=account_id) | models.Q(credit_id=account_id)
                )
                print(f"Filtered transactions for account {account_id}: {queryset.count()}")
            except (ValueError, TypeError) as e:
                print(f"Invalid account_id parameter: {account_id}, error: {e}")
                # Return empty queryset if account_id is invalid
                return Transaction.objects.none()

        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                print(f"Invalid start_date parameter: {start_date}")
                # Return empty queryset if start_date is invalid
                return Transaction.objects.none()

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                print(f"Invalid end_date parameter: {end_date}")
                # Return empty queryset if end_date is invalid
                return Transaction.objects.none()

        return queryset.order_by('-date', '-updated')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            print(f"Created transaction: {response.data}")
            return response
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        status_value = request.data.get('status')

        # Validate status value
        from .models import TransactionStatus
        if status_value not in [choice[0] for choice in TransactionStatus.choices]:
            return Response(
                {"detail": f"Invalid status value. Must be one of: {[choice[0] for choice in TransactionStatus.choices]}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status only (is_reconciled flag is deprecated)
        transaction.status = status_value
        transaction.save()

        # Update account balances for both debit and credit accounts
        # This ensures the reconciled_balance is updated
        if transaction.debit:
            transaction.debit.update_balance()
        if transaction.credit:
            transaction.credit.update_balance()

        serializer = self.get_serializer(transaction)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Update multiple transactions at once.

        Expected request data:
        - ids: List of transaction IDs to update
        - category: (optional) Category ID to set for all transactions
        - notes: (optional) Notes to set for all transactions
        - is_reconciled: (optional) Boolean to set reconciled status
        """
        # Debug logging
        print(f"Bulk update request data: {request.data}")
        print(f"Bulk update query params: {request.query_params}")

        try:
            # Get transaction IDs and update data
            transaction_ids = request.data.get('ids', [])

            if not transaction_ids:
                return Response(
                    {"detail": "No transaction IDs provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate that transaction_ids is a list
            if not isinstance(transaction_ids, list):
                return Response(
                    {"detail": "Transaction IDs must be provided as a list"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate that all transactions exist and belong to the user
            transactions = Transaction.objects.filter(
                id__in=transaction_ids,
                user=request.user
            )

            if len(transactions) != len(transaction_ids):
                # Find which transaction IDs don't exist
                found_ids = [str(t.id) for t in transactions]
                missing_ids = [str(tid) for tid in transaction_ids if str(tid) not in found_ids]
                return Response(
                    {
                        "detail": "Some transactions were not found",
                        "missing_ids": missing_ids
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Process updates
            updated_count = 0
            updated_fields = []

            # Handle category updates if provided
            if 'category' in request.data:
                category_id = request.data.get('category')
                if not category_id:
                    return Response(
                        {"detail": "Category ID cannot be empty if category field is included"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validate that the category account exists
                try:
                    category_account = Account.objects.get(id=category_id, user=request.user)
                    updated_fields.append('category')
                except Account.DoesNotExist:
                    return Response(
                        {"detail": f"Category account with ID {category_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Get the selected account ID from query params or request data
                selected_account_id = None

                # First try to get from query params
                account_param = request.query_params.get('account')
                if account_param:
                    try:
                        selected_account_id = int(account_param)
                        print(f"Selected account ID from query params: {selected_account_id}")
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing account param from query params: {e}")

                # If not found in query params, try to get from request data
                if not selected_account_id and 'selectedAccountId' in request.data:
                    try:
                        selected_account_id = int(request.data.get('selectedAccountId'))
                        print(f"Selected account ID from request data: {selected_account_id}")
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing account param from request data: {e}")

                if not selected_account_id:
                    return Response(
                        {"detail": "Selected account ID is required for category updates"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update each transaction's category
                for transaction in transactions:
                    if selected_account_id:
                        # Debug logging
                        print(f"Transaction {transaction.id}: debit_id={transaction.debit_id}, credit_id={transaction.credit_id}")

                        # Update the appropriate field based on which account is the selected one
                        if transaction.debit_id == selected_account_id:
                            print(f"Updating credit_id to {category_id} (selected account is debit)")
                            transaction.credit_id = category_id
                        else:
                            print(f"Updating debit_id to {category_id} (selected account is credit)")
                            transaction.debit_id = category_id

                        transaction.save()
                        updated_count += 1
                    else:
                        print(f"Skipping transaction {transaction.id} - no selected account ID")

            # Handle notes updates if provided
            if 'notes' in request.data:
                notes = request.data.get('notes')
                # Notes can be empty, so we don't need to validate
                updated_fields.append('notes')
                for transaction in transactions:
                    transaction.notes = notes
                    transaction.save()
                    updated_count += 1

            # Handle is_reconciled updates if provided
            if 'is_reconciled' in request.data:
                is_reconciled = request.data.get('is_reconciled')
                updated_fields.append('is_reconciled')
                for transaction in transactions:
                    transaction.is_reconciled = is_reconciled
                    transaction.save()
                    updated_count += 1

            # Handle status updates if provided
            if 'status' in request.data:
                status_value = request.data.get('status')
                from .models import TransactionStatus
                if status_value not in [choice[0] for choice in TransactionStatus.choices]:
                    return Response(
                        {"detail": f"Invalid status value. Must be one of: {[choice[0] for choice in TransactionStatus.choices]}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                updated_fields.append('status')
                for transaction in transactions:
                    transaction.status = status_value
                    # No longer update is_reconciled flag (deprecated)
                    transaction.save()
                    updated_count += 1

            if not updated_fields:
                return Response(
                    {"detail": "No fields to update were provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update account balances for all affected accounts
            affected_accounts = set()
            for transaction in transactions:
                if transaction.debit:
                    affected_accounts.add(transaction.debit)
                if transaction.credit:
                    affected_accounts.add(transaction.credit)

            for account in affected_accounts:
                account.update_balance()

            return Response({
                "detail": f"Successfully updated {updated_count} transactions",
                "updated_fields": updated_fields,
                "transaction_count": len(transactions)
            })

        except Exception as e:
            print(f"Error in bulk update: {str(e)}")
            return Response(
                {"detail": f"Error processing bulk update: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def upload_csv(self, request):
        """
        Upload and process a CSV file of transactions.

        Expected request data:
        - file_content: The CSV file content as a string
        - column_mapping: Mapping of CSV columns to transaction fields
            e.g. {'date': 0, 'description': 1, 'amount': 2, 'category': 3}
        - selected_account_id: The ID of the account to associate transactions with
        """
        from .tasks import process_csv_transactions

        # Get request data
        file_content = request.data.get('file_content')
        column_mapping = request.data.get('column_mapping')
        selected_account_id = request.data.get('selected_account_id')

        # Validate required fields
        if not file_content:
            return Response(
                {"detail": "File content is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not column_mapping:
            return Response(
                {"detail": "Column mapping is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not selected_account_id:
            return Response(
                {"detail": "Selected account ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate that the account exists and belongs to the user
        try:
            account = Account.objects.get(id=selected_account_id, user=request.user)
        except Account.DoesNotExist:
            return Response(
                {"detail": "Selected account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Process the CSV file
        # Note: We're calling the function directly instead of as a Celery task
        # This is because we want to get the result immediately
        result = process_csv_transactions(
            file_content=file_content,
            column_mapping=column_mapping,
            selected_account_id=selected_account_id,
            user_id=request.user.id
        )

        # Add debug logging
        print(f"CSV processing result: {result}")

        # Return the result
        return Response(result)
