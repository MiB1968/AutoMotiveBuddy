import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

// Key Rotation System
// We strictly prioritize GEMINI_API_KEY as per platform instructions.
// Additional keys are for redundancy, but must be valid strings.
const AI_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_SECONDARY
].filter(key => {
    if (!key) return false;
    // Basic heuristics to filter out placeholder strings that might be in .env by mistake
    const k = key.trim().toLowerCase();
    if (k.includes('your_') || k.includes('optional') || k.length < 10) return false;
    return true;
}) as string[];

function getRotatedKey() {
    if (AI_KEYS.length === 0) {
        // Fallback to platform default if somehow filtered out incorrectly
        return process.env.GEMINI_API_KEY || null;
    }
    return AI_KEYS[Math.floor(Math.random() * AI_KEYS.length)];
}

function getAIClient(apiKey: string) {
    if (!apiKey) throw new Error("No API key available for AI initialization.");
    return new GoogleGenAI({ apiKey });
}

// ================================
// 🔧 TOOLS (REPLICATED FROM SNIPPET)
// ================================

const TOOLS = {
    get_dtc_info: (params: { code: string }) => {
        return {
            code: params.code,
            desc: "Diagnostic Trouble Code Analysis (Cloud Node)",
            causes: [
                "Sensor signal interruption",
                "Circuit resistance outside tolerance",
                "Control module correlation error"
            ],
            fixes: [
                "Verify wiring harness integrity",
                "Check ground reference points",
                "Perform specialized sensor sweep"
            ]
        };
    },
    search_wiring: (params: { component: string }) => {
        return {
            component: params.component,
            wires: [
                { color: "Red/White", function: "BATT+" },
                { color: "Black", function: "GND" },
                { color: "Yellow/Blue", function: "CAN-H" }
            ]
        };
    },
    get_fuse_info: (params: { system: string }) => {
        return {
            system: params.system,
            fuse: "20A / 10A (Secondary)",
            location: "Passenger Compartment PJB",
            relay: "Main CPU Relay"
        };
    }
};

router.post("/diagnose", async (req, res) => {
    const { vehicle, symptom, code } = req.body;
    const apiKey = getRotatedKey();

    if (!apiKey) {
        return res.status(503).json({ error: "AI Service Offline", message: "No API keys configured." });
    }

    try {
        const ai = getAIClient(apiKey);
        
        const prompt = `
            Act as AutoBuddy, a Master Automotive Technician.
            Vehicle: ${vehicle || 'Universal'}
            Symptom/Code: ${code || ''} - ${symptom}
            
            Return a JSON object exactly in this format:
            {
                "issue": "Specific primary diagnosis",
                "confidence": "Percentage string (e.g. 85%)",
                "recommendation": "Short clear fix steps"
            }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text?.trim() || "{}";

        try {
            const structured = JSON.parse(text);
            res.json({
                status: "success",
                ...structured,
                timestamp: new Date().toISOString()
            });
        } catch (parseErr) {
            res.json({
                status: "success",
                issue: "Analysis Complete",
                confidence: "80%",
                recommendation: text.substring(0, 200),
                raw: text
            });
        }
    } catch (e: any) {
        console.error("[AI] Neural Matrix Error:", e);
        res.status(500).json({ error: "Diagnostic Generation Failed", message: e.message });
    }
});

// NEW ENDPOINT: Unified AI Diagnose (Matches user's Python snippet)
router.post("/ai-diagnose", async (req, res) => {
    const { message, image } = req.body;
    const apiKey = getRotatedKey();

    if (!apiKey) {
        return res.status(503).json({ error: "AI Service Offline", message: "No API keys configured." });
    }

    try {
        const ai = getAIClient(apiKey);
        
        // Simulating tool-augmented generation (RAG style tools)
        let contextData = "";
        const lowerMsg = (message || "").toLowerCase();
        
        // Match DTC patterns
        const dtcMatch = lowerMsg.match(/[pbcud]\d{4}/i);
        if (dtcMatch) {
            const info = TOOLS.get_dtc_info({ code: dtcMatch[0].toUpperCase() });
            contextData += `\n[REGISTRY: DTC INFO]: ${JSON.stringify(info)}\n`;
        }
        
        // Match wiring queries
        if (lowerMsg.includes('wire') || lowerMsg.includes('wiring') || lowerMsg.includes('color')) {
            const info = TOOLS.search_wiring({ component: "Selected Subsystem" });
            contextData += `\n[REGISTRY: WIRING]: ${JSON.stringify(info)}\n`;
        }

        const parts: any[] = [{ text: contextData + (message || "Analyze this image for automotive issues.") }];
        
        if (image) {
            // Assume image is base64 string "data:image/jpeg;base64,..."
            const base64Data = image.split(',')[1] || image;
            const mimeTypeMatch = image.match(/^data:(image\/[a-zA-Z]*);base64,/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
            
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: { parts },
            config: {
                systemInstruction: `
                    You are "AutoBuddy OpenClaw" - an advanced automotive diagnostic agent.
                    You have access to internal diagnostic tools for DTCs, wiring, and fuses.
                    
                    OPERATIONAL PROTOCOLS:
                    1. If you receive registry data, integrate it into your analysis.
                    2. Explain symptoms and causes based on the provided logic.
                    3. Prioritize safety and step-by-step troubleshooting.
                    4. Tone: Expert Master Technician, professional and concise.
                    5. VISION CAPABILITY: If an image is provided, inspect it for automotive failures (leaks, wear, warning lights, damage). Describe what you see and provide a diagnostic hypothesis.
                `
            }
        });
        
        res.json({
            result: response.text?.trim() || "No diagnostic output available."
        });
    } catch (e: any) {
        console.error("[AI] Neural Link Failure:", e);
        res.status(500).json({ error: "AI Processing Error", message: e.message });
    }
});

export default router;

