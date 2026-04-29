from fastapi import APIRouter, Depends
from app.middleware.auth import get_user
from app.middleware.subscription import check_subscription
from app.core.watchdog import get_system_stats

router = APIRouter()

@router.get("/profile")
async def get_profile(user: dict = Depends(get_user)):
    await check_subscription(user)
    return {
        "status": "success",
        "user": user,
        "system": get_system_stats()
    }
