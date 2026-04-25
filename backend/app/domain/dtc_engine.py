from app.ai.ranking_engine import AIRankingEngine

class DTCEngine:
    """
    Core Domain Logic for identifying and manipulating DTC codes
    and extracting heuristic logic based on vehicle type.
    """
    def __init__(self, dtc_database: list):
        self.db = dtc_database
        self.ai = AIRankingEngine()

    def lookup_dtc(self, code: str) -> dict:
        """Finds a DTC by code ignoring casing."""
        for dtc in self.db:
            if dtc.get('code', '').upper() == code.upper():
                return dtc
        return None

    def analyze(self, code: str, data: dict):
        dtc_entry = self.lookup_dtc(code)

        if not dtc_entry:
            return {"error": "DTC not found"}

        context = {
            "symptoms": data.get("symptoms", []),
            "severity": data.get("severity", "medium"),
            "vehicle_type": data.get("vehicle_type", "car")
        }

        # Fallback handling for DB formats
        raw_causes = dtc_entry.get("possible_causes", [])
        if not raw_causes and "causes" in dtc_entry:
            causes_val = dtc_entry["causes"]
            if isinstance(causes_val, list) and len(causes_val) > 0 and isinstance(causes_val[0], str):
                raw_causes = [{"cause": c, "symptoms": dtc_entry.get("symptoms", []), "frequency_score": 0.5} for c in causes_val]
            else:
                raw_causes = causes_val

        ranked_causes = self.ai.rank_causes(
            raw_causes,
            context
        )

        return {
            "code": code,
            "description": dtc_entry.get("description"),
            "ranked_causes": ranked_causes,
            "confidence": ranked_causes[0]["ai_score"] if ranked_causes else 0
        }
