from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

from .models import PlaidItem

logger = logging.getLogger(__name__)

@shared_task
def sync_all_plaid_accounts():
    """
    Sync transactions for all active Plaid connections.
    This task is scheduled to run daily.
    """
    logger.info("Starting daily Plaid transaction sync")

    # Get all active Plaid connections
    plaid_items = PlaidItem.objects.filter(status='active')
    logger.info(f"Found {plaid_items.count()} active Plaid connections")

    results = {
        'total': plaid_items.count(),
        'success': 0,
        'error': 0,
        'transactions_added': 0,
        'transactions_modified': 0,
        'errors': []
    }

    # Import here to avoid circular imports
    from .views import PlaidViewSet
    plaid_viewset = PlaidViewSet()

    # Sync transactions for each connection
    for plaid_item in plaid_items:
        try:
            logger.info(f"Syncing transactions for Plaid Item {plaid_item.id} ({plaid_item.institution_name})")

            # Sync transactions
            sync_result = plaid_viewset._sync_transactions_for_item(plaid_item)

            # Update results
            results['success'] += 1
            results['transactions_added'] += sync_result.get('added', 0)
            results['transactions_modified'] += sync_result.get('modified', 0)

            # Handle errors
            if sync_result.get('errors', []):
                for error in sync_result['errors']:
                    results['errors'].append(f"Plaid Item {plaid_item.id}: {error}")

            logger.info(f"Successfully synced transactions for Plaid Item {plaid_item.id}")
        except Exception as e:
            logger.error(f"Error syncing transactions for Plaid Item {plaid_item.id}: {str(e)}")
            results['error'] += 1
            results['errors'].append(f"Plaid Item {plaid_item.id}: {str(e)}")

            # Update the Plaid Item status
            plaid_item.status = 'error'
            plaid_item.error_message = str(e)
            plaid_item.save()

    logger.info(f"Completed daily Plaid transaction sync: {results}")
    return results

@shared_task
def check_plaid_errors():
    """
    Check for Plaid connections with errors and notify users.
    This task is scheduled to run daily.
    """
    logger.info("Checking for Plaid connections with errors")

    # Get all Plaid connections with errors
    error_items = PlaidItem.objects.filter(status='error')
    logger.info(f"Found {error_items.count()} Plaid connections with errors")

    # TODO: Implement notification logic
    # For now, just log the errors
    for item in error_items:
        logger.warning(f"Plaid Item {item.id} ({item.institution_name}) has error: {item.error_message}")

    return {
        'error_count': error_items.count()
    }

@shared_task
def retry_plaid_errors():
    """
    Retry Plaid connections with errors.
    This task is scheduled to run daily.
    """
    logger.info("Retrying Plaid connections with errors")

    # Get all Plaid connections with errors
    error_items = PlaidItem.objects.filter(status='error')
    logger.info(f"Found {error_items.count()} Plaid connections with errors")

    results = {
        'total': error_items.count(),
        'success': 0,
        'still_error': 0
    }

    # Import here to avoid circular imports
    from .views import PlaidViewSet
    plaid_viewset = PlaidViewSet()

    # Retry each connection
    for plaid_item in error_items:
        try:
            logger.info(f"Retrying Plaid Item {plaid_item.id} ({plaid_item.institution_name})")

            # Reset the error status
            plaid_item.status = 'active'
            plaid_item.error_message = None
            plaid_item.save()

            # Sync transactions
            plaid_viewset._sync_transactions_for_item(plaid_item)

            # Update results
            results['success'] += 1
            logger.info(f"Successfully retried Plaid Item {plaid_item.id}")
        except Exception as e:
            logger.error(f"Error retrying Plaid Item {plaid_item.id}: {str(e)}")
            results['still_error'] += 1

            # Update the Plaid Item status
            plaid_item.status = 'error'
            plaid_item.error_message = str(e)
            plaid_item.save()

    logger.info(f"Completed retry of Plaid connections with errors: {results}")
    return results
