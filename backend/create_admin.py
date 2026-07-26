import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_system.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

if not User.objects.filter(username='admin').exists():
    user = User.objects.create_superuser('admin', 'fa8675215@gmail.com', 'admin123')
    UserProfile.objects.update_or_create(user=user, defaults={'role': 'ADMINISTRADOR'})
    print("Default admin user created successfully.")
else:
    print("Admin user already exists. Skipping creation.")
