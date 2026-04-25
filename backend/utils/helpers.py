import logging

def setup_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

def format_success_response(data: dict, message: str = "Success"):
    return {
        "status": "success",
        "message": message,
        "data": data
    }

def format_error_response(message: str):
    return {
        "status": "error",
        "message": message,
        "data": None
    }
