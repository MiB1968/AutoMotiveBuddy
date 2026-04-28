import { GoogleGenAI } from "@google/genai";
import { KeyManager } from "./keyManager";
import { KeyLimiter } from "./keyLimiter";

export class KeyRouter {
  private keyManager: KeyManager;
  private keyLimiter: KeyLimiter;

  constructor(keyManager: KeyManager, keyLimiter: KeyLimiter) {
    this.keyManager = keyManager;
    this.keyLimiter = keyLimiter;
  }

  async aiRequest(prompt: string): Promise<string | null> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const apiKey = await this.keyManager.getNextKey();
      if (!apiKey) continue;

      if (await this.keyLimiter.isRateLimited(apiKey)) continue;
      
      try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
        });
        this.keyLimiter.record(apiKey);
        return result.text;
      } catch (e: any) {
        if (e.status === 429) {
          await this.keyLimiter.triggerCooldown(apiKey);
        } else if (e.status === 401) {
          await this.keyManager.markInvalid(apiKey);
        }
      }
    }
    return null;
  }
}
