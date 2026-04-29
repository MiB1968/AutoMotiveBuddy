import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise Exception("MISSING CONFIG: JWT_SECRET")

ALGORITHM = "HS256"
