from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import require_active_user

router = APIRouter()

@router.get("/profile")
def profile(user=Depends(require_active_user)):
    return user
