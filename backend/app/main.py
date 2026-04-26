import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import DiagnosticRequest
from app.domain.dtc_engine import DTCEngine
from app.services.diagnostic_service import execute_diagnostic_analysis
from app.utils.helpers import setup_logger, format_success_response, format_error_response
from app.utils.config import settings

logger = setup_logger("automotive-buddy-api")

app = FastAPI(
    title=settings.app_name,
    description="Backend AI Diagnostic Services",
    version=settings.api_version
)

# Allow CORS for Vercel Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load DTC Master Data
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_PATH = os.path.join(BASE_DIR, 'data', 'dtc_master.json')
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        RAW_DTC_DATA = json.load(f)
    logger.info(f"Loaded {len(RAW_DTC_DATA)} DTCs from database.")
except Exception as e:
    logger.error(f"Failed to load DTC database: {e}")
    RAW_DTC_DATA = []

engine = DTCEngine(RAW_DTC_DATA)

@app.get("/")
def root():
    return {"status": "online", "message": "AutoMotive Buddy Backend API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}

@app.post("/api/diagnose", response_model=dict)
def analyze_dtc(request: DiagnosticRequest):
    response_data = execute_diagnostic_analysis(engine, request)
    
    if not response_data.get("success"):
        raise HTTPException(status_code=404, detail="DTC not found in local database")
        
    return format_success_response(response_data["data"], "Diagnostic analysis complete")

@app.post("/sync/upload")
def sync_upload(data: dict):
    # Stub for syncing logs
    return {"status": "ok", "uploaded": len(data.get("logs", []))}

@app.get("/sync/download")
def sync_download():
    # Stub for syncing latest DTCs
    return {"status": "ok", "dtc": []}
