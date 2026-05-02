import fs from 'fs';
import path from 'path';

export class KeyManager {
  private static keys: string[] = [];
  private static currentIndex: number = 0;

  static {
    try {
      const keysPath = path.join(process.cwd(), 'src/backend/openclaw/router/keys.json');
      if (fs.existsSync(keysPath)) {
        const data = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
        this.keys = data.gemini_keys || [];
      }
    } catch (e) {
      console.error("OpenClaw KeyManager: Failed to load keys", e);
    }
  }

  static getNextKey(): string | null {
    if (this.keys.length === 0) return process.env.GEMINI_API_KEY || null;
    
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  static getKeysCount(): number {
    return this.keys.length;
  }
}
