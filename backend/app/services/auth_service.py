from app.core.firebase import verify_firebase_token, db
from app.core.security import create_jwt
from app.core.self_heal import self_heal

@self_heal("AUTH_SERVICE")
def exchange_token(id_token: str):
    decoded = verify_firebase_token(id_token)
    uid = decoded["uid"]
    email = decoded.get("email")
    
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    
    admin_emails = ['rubenlleg12@gmail.com', 'rubenllego12@gmail.com']
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
    else:
        role = 'user'
        if email and email.lower() in admin_emails:
            role = 'super_admin'
        
        user_data = {
            "uid": uid,
            "email": email,
            "role": role,
            "status": "active",
            "subscription": None
        }
        user_ref.set(user_data)
        
    # Patch role if needed
    if email and email.lower() in admin_emails and user_data.get('role') != 'super_admin':
        user_data['role'] = 'super_admin'
        user_ref.update({'role': 'super_admin'})
        
    # Generate our backend JWT
    token = create_jwt(user_data)
    return {"token": token, "user": user_data}
