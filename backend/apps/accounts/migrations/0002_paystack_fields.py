from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="stripe_customer_id",
        ),
        migrations.AddField(
            model_name="user",
            name="paystack_customer_code",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="user",
            name="paystack_subscription_code",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="user",
            name="paystack_email_token",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
