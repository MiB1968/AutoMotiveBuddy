import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Key Rotation System
const AI_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_SECONDARY
].filter(Boolean) as string[];

function getRotatedKey() {
    if (AI_KEYS.length === 0) return null;
    return AI_KEYS[Math.floor(Math.random() * AI_KEYS.length)];
}

router.post("/diagnose", async (req, res) => {
    const { vehicle, symptom, code } = req.body;
    const apiKey = getRotatedKey();

    if (!apiKey) {
        return res.status(503).json({ error: "AI Service Offline", message: "No API keys configured." });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();

        try {
            const structured = JSON.parse(text);
            res.json({
                status: "success",
                ...structured,
                timestamp: new Date().toISOString()
            });
        } catch (parseErr) {
            // Fallback if AI skips JSON format
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

export default router;

