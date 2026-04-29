from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from app.middleware.auth_middleware import require_super_admin
from app.services.subscription_service import create_subscription
from app.services.guest_service import generate_guest_account
from app.services.audit_service import log_admin_action

router = APIRouter()
db = firestore.client()

@router.get("/users")
def get_users(user=Depends(require_super_admin)):
    users = [doc.to_dict() for doc in db.collection('users').stream()]
    return users

@router.post("/set-subscription")
def set_subscription(data: dict, user=Depends(require_super_admin)):
    sub = create_subscription(data["plan"])
    db.collection('users').document(data["uid"]).update({"subscription": sub})
    log_admin_action(user["uid"], "SET_SUBSCRIPTION", data["uid"], {"plan": data["plan"]})
    return {"subscription": sub}

@router.post("/disable-user")
def disable_user(data: dict, user=Depends(require_super_admin)):
    db.collection('users').document(data["uid"]).update({"disabled": True})
    log_admin_action(user["uid"], "DISABLE_USER", data["uid"])
    return {"message": "User disabled"}

@router.post("/create-guest")
def create_guest(user=Depends(require_super_admin)):
    guest = generate_guest_account()
    # Save guest to firestore
    db.collection('users').document(guest['email']).set(guest)
    log_admin_action(user["uid"], "CREATE_GUEST", guest['email'])
    return guest
