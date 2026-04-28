import logging
import asyncio
from app.domain.dtc_engine import DTCEngine
from app.models.schemas import DiagnosticRequest, DiagnosticResponse
from app.services.ai_service import ask_ai

logger = logging.getLogger("automotive-buddy-api")

class DiagnosticService:
    def __init__(self, engine, db):
        self.engine = engine
        self.db = db

    def analyze(self, request):
        dtc_data = None
        if isinstance(self.db, dict):
            dtc_data = self.db.get(request.code)
        elif isinstance(self.db, list):
            for item in self.db:
                if item.get("code", "").upper() == request.code.upper():
                    dtc_data = item
                    break
        
        if not dtc_data:
            logger.info(f"DTC not found, fallback to AI: {request.code}")
            try:
                ai_response = asyncio.run(ask_ai(f"Diagnose DTC code {request.code} with symptoms {request.symptoms}"))
                return {"success": True, "ai_data": ai_response}
            except Exception as e:
                logger.error(f"AI fallback failed: {e}")
                return {"error": "DTC not found and AI fallback failed"}

        return self.engine.rank_dtc(
            dtc_data,
            symptoms=request.symptoms
        )

def execute_diagnostic_analysis(engine_instance_or_service, request: DiagnosticRequest):
    """Core logic to analyze a DTC Request"""
    if isinstance(engine_instance_or_service, DiagnosticService):
        service = engine_instance_or_service
    else:
        # backward compatibility fallback
        service = DiagnosticService(engine_instance_or_service, engine_instance_or_service.db if hasattr(engine_instance_or_service, 'db') else [])
        
    result = service.analyze(request)
    
    if "error" in result:
        return {"success": False, "data": result}

    return {
        "success": True,
        "data": result
    }
