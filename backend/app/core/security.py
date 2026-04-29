from jose import jwt
from datetime import datetime, timedelta
from app.core.config import JWT_SECRET, ALGORITHM

def create_jwt(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=12)
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def decode_jwt(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
