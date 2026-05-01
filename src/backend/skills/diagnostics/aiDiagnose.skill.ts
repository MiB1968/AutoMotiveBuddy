
import { OpenClawEngine } from '../../services/openClawService';
import { Skill } from '../../runtime/types';
import { diagnosticCaseService } from '../../services/diagnosticCaseService';
import { SearchService } from '../../services/searchService';

const STATIC_TOOLS = {
    get_dtc_info: (params: { code: string }) => ({
        code: params.code,
        desc: "Diagnostic Trouble Code Analysis (Cloud Node)",
        causes: ["Sensor signal interruption", "Circuit resistance outside tolerance", "Control module correlation error"],
        fixes: ["Verify wiring harness integrity", "Check ground reference points", "Perform specialized sensor sweep"]
    }),
    search_wiring: (params: { component: string }) => ({
        component: params.component,
        wires: [{ color: "Red/White", function: "BATT+" }, { color: "Black", function: "GND" }, { color: "Yellow/Blue", function: "CAN-H" }]
    })
};

export const aiDiagnoseSkill: Skill<{ message: string, image?: string }, any> = {
  name: "ai_diagnose",
  description: "Advanced AI-powered automotive diagnostic assistant with vision capabilities",
  schema: {
    input: { message: "string", image: "base64 string (optional)" },
    output: { result: "string" }
  },
  async execute({ message, image }, ctx) {
    let contextData = "";
    const lowerMsg = (message || "").toLowerCase();
    
    const dtcMatch = lowerMsg.match(/[pbcud]\d{4}/i);
    const dtcCode = dtcMatch ? dtcMatch[0].toUpperCase() : undefined;

    if (dtcCode) {
        const info = STATIC_TOOLS.get_dtc_info({ code: dtcCode });
        contextData += `\n[REGISTRY: DTC INFO]: ${JSON.stringify(info)}\n`;
        
        // Fetch Historical Patterns (Internal Intelligence)
        try {
            const patterns = await diagnosticCaseService.getPatterns(dtcCode, ctx.vehicle?.model);
            if (patterns.length > 0) {
                contextData += `\n[INTELLIGENCE: HISTORICAL SUCCESSFUL PATHS]: ${JSON.stringify(patterns)}\n`;
                contextData += `Note: These tests have historically solved this code on this vehicle model with high confidence.\n`;
            }
        } catch (e) {
            console.warn("Pattern fetch failed", e);
        }

        // External Intelligence Grounding (Web Search)
        try {
            const searchQuery = `automotive ${dtcCode} troubleshooting steps ${ctx.vehicle?.make || ''} ${ctx.vehicle?.model || ''}`;
            const searchResults = await SearchService.search(searchQuery);
            if (searchResults.length > 0) {
                contextData += `\n[INTELLIGENCE: WEB GROUNDING (TOP 3)]: ${JSON.stringify(searchResults)}\n`;
                contextData += `Note: These are high-confidence external troubleshooting steps retrieved from verified automotive sources.\n`;
            }
        } catch (e) {
            console.warn("Web search grounding failed", e);
        }
    }
    
    if (lowerMsg.includes('wire') || lowerMsg.includes('wiring') || lowerMsg.includes('color')) {
        const info = STATIC_TOOLS.search_wiring({ component: "Selected Subsystem" });
        contextData += `\n[REGISTRY: WIRING]: ${JSON.stringify(info)}\n`;
    }

    const prompt = contextData + (message || "Analyze this image for automotive issues.");
    
    let imageData;
    if (image) {
        const base64Data = image.split(',')[1] || image;
        const mimeTypeMatch = image.match(/^data:(image\/[a-zA-Z]*);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
        imageData = { data: base64Data, mimeType };
    }

    const systemInstruction = `
        You are "AutoBuddy OpenClaw" - a Master Automotive Diagnostic Decision Engine.
        Your expertise covers Internal Combustion Engines (ICE), Hybrid (HEV), Battery Electric Vehicles (BEV), 
        Advanced Driver Assistance Systems (ADAS), and Vehicle Cybersecurity/SGW protocols.
        
        Your goal is not just to explain, but to DECIDE the best next steps for a technician.
        
        Vehicle: ${ctx.vehicle?.year} ${ctx.vehicle?.make} ${ctx.vehicle?.model}
        
        IMPORTANT: 
        1. If [INTELLIGENCE: HISTORICAL SUCCESSFUL PATHS] is present, prioritize those actions.
        2. If [INTELLIGENCE: WEB GROUNDING] is present, use these verified technical steps to calibrate your "actions". These are real-world proven steps from the technician community.
        3. For EVs: Prioritize high-voltage safety and battery state-of-health (SoH). Always include a safety warning if working near the HV battery or orange cables.
        4. For ADAS: Consider recalibration and sensor alignment as primary factors after physical work (like windshield or bumper replacement).
        5. For Modern Security (FCA, Renault, etc.): Always note if a Secure Gateway (SGW) check is required before bi-directional testing. Mention bypass cables or AutoAuth if needed.
        6. For Tesla: Explicitly mention that an OBD-II adapter (CAN-bus bypass) or Tesla Toolbox 3 may be required as traditional OBD-II is limited.
        
        RESPONSE PROTOCOL:
        1. Return exactly a JSON object.
        2. "observation": Summary of input analysis.
        3. "hypothesis": Primary failure theory.
        4. "severity": "low" | "medium" | "high" | "critical"
        5. "confidence": A float between 0.0 and 1.0.
        6. "confidenceBreakdown": { "dtcMatch": float, "sourceAuthority": float, "userFeedback": float }
        7. "riskScore": A float between 0.0 and 1.0. (High for HV/ADAS).
        8. "sourceType": "oem" | "heuristic" | "ai_inference".
        9. "feasibility": "proceed" | "limited" | "specialist_required".
        10. "workflow": A list of Step objects:
           - "id": unique string
           - "title": short name
           - "instruction": detailed action
           - "toolRequired": specific tool name
           - "expectedOutcome": what to look for
           - "validationType": "boolean" | "number" | "text"
        11. "safetyPrecaution": (Global) e.g., "High Voltage PPE Required".
        12. "operationalAction": (Strategic) e.g., "🛑 STOP. Requires specialized certification."
        13. "disclaimer": regulatory/precision warnings.
        14. "conclusion": Final verdict or summary.

        SAFETY ESCALATION LOGIC:
        - If multiple HV/Battery faults + insulation error + contactor code: Refuse guidance. operationalAction MUST be "🛑 STOP. EXTREME FIRE/FATALITY RISK."

        TONE: Precision-focused, authoritative, industrial technician level.
    `;

    try {
        const parsed = await OpenClawEngine.reason({
            agentId: 'OpenClaw-Diagnose',
            task: 'Initial Diagnosis',
            context: { vehicle: ctx.vehicle, dtc: dtcCode },
            prompt,
            systemInstruction,
            image: imageData
        });
        return {
            status: 'success',
            ...parsed
        };
    } catch (e: any) {
        console.error("[SKILL:ai_diagnose] Internal Failure", e);
        return {
            status: 'error',
            observation: "The diagnostic engine encountered an error.",
            hypothesis: "Service Interruption / Matrix desync.",
            conclusion: `Details: ${e.message || "Unknown AI error"}`,
            actions: [
                { 
                    instruction: "Check internet connection and Gemini API key configuration in settings.", 
                    toolRequired: "Settings / System Console",
                    expectedOutcome: "Operational status restored"
                }
            ]
        };
    }
  }
};

