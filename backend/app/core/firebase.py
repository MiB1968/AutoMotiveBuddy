from firebase_admin import credentials, auth, firestore, initialize_app, _apps
import os
import json

_firebase_app = None

def get_firebase_app():
    global _firebase_app
    if not _firebase_app:
        firebase_config = os.getenv("FIREBASE_CONFIG")
        if not firebase_config:
            # Check if we can find a local firestore if no config, 
            # but usually we just want to fail gracefully during usage, not startup.
            return None
        
        try:
            if not _apps:
                cred_dict = json.loads(firebase_config)
                cred = credentials.Certificate(cred_dict)
                _firebase_app = initialize_app(cred)
            else:
                _firebase_app = _apps[0]
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            return None
    return _firebase_app

def verify_firebase_token(id_token: str):
    app = get_firebase_app()
    if not app:
        raise Exception("Firebase not initialized. Please check FIREBASE_CONFIG environment variable.")
    return auth.verify_id_token(id_token, app=app)

class FirestoreProxy:
    def __getattr__(self, name):
        app = get_firebase_app()
        if not app:
            raise Exception("Firestore not initialized. Please check FIREBASE_CONFIG environment variable.")
        db = firestore.client(app=app)
        return getattr(db, name)

db = FirestoreProxy()
