from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_plaiditem_cursor'),
        ('plaid', '0002_copy_data_from_accounts'),
    ]

    operations = [
        migrations.DeleteModel(
            name='PlaidTransaction',
        ),
        migrations.DeleteModel(
            name='PlaidItem',
        ),
    ]
