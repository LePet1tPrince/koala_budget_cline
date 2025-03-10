import csv
import io
from decimal import Decimal
from datetime import datetime
from celery import shared_task
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Account, Transaction

User = get_user_model()

def parse_date(date_str):
    """Parse a date string using multiple formats."""
    date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y']

    for date_format in date_formats:
        try:
            return datetime.strptime(date_str, date_format).date()
        except ValueError:
            continue

    return None

def find_or_create_category_account(user, category, is_positive):
    """Find or create a category account based on the transaction type."""
    # If category is not provided, use a default expense or income account
    if not category:
        if is_positive:
            # For positive amounts, use a default income account
            category_account = Account.objects.filter(
                user=user,
                type='Income'
            ).first()

            if not category_account:
                # Create a default income account if none exists
                category_account = Account.objects.create(
                    name='Uncategorized Income',
                    num=90000,  # Use a high number to avoid conflicts
                    type='Income',
                    user=user
                )
        else:
            # For negative amounts, use a default expense account
            category_account = Account.objects.filter(
                user=user,
                type='Expense'
            ).first()

            if not category_account:
                # Create a default expense account if none exists
                category_account = Account.objects.create(
                    name='Uncategorized Expense',
                    num=80000,  # Use a high number to avoid conflicts
                    type='Expense',
                    user=user
                )
    else:
        # Try to find an account with a matching name
        category_account = Account.objects.filter(
            user=user,
            name__iexact=category
        ).first()

        if not category_account:
            # Create a new account based on the category
            # Determine account type based on amount direction
            account_type = 'Income' if is_positive else 'Expense'

            # Find the highest account number and increment
            highest_num = Account.objects.filter(user=user).order_by('-num').first()
            new_num = (highest_num.num + 1) if highest_num else 1000

            category_account = Account.objects.create(
                name=category,
                num=new_num,
                type=account_type,
                user=user
            )

    return category_account

@shared_task
def process_csv_transactions(file_content, column_mapping, selected_account_id, user_id):
    """
    Process a CSV file and create transactions.

    Args:
        file_content (str): The CSV file content as a string
        column_mapping (dict): Mapping of CSV columns to transaction fields
            e.g. {'date': 0, 'description': 1, 'amount': 2, 'category': 3}
        selected_account_id (int): The ID of the account to associate transactions with
        user_id (int): The ID of the user who uploaded the file

    Returns:
        dict: A dictionary containing the results of the operation
    """
    # Track results
    results = {
        'status': 'processing',
        'total': 0,
        'success': 0,
        'failed': 0,
        'errors': []
    }

    # Debug logging
    print(f"Starting CSV processing with: column_mapping={column_mapping}, selected_account_id={selected_account_id}")

    try:
        # Get the user and selected account
        user = User.objects.get(id=user_id)
        selected_account = Account.objects.get(id=selected_account_id, user=user)

        # Parse the CSV file
        csv_file = io.StringIO(file_content)
        reader = csv.reader(csv_file)

        # Skip header row if it exists
        if column_mapping.get('has_header', True):
            next(reader)

        # Process each row
        for row_index, row in enumerate(reader, start=1):
            # Skip empty rows
            if not any(row):
                continue

            results['total'] += 1

            # Extract data from the row based on column mapping
            try:
                date_str = row[column_mapping['date']] if 'date' in column_mapping else None
                description = row[column_mapping['description']] if 'description' in column_mapping else None
                amount_str = row[column_mapping['amount']] if 'amount' in column_mapping else None
                category = row[column_mapping['category']] if 'category' in column_mapping else None
            except IndexError:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Column index out of range. Check your column mapping.")
                continue

            # Validate required fields
            if not date_str or not amount_str:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Missing required fields")
                continue

            # Parse date
            parsed_date = parse_date(date_str)
            if parsed_date is None:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Invalid date format '{date_str}'")
                continue

            # Parse amount
            try:
                # Remove currency symbols and commas
                cleaned_amount = amount_str.replace('$', '').replace(',', '').strip()
                amount = Decimal(cleaned_amount)

                # Determine if this is a debit or credit
                is_positive = amount > 0
                amount = abs(amount)  # Use absolute value for the transaction
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Error parsing amount - {str(e)}")
                continue

            # Find or create the category account
            try:
                category_account = find_or_create_category_account(user, category, is_positive)
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Error processing category - {str(e)}")
                continue

            # Create the transaction
            try:
                # For positive amounts (income):
                # - Debit the selected account (money coming in)
                # - Credit the category account (source of the money)
                #
                # For negative amounts (expense):
                # - Debit the category account (where money is going)
                # - Credit the selected account (money going out)
                if is_positive:
                    debit_account = selected_account
                    credit_account = category_account
                else:
                    debit_account = category_account
                    credit_account = selected_account

                # Create the transaction using atomic transaction
                with transaction.atomic():
                    Transaction.objects.create(
                        date=parsed_date,
                        amount=amount,
                        debit=debit_account,
                        credit=credit_account,
                        notes=description or '',
                        user=user
                    )

                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Row {row_index}: Error creating transaction - {str(e)}")
                continue

        # Update status to completed
        results['status'] = 'completed'
        return results

    except Exception as e:
        # Update status to failed
        results['status'] = 'failed'
        results['error'] = str(e)
        return results
