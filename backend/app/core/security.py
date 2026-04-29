from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.core.config import settings

def create_jwt(user: dict):
    payload = user.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=12)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def decode_jwt(token: str):
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return None
