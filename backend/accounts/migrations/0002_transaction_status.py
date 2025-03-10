# Generated by Django 4.1.13 on 2025-03-10 18:48

from django.db import migrations, models


def populate_status(apps, schema_editor):
    Transaction = apps.get_model('accounts', 'Transaction')
    for transaction in Transaction.objects.all():
        if transaction.is_reconciled:
            transaction.status = 'reconciled'
        else:
            transaction.status = 'review'
        transaction.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='status',
            field=models.CharField(choices=[('review', 'Review'), ('categorized', 'Categorized'), ('reconciled', 'Reconciled')], default='review', max_length=20),
        ),
        migrations.RunPython(populate_status, migrations.RunPython.noop),
    ]
