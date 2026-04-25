from app.ai.ranking_engine import AIRankingEngine

class DTCEngine:
    def __init__(self, db=None):
        self.db = db

    def rank_dtc(self, code_data, symptoms=None):
        # Fallback to integer severity or mapping strings to ints if needed
        severity_val = code_data.get("severity", 5)
        if isinstance(severity_val, str):
            mapping = {"low": 3, "medium": 5, "high": 8, "critical": 10}
            base_score = mapping.get(severity_val.lower(), 5)
        else:
            base_score = severity_val

        symptom_bonus = 0
        if symptoms:
            matched = len(set(symptoms) & set(code_data.get("symptoms", [])))
            symptom_bonus = matched * 2

        frequency_weight = code_data.get("frequency", 1)

        confidence = min(100, (base_score * 10) + symptom_bonus + frequency_weight)

        return {
            "code": code_data["code"],
            "confidence": confidence,
            "priority": self._priority(confidence),
            "likely_causes": sorted(
                code_data.get("causes", []),
                key=lambda x: x.get("probability", 0) if isinstance(x, dict) else 0,
                reverse=True
            )
        }

    def _priority(self, confidence):
        if confidence > 80:
            return "CRITICAL"
        if confidence > 50:
            return "HIGH"
        return "MEDIUM"
