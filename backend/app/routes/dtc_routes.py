from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_user
from app.middleware.subscription import check_subscription
import json
import os

router = APIRouter()

# Mock DTC database for the example
DTC_DATA = [
    {
        "code": "P0101",
        "description": "Mass Air Flow Sensor Circuit Range/Performance",
        "system": "Powertrain",
        "severity": "medium",
        "symptoms": ["Check Engine Light", "Poor fuel economy", "Stalling"],
        "solutions": ["Clean MAF sensor", "Inspect intake leaks", "Replace MAF sensor"]
    },
    {
        "code": "P0171",
        "description": "System Too Lean (Bank 1)",
        "system": "Powertrain",
        "severity": "high",
        "symptoms": ["Rough idle", "Engine hesitates", "Misfires"],
        "solutions": ["Check for vacuum leaks", "Inspect fuel pressure", "Clean MAF sensor"]
    }
]

@router.get("/{code}")
async def get_dtc(code: str, user: dict = Depends(get_user)):
    await check_subscription(user)
    
    code = code.upper()
    dtc = next((d for d in DTC_DATA if d["code"] == code), None)
    
    if dtc:
        return {
            "status": "success",
            "data": dtc,
            "source": "verified_neural_db"
        }
    
    # AI Fallback mock
    return {
        "status": "partial",
        "data": {
            "code": code,
            "description": f"Live retrieval required for {code}",
            "system": "Unknown",
            "severity": "medium"
        },
        "source": "neural_bridge_pending"
    }
