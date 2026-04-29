from app.core.firebase import verify_firebase_token
from app.core.security import create_jwt

def login_user(id_token: str):
    decoded = verify_firebase_token(id_token)

    user_data = {
        "uid": decoded["uid"],
        "email": decoded["email"],
        "role": "user",
        "subscription": None,
        "disabled": False
    }

    jwt_token = create_jwt(user_data)
    return jwt_token
