# Generated manually for Plaid account ID field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_plaid_integration'),
    ]

    operations = [
        migrations.AddField(
            model_name='plaiditem',
            name='plaid_account_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
