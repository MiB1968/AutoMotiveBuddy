from fastapi import Header, HTTPException, Depends
from app.core.security import decode_jwt
from datetime import datetime

def require_active_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = decode_jwt(token)

        if payload.get("disabled"):
            raise HTTPException(403, "User disabled")

        sub = payload.get("subscription")
        if sub:
            if datetime.utcnow() > datetime.fromisoformat(sub["endDate"]):
                raise HTTPException(403, "Subscription expired")

        return payload
    except:
        raise HTTPException(401, "Invalid token")

def require_super_admin(user=Depends(require_active_user)):
    if user.get("role") != "super_admin":
        raise HTTPException(403, "Admin only")
    return user
