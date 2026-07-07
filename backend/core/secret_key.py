import secrets

# Creates a secret key for the Django project
secret_key = secrets.token_urlsafe(32)
print(secret_key)