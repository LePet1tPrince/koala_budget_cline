import os
import sys
# Add the plaid-python package to the import path explicitly
import plaid as plaid_package
from plaid_package.api import plaid_api
from plaid_package.model.country_code import CountryCode
from plaid_package.model.products import Products
from plaid_package.model.link_token_create_request import LinkTokenCreateRequest
from plaid_package.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid_package.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid_package.model.transactions_sync_request import TransactionsSyncRequest
from datetime import datetime, timedelta
from django.conf import settings

# Plaid API configuration
PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID', '')
PLAID_SECRET = os.getenv('PLAID_SECRET', '')
PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')  # sandbox, development, or production

# Configure Plaid client
def get_plaid_client():
    """
    Initialize and return a Plaid API client.
    """
    if not PLAID_CLIENT_ID or not PLAID_SECRET:
        raise ValueError("Plaid API credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.")

    # Configure API environment
    if PLAID_ENV == 'sandbox':
        host = plaid_package.Environment.Sandbox
    elif PLAID_ENV == 'development':
        host = plaid_package.Environment.Development
    elif PLAID_ENV == 'production':
        host = plaid_package.Environment.Production
    else:
        raise ValueError(f"Invalid PLAID_ENV value: {PLAID_ENV}. Must be 'sandbox', 'development', or 'production'.")

    # Configure and return client
    configuration = plaid_package.Configuration(
        host=host,
        api_key={
            'clientId': PLAID_CLIENT_ID,
            'secret': PLAID_SECRET,
        }
    )
    api_client = plaid_package.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)

def create_link_token(user_id, account_id=None):
    """
    Create a Plaid Link token for initializing the Plaid Link flow.

    Args:
        user_id: The ID of the user in the system
        account_id: Optional account ID for update mode

    Returns:
        The link token string
    """
    client = get_plaid_client()

    # Create a Link token for the given user
    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(
            client_user_id=str(user_id)
        ),
        client_name="Koala Budget",
        products=[Products("transactions")],
        country_codes=[CountryCode("US"), CountryCode("CA")],
        language="en",
        webhook="https://webhook.example.com",  # Replace with your webhook URL
    )

    response = client.link_token_create(request)
    return response['link_token']

def exchange_public_token(public_token):
    """
    Exchange a public token for an access token.

    Args:
        public_token: The public token received from Plaid Link

    Returns:
        A tuple of (access_token, item_id)
    """
    client = get_plaid_client()

    request = ItemPublicTokenExchangeRequest(
        public_token=public_token
    )
    response = client.item_public_token_exchange(request)

    return response['access_token'], response['item_id']

def get_transactions(access_token, cursor=None, start_date=None, end_date=None):
    """
    Get transactions for a Plaid Item.

    Args:
        access_token: The access token for the Plaid Item
        cursor: Optional cursor for pagination
        start_date: Optional start date for transactions
        end_date: Optional end date for transactions

    Returns:
        A tuple of (transactions, cursor, has_more)
    """
    client = get_plaid_client()

    # Set default date range if not provided
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.now().date()

    # Create request - only include cursor if it's not None
    if cursor is not None:
        request = TransactionsSyncRequest(
            access_token=access_token,
            cursor=cursor
        )
    else:
        request = TransactionsSyncRequest(
            access_token=access_token
        )

    response = client.transactions_sync(request)

    return (
        response['added'] + response['modified'],
        response['next_cursor'],
        response['has_more']
    )

def get_institution(institution_id):
    """
    Get information about a financial institution.

    Args:
        institution_id: The Plaid institution ID

    Returns:
        Institution information
    """
    client = get_plaid_client()

    from plaid_package.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
    from plaid_package.model.country_code import CountryCode

    request = InstitutionsGetByIdRequest(
        institution_id=institution_id,
        country_codes=[CountryCode('US'), CountryCode('CA')]
    )

    response = client.institutions_get_by_id(request)
    return response['institution']

def get_accounts(access_token):
    """
    Get accounts for a Plaid Item.

    Args:
        access_token: The access token for the Plaid Item

    Returns:
        List of accounts
    """
    client = get_plaid_client()

    from plaid_package.model.accounts_get_request import AccountsGetRequest

    request = AccountsGetRequest(
        access_token=access_token
    )

    response = client.accounts_get(request)
    return response['accounts']
