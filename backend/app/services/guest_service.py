import random
import string
from datetime import datetime, timedelta
from app.core.self_heal import self_heal

@self_heal("GUEST_SERVICE")
def create_guest_account():
    num = random.randint(1000, 9999)
    # Generate a secure 8 char password
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    return {
        "uid": f"guest-{num}",
        "username": f"guest_{num}",
        "fullName": f"Guest User {num}",
        "email": f"guest-{num}@autobuddy.local",
        "role": "guest",
        "status": "active",
        "subscription": {
            "plan": "guest_24h",
            "startDate": datetime.utcnow().isoformat(),
            "endDate": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "active": True
        }
    }
