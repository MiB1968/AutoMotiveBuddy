from datetime import datetime
from app.core.firebase import db
from app.core.logging_config import log_security_event

def log_admin_action(admin_uid: str, action: str, target_uid: str, metadata: dict = None):
    if metadata is None:
        metadata = {}
    
    # Log to Firestore
    db.collection("admin_logs").add({
        "admin_uid": admin_uid,
        "action": action,
        "target_uid": target_uid,
        "metadata": metadata,
        "timestamp": datetime.utcnow()
    })
    
    # Log to system log
    log_security_event(f"ADMIN_ACTION_{action}", admin_uid, {"target_uid": target_uid, "metadata": metadata})
