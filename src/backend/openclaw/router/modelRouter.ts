import { GoogleGenAI } from "@google/genai";
import { KeyManager } from "./keyManager";

/**
 * OPENCLAW MODEL ROUTER
 * 
 * NOTE: The 'gemini-api' skill recommends calling Gemini from the frontend.
 * However, the AutoMotive Buddy architecture mandates a JWT-secured, 
 * authoritative backend for agent orchestration, PII protection, 
 * and multi-key rotation (to prevent leaking rotation keys to the client).
 */
export class ModelRouter {
  
  async route(prompt: string, complexity: 'low' | 'high' = 'low') {
    const apiKey = KeyManager.getNextKey();
    if (!apiKey) {
      throw new Error("OpenClaw Critical: No API key available in rotation matrix.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Selecting modern models from the gemini-api skill
    // High complexity: Advanced Reasoning (Pro)
    // Low complexity: Fast/Basic Tasks (Flash)
    const modelName = complexity === 'high' ? "gemini-3.1-pro-preview" : "gemini-flash-latest";
    
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Neural Matrix.");
      }
      return text;
    } catch (e: any) {
      console.error(`[OPENCLAW-ROUTER-ERROR] Key rotation failure or model error:`, e);
      throw e;
    }
  }
}
