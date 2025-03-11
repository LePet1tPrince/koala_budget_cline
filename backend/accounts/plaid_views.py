from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .plaid_models import PlaidItem, PlaidTransaction
from .plaid_serializers import PlaidItemSerializer, PlaidTransactionSerializer
from .models import Account, Transaction, TransactionStatus
from .permissions import IsOwner
from .plaid_client import (
    create_link_token,
    exchange_public_token,
    get_transactions,
    get_institution,
    get_accounts
)

class PlaidViewSet(viewsets.ViewSet):
    """
    ViewSet for Plaid API interactions.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    @action(detail=False, methods=['post'])
    def create_link_token(self, request):
        """
        Create a Plaid Link token for initializing the Plaid Link flow.
        """
        try:
            # Get the account ID from the request
            account_id = request.data.get('account_id')
            if not account_id:
                return Response(
                    {"detail": "Account ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the account exists and belongs to the user
            try:
                account = Account.objects.get(id=account_id, user=request.user)
            except Account.DoesNotExist:
                return Response(
                    {"detail": "Account not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create a link token
            link_token = create_link_token(request.user.id, account_id)

            return Response({"link_token": link_token})
        except Exception as e:
            return Response(
                {"detail": f"Error creating link token: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def exchange_public_token(self, request):
        """
        Exchange a public token for an access token and store the Plaid Item.
        """
        try:
            # Get the public token and account ID from the request
            public_token = request.data.get('public_token')
            account_id = request.data.get('account_id')
            institution_id = request.data.get('institution_id')

            if not public_token or not account_id:
                return Response(
                    {"detail": "Public token and account ID are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the account exists and belongs to the user
            try:
                account = Account.objects.get(id=account_id, user=request.user)
            except Account.DoesNotExist:
                return Response(
                    {"detail": "Account not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Exchange the public token for an access token
            access_token, item_id = exchange_public_token(public_token)

            # Get institution information
            institution_name = "Financial Institution"
            if institution_id:
                try:
                    institution = get_institution(institution_id)
                    institution_name = institution.name
                except Exception as e:
                    # Log the error but continue
                    print(f"Error getting institution info: {str(e)}")

            # Create or update the Plaid Item
            plaid_item, created = PlaidItem.objects.update_or_create(
                user=request.user,
                account=account,
                defaults={
                    'item_id': item_id,
                    'access_token': access_token,
                    'institution_name': institution_name,
                    'status': 'active'
                }
            )

            # Mark the account as a bank feed account
            account.inBankFeed = True
            account.save()

            # Return the Plaid Item with the access token
            serializer = PlaidItemSerializer(plaid_item)
            response_data = serializer.data
            # Include the access token in the response (only for this endpoint)
            response_data['access_token'] = access_token
            return Response(response_data)
        except Exception as e:
            return Response(
                {"detail": f"Error exchanging public token: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def get_plaid_accounts(self, request):
        """
        Get accounts for a Plaid access token.
        """
        try:
            # Get the access token from the request
            access_token = request.data.get('access_token')
            if not access_token:
                return Response(
                    {"detail": "Access token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get accounts from Plaid
            plaid_accounts = get_accounts(access_token)

            # Convert Plaid account objects to dictionaries
            serializable_accounts = []
            for account in plaid_accounts:
                try:
                    # Extract relevant fields from the account object
                    account_dict = {
                        'account_id': str(getattr(account, 'account_id', '')),
                        'name': str(getattr(account, 'name', '')),
                        'mask': str(getattr(account, 'mask', '')),
                        'type': str(getattr(account, 'type', '')),  # Convert AccountType to string
                        'subtype': str(getattr(account, 'subtype', '')) if getattr(account, 'subtype', None) else None,  # Convert subtype to string
                    }

                    # Handle balances separately to avoid nested attribute errors
                    balances = getattr(account, 'balances', None)
                    if balances:
                        account_dict['balances'] = {
                            'available': float(getattr(balances, 'available', 0)) if getattr(balances, 'available', None) is not None else None,
                            'current': float(getattr(balances, 'current', 0)) if getattr(balances, 'current', None) is not None else None,
                            'limit': float(getattr(balances, 'limit', 0)) if getattr(balances, 'limit', None) is not None else None,
                            'iso_currency_code': str(getattr(balances, 'iso_currency_code', '')) if getattr(balances, 'iso_currency_code', None) else None,
                            'unofficial_currency_code': str(getattr(balances, 'unofficial_currency_code', '')) if getattr(balances, 'unofficial_currency_code', None) else None
                        }
                    else:
                        account_dict['balances'] = {
                            'available': None,
                            'current': None,
                            'limit': None,
                            'iso_currency_code': None,
                            'unofficial_currency_code': None
                        }

                    serializable_accounts.append(account_dict)
                except Exception as e:
                    # Log the error but continue with other accounts
                    print(f"Error serializing account: {str(e)}")
                    continue

            # Return the serializable accounts
            return Response({
                "accounts": serializable_accounts
            })
        except Exception as e:
            return Response(
                {"detail": f"Error getting Plaid accounts: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def map_accounts(self, request):
        """
        Map app accounts to Plaid accounts.
        """
        try:
            # Get the data from the request
            access_token = request.data.get('access_token')
            item_id = request.data.get('item_id')
            institution_name = request.data.get('institution_name')
            account_mapping = request.data.get('account_mapping')

            # Log the received data for debugging
            print(f"Received map_accounts request: access_token={access_token}, item_id={item_id}, institution_name={institution_name}")
            print(f"Account mapping: {account_mapping}")

            if not access_token or not item_id or not account_mapping:
                return Response(
                    {"detail": "Access token, item ID, and account mapping are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate account_mapping is a dictionary
            if not isinstance(account_mapping, dict):
                return Response(
                    {"detail": f"Account mapping must be a dictionary, got {type(account_mapping).__name__}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create PlaidItem entries for each mapping
            created_items = []
            # Note: In the frontend, the mapping is:
            # { plaid_account_id: app_account_id }
            for plaid_account_id, app_account_id in account_mapping.items():
                try:
                    # Convert app_account_id to integer if it's a string
                    try:
                        app_account_id_int = int(app_account_id)
                    except (ValueError, TypeError):
                        return Response(
                            {"detail": f"Invalid app account ID format: {app_account_id}. Must be an integer."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Verify the account exists and belongs to the user
                    try:
                        account = Account.objects.get(id=app_account_id_int, user=request.user)
                    except Account.DoesNotExist:
                        return Response(
                            {"detail": f"App account {app_account_id} not found or does not belong to the user"},
                            status=status.HTTP_404_NOT_FOUND
                        )

                    # Validate plaid_account_id is a string and not empty
                    if not plaid_account_id or not isinstance(plaid_account_id, str):
                        return Response(
                            {"detail": f"Invalid Plaid account ID: {plaid_account_id}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Create or update the PlaidItem
                    plaid_item, created = PlaidItem.objects.update_or_create(
                        user=request.user,
                        account=account,
                        defaults={
                            'item_id': item_id,
                            'access_token': access_token,
                            'plaid_account_id': plaid_account_id,
                            'institution_name': institution_name,
                            'status': 'active'
                        }
                    )

                    # Mark the account as a bank feed account
                    account.inBankFeed = True
                    account.save()

                    created_items.append(plaid_item.id)
                except Exception as e:
                    # Log the specific error for this mapping
                    print(f"Error mapping account {app_account_id} to Plaid account {plaid_account_id}: {str(e)}")
                    return Response(
                        {"detail": f"Error mapping account {app_account_id}: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # Return success response
            return Response({
                "status": "success",
                "mapped_accounts": len(created_items),
                "plaid_item_ids": created_items
            })
        except Exception as e:
            # Log the full error
            import traceback
            print(f"Error in map_accounts: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"Error mapping accounts: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def sync_transactions(self, request):
        """
        Sync transactions for a Plaid Item.
        """
        try:
            # Get the Plaid Item ID from the request
            plaid_item_id = request.data.get('plaid_item_id')

            # Log the request for debugging
            print(f"Received sync_transactions request: plaid_item_id={plaid_item_id}")

            if not plaid_item_id:
                return Response(
                    {"detail": "Plaid Item ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the Plaid Item
            try:
                plaid_item = PlaidItem.objects.get(id=plaid_item_id, user=request.user)
                print(f"Found Plaid Item: id={plaid_item.id}, access_token={plaid_item.access_token[:5]}..., plaid_account_id={plaid_item.plaid_account_id}")
            except PlaidItem.DoesNotExist:
                return Response(
                    {"detail": "Plaid Item not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Sync transactions
            result = self._sync_transactions_for_item(plaid_item)

            return Response(result)
        except Exception as e:
            # Log the full error
            import traceback
            print(f"Error in sync_transactions: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"Error syncing transactions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _sync_transactions_for_item(self, plaid_item):
        """
        Sync transactions for a Plaid Item.

        Args:
            plaid_item: The PlaidItem object

        Returns:
            A dictionary with the sync results
        """
        # Initialize result
        result = {
            'added': 0,
            'modified': 0,
            'removed': 0,
            'errors': []
        }

        try:
            # Get the cursor from the last sync
            cursor = plaid_item.cursor

            # Log the sync attempt
            print(f"Syncing transactions for Plaid Item {plaid_item.id} with access_token={plaid_item.access_token[:5]}...")

            # Get transactions from Plaid
            try:
                plaid_transactions, next_cursor, has_more = get_transactions(
                    plaid_item.access_token,
                    cursor=cursor
                )
                print(f"Retrieved {len(plaid_transactions)} transactions from Plaid")

                # Log the first transaction for debugging
                if plaid_transactions:
                    first_txn = plaid_transactions[0]
                    print(f"First transaction: {str(first_txn)[:100]}...")
                    print(f"Transaction attributes: {dir(first_txn)[:100]}...")
            except Exception as e:
                import traceback
                print(f"Error getting transactions from Plaid: {str(e)}")
                print(traceback.format_exc())
                raise e

            # Process transactions
            with transaction.atomic():
                for idx, plaid_txn in enumerate(plaid_transactions):
                    try:
                        # Get transaction ID safely
                        txn_id = getattr(plaid_txn, 'transaction_id', f"unknown-{idx}")
                        print(f"Processing transaction {txn_id}")

                        # Skip transactions that don't match the Plaid account ID if specified
                        account_id = getattr(plaid_txn, 'account_id', None)
                        if plaid_item.plaid_account_id and account_id != plaid_item.plaid_account_id:
                            print(f"Skipping transaction {txn_id} - account ID mismatch: {account_id} != {plaid_item.plaid_account_id}")
                            continue

                        # Check if we've already imported this transaction
                        try:
                            existing = PlaidTransaction.objects.filter(
                                plaid_transaction_id=txn_id
                            ).first()
                        except Exception as e:
                            print(f"Error checking for existing transaction {txn_id}: {str(e)}")
                            result['errors'].append(f"Error checking for existing transaction {txn_id}: {str(e)}")
                            continue

                        if existing:
                            # Update existing transaction
                            try:
                                self._update_transaction(existing.transaction, plaid_txn, plaid_item)
                                result['modified'] += 1
                                print(f"Updated transaction {txn_id}")
                            except Exception as e:
                                print(f"Error updating transaction {txn_id}: {str(e)}")
                                result['errors'].append(f"Error updating transaction {txn_id}: {str(e)}")
                        else:
                            # Create new transaction
                            try:
                                new_txn = self._create_transaction(plaid_txn, plaid_item)
                                if new_txn:
                                    result['added'] += 1
                                    print(f"Created new transaction {txn_id}")
                            except Exception as e:
                                print(f"Error creating transaction {txn_id}: {str(e)}")
                                result['errors'].append(f"Error creating transaction {txn_id}: {str(e)}")
                    except Exception as e:
                        print(f"Error processing transaction: {str(e)}")
                        result['errors'].append(f"Error processing transaction: {str(e)}")

            # Update the Plaid Item with the new cursor and sync time
            plaid_item.last_sync = timezone.now()
            plaid_item.cursor = next_cursor  # Store the cursor for future syncs
            plaid_item.save()
            print(f"Sync completed for Plaid Item {plaid_item.id}: added={result['added']}, modified={result['modified']}, errors={len(result['errors'])}")
            print(f"Saved cursor for future syncs: {next_cursor[:30]}..." if next_cursor else "No cursor to save")

            return result
        except Exception as e:
            # Update the Plaid Item status
            plaid_item.status = 'error'
            plaid_item.error_message = str(e)
            plaid_item.save()

            import traceback
            print(f"Error in _sync_transactions_for_item: {str(e)}")
            print(traceback.format_exc())

            raise e

    def _create_transaction(self, plaid_txn, plaid_item):
        """
        Create a transaction from a Plaid transaction.

        Args:
            plaid_txn: The Plaid transaction
            plaid_item: The PlaidItem object

        Returns:
            The created Transaction object
        """
        try:
            # Get transaction ID for logging
            txn_id = getattr(plaid_txn, 'transaction_id', 'unknown')
            print(f"Creating transaction {txn_id}")

            # Get the account
            account = plaid_item.account

            # Get transaction date
            try:
                # Try to get the date as a string first
                date_str = getattr(plaid_txn, 'date', None)
                if date_str:
                    # Convert string to date if needed
                    if isinstance(date_str, str):
                        from datetime import datetime
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    else:
                        # Assume it's already a date object
                        date_obj = date_str
                else:
                    date_obj = timezone.now().date()

                print(f"Transaction date: {date_obj}")
            except Exception as e:
                print(f"Error parsing date for transaction {txn_id}: {str(e)}")
                date_obj = timezone.now().date()
                print(f"Using current date instead: {date_obj}")

            # Get transaction amount
            try:
                amount_str = str(getattr(plaid_txn, 'amount', 0))
                amount = Decimal(amount_str)
                is_debit = amount > 0  # In Plaid, positive amounts are debits (money leaving the account)
                print(f"Transaction amount: {amount}, is_debit: {is_debit}")
            except Exception as e:
                print(f"Error parsing amount for transaction {txn_id}: {str(e)}")
                amount = Decimal('0')
                is_debit = True
                print(f"Using default amount: {amount}")

            # Get transaction name/description
            try:
                notes = str(getattr(plaid_txn, 'name', ''))
                if not notes:
                    notes = str(getattr(plaid_txn, 'merchant_name', ''))
                if not notes:
                    notes = f"Plaid transaction {txn_id}"
                print(f"Transaction notes: {notes}")
            except Exception as e:
                print(f"Error getting notes for transaction {txn_id}: {str(e)}")
                notes = f"Plaid transaction {txn_id}"
                print(f"Using default notes: {notes}")

            # Find or create a category account
            try:
                from .tasks import find_or_create_category_account
                category = getattr(plaid_txn, 'category', None)
                print(f"Transaction category: {category}")

                # Handle different category formats
                if isinstance(category, list) and len(category) > 0:
                    category_name = category[-1]
                elif isinstance(category, str):
                    category_name = category
                else:
                    category_name = None

                print(f"Using category name: {category_name}")

                category_account = find_or_create_category_account(
                    plaid_item.user,
                    category_name,
                    not is_debit  # Invert for our system
                )
                print(f"Category account: {category_account.name} (ID: {category_account.id})")
            except Exception as e:
                print(f"Error finding category account for transaction {txn_id}: {str(e)}")
                # Use a default category account
                from .tasks import find_or_create_category_account
                category_account = find_or_create_category_account(
                    plaid_item.user,
                    None,  # No category name, will use default
                    not is_debit
                )
                print(f"Using default category account: {category_account.name} (ID: {category_account.id})")

            # Create the transaction
            if is_debit:
                # Money leaving the account
                debit_account = category_account
                credit_account = account
            else:
                # Money entering the account
                debit_account = account
                credit_account = category_account

            # Create the transaction
            transaction = Transaction.objects.create(
                date=date_obj,
                amount=abs(amount),
                debit=debit_account,
                credit=credit_account,
                notes=notes,
                status=TransactionStatus.REVIEW,
                user=plaid_item.user
            )
            print(f"Created transaction: ID={transaction.id}, date={transaction.date}, amount={transaction.amount}")

            # Create the PlaidTransaction link
            plaid_transaction = PlaidTransaction.objects.create(
                plaid_item=plaid_item,
                transaction=transaction,
                plaid_transaction_id=txn_id
            )
            print(f"Created PlaidTransaction link: ID={plaid_transaction.id}, plaid_transaction_id={plaid_transaction.plaid_transaction_id}")

            return transaction
        except Exception as e:
            import traceback
            print(f"Error in _create_transaction: {str(e)}")
            print(traceback.format_exc())
            raise e

    def _update_transaction(self, transaction, plaid_txn, plaid_item):
        """
        Update a transaction from a Plaid transaction.

        Args:
            transaction: The Transaction object to update
            plaid_txn: The Plaid transaction
            plaid_item: The PlaidItem object

        Returns:
            The updated Transaction object
        """
        try:
            # Get transaction ID for logging
            txn_id = getattr(plaid_txn, 'transaction_id', 'unknown')
            print(f"Updating transaction {txn_id} (DB ID: {transaction.id})")

            # Only update if the transaction is still in REVIEW status
            if transaction.status == TransactionStatus.REVIEW:
                # Get transaction date
                try:
                    # Try to get the date as a string first
                    date_str = getattr(plaid_txn, 'date', None)
                    if date_str:
                        # Convert string to date if needed
                        if isinstance(date_str, str):
                            from datetime import datetime
                            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        else:
                            # Assume it's already a date object
                            date_obj = date_str

                        transaction.date = date_obj
                        print(f"Updated transaction date to: {date_obj}")
                except Exception as e:
                    print(f"Error updating date for transaction {txn_id}: {str(e)}")
                    # Keep the existing date

                # Get transaction amount
                try:
                    amount_str = str(getattr(plaid_txn, 'amount', 0))
                    amount = abs(Decimal(amount_str))
                    transaction.amount = amount
                    print(f"Updated transaction amount to: {amount}")
                except Exception as e:
                    print(f"Error updating amount for transaction {txn_id}: {str(e)}")
                    # Keep the existing amount

                # Get transaction name/description
                try:
                    notes = str(getattr(plaid_txn, 'name', ''))
                    if notes:
                        transaction.notes = notes
                        print(f"Updated transaction notes to: {notes}")
                except Exception as e:
                    print(f"Error updating notes for transaction {txn_id}: {str(e)}")
                    # Keep the existing notes

                # Save the transaction
                transaction.save()
                print(f"Transaction {transaction.id} updated successfully")
            else:
                print(f"Transaction {transaction.id} not updated - status is not REVIEW")

            return transaction
        except Exception as e:
            import traceback
            print(f"Error in _update_transaction: {str(e)}")
            print(traceback.format_exc())
            raise e

class PlaidItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PlaidItem model.
    """
    serializer_class = PlaidItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return PlaidItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """
        Disconnect a Plaid Item.
        """
        plaid_item = self.get_object()

        # Update the Plaid Item status
        plaid_item.status = 'disconnected'
        plaid_item.save()

        # Update the account
        account = plaid_item.account
        account.inBankFeed = False
        account.save()

        return Response({"status": "disconnected"})
