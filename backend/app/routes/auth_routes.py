from fastapi import APIRouter, HTTPException
from app.services.auth_service import exchange_token
from pydantic import BaseModel

router = APIRouter()

class TokenExchangeRequest(BaseModel):
    firebase_token: str

@router.post("/exchange")
async def auth_exchange(data: TokenExchangeRequest):
    try:
        result = exchange_token(data.firebase_token)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
