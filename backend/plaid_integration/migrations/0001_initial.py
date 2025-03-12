from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0006_plaiditem_cursor'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlaidItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_id', models.CharField(max_length=255)),
                ('access_token', models.CharField(max_length=255)),
                ('plaid_account_id', models.CharField(blank=True, max_length=255, null=True)),
                ('institution_name', models.CharField(blank=True, max_length=255, null=True)),
                ('last_sync', models.DateTimeField(blank=True, null=True)),
                ('cursor', models.CharField(blank=True, max_length=255, null=True)),
                ('status', models.CharField(default='active', max_length=50)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plaid_integration_connection', to='accounts.account')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plaid_integration_items', to='auth.user')),
            ],
            options={
                'unique_together': {('user', 'account')},
            },
        ),
        migrations.CreateModel(
            name='PlaidTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('plaid_transaction_id', models.CharField(max_length=255, unique=True)),
                ('imported_at', models.DateTimeField(auto_now_add=True)),
                ('plaid_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plaid_transactions', to='plaid_integration.plaiditem')),
                ('transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plaid_integration_source', to='accounts.transaction')),
            ],
        ),
    ]
