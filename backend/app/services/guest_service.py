import random
import string
from datetime import datetime, timedelta

def generate_guest_account():
    number = random.randint(100, 999)
    username = f"autobuddy-{number}@gmail.com"

    password = ''.join(random.choices(string.ascii_letters + string.digits, k=6))

    now = datetime.utcnow()

    subscription = {
        "plan": "guest_24h",
        "startDate": now.isoformat(),
        "endDate": (now + timedelta(hours=24)).isoformat(),
        "active": True
    }

    return {
        "email": username,
        "password": password,
        "role": "guest",
        "subscription": subscription
    }
