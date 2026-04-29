from fastapi import Header, HTTPException, Depends
from app.core.security import decode_jwt

async def get_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        
        user = decode_jwt(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
            
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
