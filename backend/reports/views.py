from rest_framework import views, permissions, status
from rest_framework.response import Response
from datetime import datetime
from django.db.models import Q, Sum
from django.contrib.auth import get_user_model
from accounts.models import Account, Transaction, AccountTypes, Saving
from decimal import Decimal

User = get_user_model()

class FlowReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get flow report data for a specific date range.

        Query parameters:
        - start_date: The start date of the report period (format: YYYY-MM-DD)
        - end_date: The end date of the report period (format: YYYY-MM-DD)
        """
        try:
            # Get the date range parameters
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')

            if not start_date_str or not end_date_str:
                return Response(
                    {"detail": "start_date and end_date parameters are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse the dates
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Expected YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get all income and expense accounts for the user
            accounts = Account.objects.filter(
                user=request.user,
                type__in=[AccountTypes.income, AccountTypes.expense]
            )

            # Calculate flow for each account
            flow_data = []
            for account in accounts:
                # Get all transactions for this account in the date range
                transactions = Transaction.objects.filter(
                    Q(debit=account) | Q(credit=account),
                    date__gte=start_date,
                    date__lte=end_date,
                    user=request.user
                )

                # Calculate the flow
                debit_sum = transactions.filter(debit=account).aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')

                credit_sum = transactions.filter(credit=account).aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')

                # Calculate flow based on account type
                if account.type == AccountTypes.income:
                    # For income accounts: credits are positive, debits are negative
                    flow = credit_sum - debit_sum
                elif account.type == AccountTypes.expense:
                    # For expense accounts: debits are positive, credits are negative
                    flow = debit_sum - credit_sum
                else:
                    flow = Decimal('0.00')

                flow_data.append({
                    'account_id': account.id,
                    'account_name': account.name,
                    'account_type': account.type,
                    'sub_type': account.sub_type.sub_type if account.sub_type else 'Other',
                    'flow': flow
                })

            return Response(flow_data)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SavingGoalsReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get saving goals report data.

        Query parameters:
        - as_of_date: The date to calculate balances up to (format: YYYY-MM-DD)
        """
        try:
            # Get the as_of_date parameter
            as_of_date_str = request.query_params.get('as_of_date')
            if not as_of_date_str:
                # Default to today
                as_of_date = datetime.now().date()
            else:
                # Parse the date
                try:
                    as_of_date = datetime.strptime(as_of_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {"detail": "Invalid date format. Expected YYYY-MM-DD"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Get all asset and liability accounts for the user
            asset_liability_accounts = Account.objects.filter(
                user=request.user,
                type__in=[AccountTypes.asset, AccountTypes.liability]
            )

            # Calculate net worth
            net_worth = Decimal('0.00')
            account_data = []

            for account in asset_liability_accounts:
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
                if account.type == AccountTypes.asset:
                    # For asset accounts: debits are positive, credits are negative
                    balance = debit_sum - credit_sum
                    net_worth += balance
                elif account.type == AccountTypes.liability:
                    # For liability accounts: credits are positive, debits are negative
                    balance = credit_sum - debit_sum
                    net_worth -= balance
                else:
                    balance = Decimal('0.00')

                account_data.append({
                    'id': account.id,
                    'name': account.name,
                    'type': account.type,
                    'icon': account.icon,
                    'balance': balance
                })

            # Get all saving goals for the user
            savings = Saving.objects.filter(user=request.user)

            # Calculate total allocated amount (sum of current balances, not targets)
            total_allocated = sum(saving.balance for saving in savings)

            # Calculate left to allocate
            left_to_allocate = net_worth - total_allocated

            # Prepare saving goals data
            saving_goals_data = []
            for saving in savings:
                contributing_accounts = []
                for account in saving.contributing_accounts.all():
                    contributing_accounts.append({
                        'id': account.id,
                        'name': account.name,
                        'type': account.type,
                        'icon': account.icon
                    })

                saving_goals_data.append({
                    'id': saving.id,
                    'name': saving.account.name,
                    'target': saving.target,
                    'balance': saving.balance,
                    'progress_percentage': saving.progress_percentage,
                    'contributing_accounts': contributing_accounts
                })

            # Prepare response data
            response_data = {
                'net_worth': net_worth,
                'total_allocated': total_allocated,
                'left_to_allocate': left_to_allocate,
                'accounts': account_data,
                'saving_goals': saving_goals_data
            }

            return Response(response_data)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BalanceReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get balance report data as of a specific date.

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

            # Get all asset and liability accounts for the user
            accounts = Account.objects.filter(
                user=request.user,
                type__in=[AccountTypes.asset, AccountTypes.liability]
            )

            # Calculate balance for each account
            balance_data = []
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
                if account.type == AccountTypes.asset:
                    # For asset accounts: debits are positive, credits are negative
                    balance = debit_sum - credit_sum
                elif account.type == AccountTypes.liability:
                    # For liability accounts: credits are positive, debits are negative
                    balance = credit_sum - debit_sum
                else:
                    balance = Decimal('0.00')

                balance_data.append({
                    'account_id': account.id,
                    'account_name': account.name,
                    'account_type': account.type,
                    'sub_type': account.sub_type.sub_type if account.sub_type else 'Other',
                    'balance': balance
                })

            return Response(balance_data)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
