import { Mutex } from 'async-mutex';

export class KeyLimiter {
  private limits: Map<string, number>;
  private mutex: Mutex;
  private cooldownPeriod: number;

  constructor() {
    this.limits = new Map();
    this.mutex = new Mutex();
    this.cooldownPeriod = 60000; // ms
  }

  async isRateLimited(key: string): Promise<boolean> {
    const release = await this.mutex.acquire();
    try {
      const now = Date.now();
      const cooldownUntil = this.limits.get(key);
      if (cooldownUntil && now < cooldownUntil) {
        return true;
      }
      return false;
    } finally {
      release();
    }
  }

  async triggerCooldown(key: string): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      this.limits.set(key, Date.now() + this.cooldownPeriod);
    } finally {
      release();
    }
  }

  record(key: string): void {
    // Tracking usage
  }
}
