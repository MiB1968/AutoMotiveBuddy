from datetime import datetime, timedelta
from app.core.self_heal import self_heal

@self_heal("SUBSCRIPTION_SERVICE")
def create_subscription_plan(plan_type: str):
    durations = {
        "monthly": 30,
        "yearly": 365,
        "trial": 3,
        "guest_24h": 1
    }
    
    days = durations.get(plan_type, 30)
    
    return {
        "plan": plan_type,
        "startDate": datetime.utcnow().isoformat(),
        "endDate": (datetime.utcnow() + timedelta(days=days)).isoformat(),
        "active": True
    }
