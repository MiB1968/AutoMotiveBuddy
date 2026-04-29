from app.core.firebase import verify_firebase_token, db
from app.core.security import create_jwt

def login_user(id_token: str):
    decoded = verify_firebase_token(id_token)
    uid = decoded["uid"]
    email = decoded["email"]
    
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
    else:
        role = 'user'
        if email == 'rubenlleg12@gmail.com':
            role = 'super_admin'
        user_data = {
            "uid": uid,
            "email": email,
            "role": role,
            "subscription": None,
            "disabled": False
        }
        user_ref.set(user_data)
        
    # Temporary patch to fix role if already created
    if email == 'rubenlleg12@gmail.com' and user_data.get('role') != 'super_admin':
        user_data['role'] = 'super_admin'
        user_ref.update({'role': 'super_admin'})

    jwt_token = create_jwt(user_data)
    return jwt_token
