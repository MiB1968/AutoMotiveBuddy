import threading
import time

class KeyLimiter:
    def __init__(self):
        self._limits = {}
        self._lock = threading.Lock()
        self.cooldown_period = 60 # seconds

    def is_rate_limited(self, key):
        with self._lock:
            now = time.time()
            limit_data = self._limits.get(key)
            if limit_data and now < limit_data["cooldown"]:
                return True
            return False

    def trigger_cooldown(self, key):
        with self._lock:
            self._limits[key] = {"cooldown": time.time() + self.cooldown_period}

    def record(self, key):
        # Could implement more complex usage tracking here
        pass
