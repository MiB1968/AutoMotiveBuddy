from pydantic import BaseModel
from typing import List, Optional

class DiagnosticRequest(BaseModel):
    code: str
    vehicle_type: str = "light"
    brand: str = "Unknown"
    model: str = "Unknown"
    year: int = 2023
    symptoms: Optional[List[str]] = []
    severity: Optional[str] = "medium"

class DTCCause(BaseModel):
    item: str
    probability: float

class DiagnosticResponse(BaseModel):
    success: bool
    data: dict
