from fastapi import APIRouter, Depends
from app.middleware.auth import get_user
from app.middleware.role import require_super_admin
from app.services.guest_service import create_guest_account
from app.core.self_heal import get_health_log

router = APIRouter()

@router.post("/create-guest")
async def admin_create_guest(user: dict = Depends(get_user)):
    await require_super_admin(user)
    guest = create_guest_account()
    return {
        "status": "success",
        "guest": guest
    }

@router.get("/health-logs")
async def get_logs(user: dict = Depends(get_user)):
    await require_super_admin(user)
    return {
        "logs": get_health_log()
    }
