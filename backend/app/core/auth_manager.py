import jwt
import datetime
import random
import string
from fastapi import HTTPException
from app.utils.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY or "SUPER_SECRET_JWT_KEY"
ALGORITHM = "HS256"

DURATIONS = {
    "1_month": 30,
    "3_month": 90,
    "6_month": 180,
    "1_year": 365,
    "guest_24h": 1
}

def create_access_token(user_data: dict):
    to_encode = user_data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_subscription(plan: str):
    days = DURATIONS.get(plan, 0)
    start = datetime.datetime.utcnow()
    end = start + datetime.timedelta(days=days)
    return {
        "plan": plan,
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "active": True
    }

def is_subscription_valid(user):
    end_date = datetime.datetime.fromisoformat(user["subscription"]["endDate"])
    return datetime.datetime.utcnow() < end_date

def require_super_admin(user):
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return True

def generate_guest_account():
    number = random.randint(100, 999)
    username = f"autobuddy-{number}@gmail.com"
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    subscription = create_subscription("guest_24h")
    return {
        "username": username,
        "password": password,
        "role": "guest",
        "subscription": subscription
    }
