import firebase_admin
from firebase_admin import credentials, auth
import os
import json

firebase_config = os.getenv("FIREBASE_CONFIG")

if not firebase_config:
    raise Exception("MISSING CONFIG: FIREBASE_CONFIG")

cred_dict = json.loads(firebase_config)
cred = credentials.Certificate(cred_dict)

firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token: str):
    return auth.verify_id_token(id_token)
