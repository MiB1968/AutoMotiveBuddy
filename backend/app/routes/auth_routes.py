from fastapi import APIRouter
from app.services.auth_service import login_user

router = APIRouter()

@router.post("/login")
def login(data: dict):
    token = login_user(data["id_token"])
    return {"access_token": token}
