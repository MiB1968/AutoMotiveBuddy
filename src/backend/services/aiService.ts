
import { GoogleGenAI } from "@google/genai";

let cachedAiKeys: string[] | null = null;
let lastKeyIndex = -1;

export class AIService {
    private static getAiKeys(): string[] {
        if (cachedAiKeys !== null) return cachedAiKeys;

        cachedAiKeys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_FALLBACK,
            process.env.GEMINI_API_KEY_SECONDARY
        ].filter(key => {
            if (!key) return false;
            const k = key.trim().toLowerCase();
            if (k.includes('your_') || k.includes('optional') || k.length < 10) return false;
            return true;
        }) as string[];

        return cachedAiKeys;
    }

    private static getApiKey(): string {
        const keys = this.getAiKeys();
        if (keys.length === 0) {
            const mainKey = process.env.GEMINI_API_KEY;
            if (!mainKey || mainKey.length < 10 || mainKey.toLowerCase().includes('your_')) {
                throw new Error("No valid Gemini API keys found. Please set GEMINI_API_KEY in the settings/environment.");
            }
            return mainKey;
        }

        // Simple rotation
        lastKeyIndex = (lastKeyIndex + 1) % keys.length;
        return keys[lastKeyIndex];
    }

    static async generateJSON(prompt: string, systemInstruction: string, image?: { data: string, mimeType: string }) {
        const apiKey = this.getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        
        const parts: any[] = [{ text: prompt }];
        if (image) {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }

        try {
            const response = await ai.models.generateContent({
                model: "gemini-flash-latest",
                contents: [{ role: 'user', parts }],
                config: {
                    responseMimeType: "application/json",
                    systemInstruction
                }
            });

            // According to @google/genai types, text is available on the response
            const text = response.text || "{}";
            return JSON.parse(text);
        } catch (error: any) {
            if (error.message?.includes('API key not valid')) {
                console.error("[AIService] Authentication failed with current key. Key might be invalid or restricted.");
            }
            console.error("[AIService] Generation Error:", error);
            throw error;
        }
    }
}
