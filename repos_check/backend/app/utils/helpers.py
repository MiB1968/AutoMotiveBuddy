import logging

def setup_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger

def format_success_response(data: dict, message: str = "Success"):
    return {
        "success": True,
        "message": message,
        "data": data
    }

def format_error_response(message: str, error_code: str = "ERROR"):
    return {
        "success": False,
        "message": message,
        "error_code": error_code
    }
