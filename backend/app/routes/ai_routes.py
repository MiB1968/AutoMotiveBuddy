from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_user
from app.middleware.subscription import check_subscription
from pydantic import BaseModel

router = APIRouter()

class DiagnoseRequest(BaseModel):
    code: str
    symptoms: str = ""

@router.post("/diagnose")
async def ai_diagnose(data: DiagnoseRequest, user: dict = Depends(get_user)):
    await check_subscription(user)
    
    # In a real app, this would call Gemini API
    return {
        "status": "success",
        "analysis": f"AI analysis for {data.code} based on {data.symptoms or 'default telemetry'}. Recommendation: Check ground connections and verify signal voltage.",
        "confidence": 0.89
    }
