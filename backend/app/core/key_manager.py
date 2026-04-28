import threading

class KeyManager:
    def __init__(self, keys):
        self.keys = keys
        self.index = 0
        self._lock = threading.Lock()

    def get_next_key(self):
        with self._lock:
            if not self.keys:
                return None
            key = self.keys[self.index]
            self.index = (self.index + 1) % len(self.keys)
            return key

    def mark_invalid(self, bad_key):
        with self._lock:
            self.keys = [k for k in self.keys if k != bad_key]
            if not self.keys:
                self.index = 0
