from pydantic import BaseModel
from typing import Optional

class Subscription(BaseModel):
    plan: str
    startDate: str
    endDate: str
    active: bool

class User(BaseModel):
    uid: str
    email: str
    role: str
    subscription: Optional[Subscription]
    disabled: bool = False
