import logging
from pythonjsonlogger import jsonlogger
import sys

# Configure structured logging
logger = logging.getLogger()
logHandler = logging.StreamHandler(sys.stdout)

formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

def log_security_event(event: str, user_id: str = None, extra: dict = None):
    if extra is None:
        extra = {}
    
    log_data = {
        "event": event,
        "user_id": user_id,
        "extra": extra
    }
    logger.info(log_data)
