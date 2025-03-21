from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_transaction_merchant'),
    ]

    operations = [
        migrations.CreateModel(
            name='Merchant',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('user', models.ForeignKey(on_delete=models.CASCADE, related_name='merchants', to='accounts.user')),
            ],
        ),
        # Store the existing merchant names temporarily
        migrations.RunPython(
            code=lambda apps, schema_editor: None,  # Forward: do nothing
            reverse_code=lambda apps, schema_editor: None,  # Reverse: do nothing
        ),
        # Remove the old merchant field
        migrations.RemoveField(
            model_name='transaction',
            name='merchant',
        ),
        # Add the new merchant field as a ForeignKey
        migrations.AddField(
            model_name='transaction',
            name='merchant',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='transactions', to='accounts.merchant'),
        ),
    ]
