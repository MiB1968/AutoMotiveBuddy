from datetime import datetime, timedelta

def create_subscription(plan: str):
    now = datetime.utcnow()

    durations = {
        "1_month": 30,
        "3_month": 90,
        "6_month": 180,
        "1_year": 365
    }

    days = durations.get(plan)
    if not days:
        raise Exception("Invalid plan")

    return {
        "plan": plan,
        "startDate": now.isoformat(),
        "endDate": (now + timedelta(days=days)).isoformat(),
        "active": True
    }
