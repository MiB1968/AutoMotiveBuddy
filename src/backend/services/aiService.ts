
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

/**
 * Standardized Diagnostic Response Schema
 */
export interface DiagnosticResponse {
    diagnosis: string;
    confidence: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    feasibility: "PROCEED" | "LIMITED" | "SPECIALIST";
    actions: string[];
    causes: string[];
    symptoms: string[];
    disclaimers: string[];
    sourceType: "OEM" | "HEURISTIC" | "AI";
    provider: "gemini" | "freellm" | "fail-safe";
}

let cachedAiKeys: string[] | null = null;
let lastKeyIndex = -1;

// Provider Health Tracking
const providerHealth = {
    gemini: { status: "healthy" as "healthy" | "degraded" | "down", lastError: null as string | null },
    freellm: { status: "healthy" as "healthy" | "degraded" | "down", lastError: null as string | null }
};

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
                return ""; // No keys available
            }
            return mainKey;
        }

        lastKeyIndex = (lastKeyIndex + 1) % keys.length;
        return keys[lastKeyIndex];
    }

    /**
     * Safety Enforcement Layer
     * Detects high-risk safety systems
     */
    private static detectHighRisk(prompt: string): boolean {
        const highRiskKeywords = ["airbag", "srs", "abs", "brake", "steering", "stability control", "hybrid battery", "high voltage"];
        const lowerPrompt = prompt.toLowerCase();
        return highRiskKeywords.some(keyword => lowerPrompt.includes(keyword));
    }

    /**
     * Normalization Layer
     * Ensures all provider outputs adhere to the OpenClaw standard
     */
    private static normalizeResponse(raw: any, provider: DiagnosticResponse["provider"]): DiagnosticResponse {
        // Map common variations of keys
        const diagnosis = raw.conclusion || raw.hypothesis || raw.diagnosis || raw.issue || "No specific diagnosis returned.";
        
        let actions = Array.isArray(raw.workflow) ? raw.workflow.map((w: any) => w.instruction || w.title) : (Array.isArray(raw.actions) ? raw.actions : (typeof raw.actions === 'string' ? [raw.actions] : []));
        if (actions.length === 0) {
            actions = Array.isArray(raw.fixes) ? raw.fixes : (typeof raw.fixes === 'string' ? [raw.fixes] : []);
        }

        const disclaimers = Array.isArray(raw.disclaimers) ? raw.disclaimers : (typeof raw.disclaimer === 'string' ? [raw.disclaimer] : ["Use at your own risk. Verify with professional tools."]);
        
        const causes = Array.isArray(raw.causes) ? raw.causes : (typeof raw.causes === 'string' ? [raw.causes] : (Array.isArray(raw.probableCauses) ? raw.probableCauses : (typeof raw.probableCauses === 'string' ? [raw.probableCauses] : [])));
        const symptoms = Array.isArray(raw.symptoms) ? raw.symptoms : (typeof raw.symptoms === 'string' ? [raw.symptoms] : (Array.isArray(raw.observations) ? raw.observations : (typeof raw.observations === 'string' ? [raw.observations] : [])));

        const finalCauses = causes.length > 0 ? causes : [
            diagnosis.length < 50 ? diagnosis : "System-wide malfunction requiring manual trace",
            "Intermittent signal loss",
            "Electronic control module correlation error"
        ];

        return {
            diagnosis,
            confidence: raw.confidence || 0.5,
            riskLevel: (raw.riskLevel || raw.severity || "MEDIUM").toUpperCase() as any,
            feasibility: (raw.feasibility || "PROCEED").toUpperCase() as any,
            actions: actions.length > 0 ? actions : [],
            causes: finalCauses,
            symptoms: symptoms.length > 0 ? symptoms : ["Check engine light"],
            disclaimers,
            sourceType: (raw.sourceType || "AI").toUpperCase() as any,
            provider: provider
        };
    }

    private static getFailSafeResponse(reason: string): DiagnosticResponse {
        return {
            diagnosis: `Diagnostic System Offline: ${reason}`,
            confidence: 0,
            riskLevel: "HIGH",
            feasibility: "LIMITED",
            actions: ["Check physical connectors", "Verify battery voltage", "Consult OEM manual manually"],
            causes: ["Communication failure", "System overload"],
            symptoms: ["Dashboard light flickering", "Loss of real-time data"],
            disclaimers: ["Automotive Buddy is currently in Fail-Safe mode."],
            sourceType: "HEURISTIC",
            provider: "fail-safe"
        };
    }

    private static async callSecondaryProvider(prompt: string, systemInstruction: string): Promise<any> {
        const apiKey = process.env.FREE_LLM_API_KEY;
        const baseUrl = process.env.FREE_LLM_API_BASE_URL || "https://api.freellm.io/v1";
        const model = process.env.FREE_LLM_MODEL || "llama-3-8b-instruct";

        if (!apiKey || apiKey.length < 5) {
            providerHealth.freellm.status = "down";
            throw new Error("Secondary provider configured but key is missing.");
        }

        try {
            const response = await axios.post(`${baseUrl}/chat/completions`, {
                model,
                messages: [
                    { role: "system", content: `${systemInstruction}\nIMPORTANT: You must return a JSON object with: diagnosis, confidence, riskLevel (LOW|MEDIUM|HIGH), feasibility (PROCEED|LIMITED|SPECIALIST), actions (list), causes (list), symptoms (list), disclaimers (list), sourceType.` },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 
            });

            providerHealth.freellm.status = "healthy";
            const content = response.data.choices[0].message.content;
            return JSON.parse(content);
        } catch (error: any) {
            providerHealth.freellm.status = "down";
            providerHealth.freellm.lastError = error.message;
            throw error;
        }
    }

    static async generateJSON(prompt: string, systemInstruction: string, image?: { data: string, mimeType: string }): Promise<DiagnosticResponse> {
        const apiKey = this.getApiKey();
        const useSecondary = process.env.FREE_LLM_ENABLED === 'true';

        // 1. External Safety Audit
        if (this.detectHighRisk(prompt)) {
            console.warn("[AIService] High-risk system detected in prompt. Boosting safety constraints.");
            systemInstruction += "\nIMPORTANT: High-risk safety system detected (Airbag/Brakes/Steering). You MUST advise professional inspection if there is any doubt.";
        }

        // 2. Provider Routing
        try {
            // Priority 1: Gemini (Primary + Vision)
            if (apiKey && providerHealth.gemini.status !== "down") {
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const parts: any[] = [{ text: prompt }];
                    if (image) {
                        parts.push({
                            inlineData: { data: image.data, mimeType: image.mimeType }
                        });
                    }

                    const response = await ai.models.generateContent({
                        model: "gemini-1.5-pro",
                        contents: [{ role: 'user', parts }],
                        config: {
                            responseMimeType: "application/json",
                            systemInstruction
                        }
                    });

                    providerHealth.gemini.status = "healthy";
                    return this.normalizeResponse(JSON.parse(response.text || "{}"), "gemini");
                } catch (gErr: any) {
                    console.error("[AIService] Gemini Failed, attempting fallback...");
                    providerHealth.gemini.status = "degraded";
                    providerHealth.gemini.lastError = gErr.message;
                    if (!useSecondary || image) throw gErr; // Can't fallback for vision effectively
                }
            }

            // Priority 2: Secondary Provider (Fallback)
            if (useSecondary && !image && providerHealth.freellm.status !== "down") {
                const raw = await this.callSecondaryProvider(prompt, systemInstruction);
                return this.normalizeResponse(raw, "freellm");
            }

            throw new Error("No active AI providers available for this task.");

        } catch (error: any) {
            console.error("[AIService] Global AI Failure:", error.message);
            return this.getFailSafeResponse(error.message);
        }
    }
}
