from fastapi import HTTPException
from datetime import datetime

async def check_subscription(user: dict):
    sub = user.get("subscription")
    
    # If no subscription info, allow for now (base functionality or trial)
    if not sub:
        return True
        
    if not sub.get("active"):
        raise HTTPException(status_code=403, detail="Subscription inactive")
        
    try:
        end_date = datetime.fromisoformat(sub["endDate"].replace('Z', '+00:00'))
        if datetime.utcnow().timestamp() > end_date.timestamp():
            raise HTTPException(status_code=403, detail="Subscription expired")
    except (ValueError, KeyError):
        # If dates are missing or invalid, default to blocked if subscription exists
        raise HTTPException(status_code=403, detail="Invalid subscription data")

    return True
