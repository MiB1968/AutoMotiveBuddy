from typing import List, Dict

class AIRankingEngine:
    def __init__(self):
        # weights (tunable later)
        self.weights = {
            "symptom_match": 0.45,
            "severity_match": 0.25,
            "historical_frequency": 0.20,
            "vehicle_match": 0.10,
        }

    def score_cause(self, cause: Dict, context: Dict) -> float:
        score = 0.0

        # 1. Symptom overlap scoring
        cause_symptoms = set(cause.get("symptoms", []))
        input_symptoms = set(context.get("symptoms", []))

        if cause_symptoms and input_symptoms:
            overlap = len(cause_symptoms.intersection(input_symptoms))
            score += self.weights["symptom_match"] * (overlap / len(cause_symptoms))

        # 2. Severity alignment
        if cause.get("severity") == context.get("severity"):
            score += self.weights["severity_match"]

        # 3. Frequency heuristic (fallback intelligence)
        score += self.weights["historical_frequency"] * cause.get("frequency_score", 0.5)

        # 4. Vehicle type match
        if cause.get("vehicle_type") == context.get("vehicle_type"):
            score += self.weights["vehicle_match"]

        return round(score, 4)

    def rank_causes(self, causes: List[Dict], context: Dict) -> List[Dict]:
        ranked = []

        for cause in causes:
            score = self.score_cause(cause, context)
            ranked.append({
                **cause,
                "ai_score": score
            })

        return sorted(ranked, key=lambda x: x["ai_score"], reverse=True)
