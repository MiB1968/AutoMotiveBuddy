import logging
from app.domain.dtc_engine import DTCEngine
from app.models.schemas import DiagnosticRequest, DiagnosticResponse

logger = logging.getLogger("automotive-buddy-api")

def execute_diagnostic_analysis(engine: DTCEngine, request: DiagnosticRequest):
    """Core logic to analyze a DTC Request"""
    
    result = engine.analyze(
        request.code,
        {
            "symptoms": request.symptoms,
            "severity": request.severity,
            "vehicle_type": request.vehicle_type
        }
    )

    return {
        "success": True,
        "data": result
    }
