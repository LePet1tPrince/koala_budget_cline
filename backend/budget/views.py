from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime
from .models import Budget
from .serializers import BudgetSerializer
from accounts.permissions import IsOwner
from accounts.models import Account

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = Budget.objects.filter(user=self.request.user)

        # Filter by month if specified
        month = self.request.query_params.get('month', None)
        if month:
            try:
                # Parse the month parameter (expected format: YYYY-MM-DD)
                month_date = datetime.strptime(month, '%Y-%m-%d').date()
                queryset = queryset.filter(month=month_date)
            except ValueError:
                # If the date format is invalid, return an empty queryset
                return Budget.objects.none()

        # Filter by account if specified
        account_id = self.request.query_params.get('account', None)
        if account_id:
            try:
                account_id = int(account_id)
                queryset = queryset.filter(account_id=account_id)
            except (ValueError, TypeError):
                # If the account_id is invalid, return an empty queryset
                return Budget.objects.none()

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            # Check if a budget already exists for this month and account
            month = request.data.get('month')
            account_id = request.data.get('account')

            if not month or not account_id:
                return Response(
                    {"detail": "Month and account are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # Parse the month parameter (expected format: YYYY-MM-DD)
                month_date = datetime.strptime(month, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Expected YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the account exists and belongs to the user
            try:
                account = Account.objects.get(id=account_id, user=request.user)
            except Account.DoesNotExist:
                return Response(
                    {"detail": "Account not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if a budget already exists for this month and account
            existing_budget = Budget.objects.filter(
                user=request.user,
                month=month_date,
                account=account
            ).first()

            if existing_budget:
                # Update the existing budget
                serializer = self.get_serializer(existing_budget, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)

            # Create a new budget
            return super().create(request, *args, **kwargs)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
