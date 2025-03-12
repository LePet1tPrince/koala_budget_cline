import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure Celery Beat schedule
app.conf.beat_schedule = {
    'sync-plaid-transactions-daily': {
        'task': 'plaid_integration.tasks.sync_all_plaid_accounts',
        'schedule': crontab(hour=1, minute=0),  # Run at 1:00 AM every day
        'args': (),
    },
    'check-plaid-errors-daily': {
        'task': 'plaid_integration.tasks.check_plaid_errors',
        'schedule': crontab(hour=2, minute=0),  # Run at 2:00 AM every day
        'args': (),
    },
    'retry-plaid-errors-daily': {
        'task': 'plaid_integration.tasks.retry_plaid_errors',
        'schedule': crontab(hour=3, minute=0),  # Run at 3:00 AM every day
        'args': (),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
