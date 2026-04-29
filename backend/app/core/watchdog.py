import psutil
from datetime import datetime

def get_system_stats():
    mem = psutil.virtual_memory()
    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory": {
            "total": mem.total,
            "available": mem.available,
            "percent": mem.percent
        },
        "disk": psutil.disk_usage('/').percent,
        "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
        "timestamp": datetime.utcnow().isoformat()
    }
