import { Mutex } from 'async-mutex';

export class KeyManager {
  private keys: string[];
  private index: number;
  private mutex: Mutex;

  constructor(keys: string[]) {
    this.keys = keys;
    this.index = 0;
    this.mutex = new Mutex();
  }

  async getNextKey(): Promise<string | null> {
    const release = await this.mutex.acquire();
    try {
      if (this.keys.length === 0) return null;
      const key = this.keys[this.index];
      this.index = (this.index + 1) % this.keys.length;
      return key;
    } finally {
      release();
    }
  }

  async markInvalid(badKey: string): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      this.keys = this.keys.filter(k => k !== badKey);
      if (this.keys.length === 0) this.index = 0;
    } finally {
      release();
    }
  }
}
