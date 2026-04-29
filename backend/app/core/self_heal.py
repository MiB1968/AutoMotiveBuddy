import time
import traceback
from datetime import datetime
from functools import wraps

HEALTH_LOG = []

def self_heal(module: str):
    def wrapper(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                HEALTH_LOG.append({
                    "module": module,
                    "error": str(e),
                    "time": datetime.utcnow().isoformat(),
                    "trace": traceback.format_exc()
                })
                
                # Retry once after a short delay
                try:
                    time.sleep(0.3)
                    return fn(*args, **kwargs)
                except Exception as inner_e:
                    return {
                        "status": "degraded",
                        "module": module,
                        "error": str(inner_e)
                    }
        return inner
    return wrapper

def get_health_log():
    return HEALTH_LOG
