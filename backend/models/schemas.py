from pydantic import BaseModel
from typing import List, Optional

class DiagnosticRequest(BaseModel):
    code: str
    vehicle_type: str = "light"
    brand: str = "Unknown"
    model: str = "Unknown"
    year: int = 2023

class DTCCause(BaseModel):
    item: str
    probability: float

class DiagnosticResponse(BaseModel):
    code: str
    description: str
    top_causes: List[str]
    symptoms: List[str]
    fixes: List[str]
    severity: str
    confidence: float
    mechanic_explanation: Optional[str] = None
