import logging
from app.domain.dtc_engine import DTCEngine
from app.models.schemas import DiagnosticRequest, DiagnosticResponse

logger = logging.getLogger("automotive-buddy-api")

def execute_diagnostic_analysis(engine: DTCEngine, request: DiagnosticRequest) -> DiagnosticResponse:
    """Core logic to analyze a DTC Request"""
    
    dtc_record = engine.find_dtc(request.code)
    
    if not dtc_record:
        logger.warning(f"DTC not found: {request.code}")
        return None
        
    confidence = engine.calculate_confidence(dtc_record, request.brand, request.vehicle_type)
    causes = engine.extract_causes(dtc_record)
    fixes = engine.extract_fixes(dtc_record)
    
    return DiagnosticResponse(
        code=dtc_record.get("code", request.code),
        description=dtc_record.get("description", "Unknown Fault"),
        top_causes=causes,
        symptoms=dtc_record.get("symptoms", []),
        fixes=fixes,
        severity=dtc_record.get("severity", "unknown"),
        confidence=confidence,
        mechanic_explanation=dtc_record.get("mechanic_explanation")
    )
