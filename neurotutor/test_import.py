import os
import django
import sys
import traceback

# Add project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')

try:
    django.setup()
    print("Django setup success")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("-" * 20)

try:
    from tutor import models
    print("Models imported successfully")
except Exception:
    traceback.print_exc()

print("-" * 20)

try:
    from tutor import views
    print("Views imported successfully")
except Exception:
    traceback.print_exc()
