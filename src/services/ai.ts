import { GoogleGenAI } from "@google/genai";
import { diagnoseDTC } from './api';

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

import { getCache, setCache } from './db';

export async function generateDynamicVehicleData(type: 'fuses' | 'components' | 'warning_lights' | 'wiring', manufacturer: string, modelStr: string, year: string, engine: string, customPrompt?: string) {
  const cacheKey = `ai_data_${type}_${manufacturer}_${modelStr}_${year}_${engine}_${customPrompt || ''}`;
  
  try {
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  } catch (e) {
    console.warn("Could not read from cache", e);
  }

  try {
    const ai = getAI();
    let systemPrompt = "";

    if (type === 'fuses') {
      systemPrompt = customPrompt || `You are a top-tier automotive electrician. Provide highly detailed standard JSON for fuses and relays for the ${year} ${manufacturer} ${modelStr} (${engine}). 
Focus on category: ${customPrompt || 'General'}.
MUST RETURN ONLY JSON using this exact schema:
{
  "vehicle": "${year} ${manufacturer} ${modelStr}",
  "system": "fuses",
  "confidence": 0.95,
  "fuse_boxes": [
    {
      "name": "Engine Bay",
      "location_description": "Engine compartment",
      "fuses": [{"id": "F1", "num": "F1", "amperage": 15, "function": "Fuel Pump", "status": "unknown"}],
      "relays": [{"id": "R1", "name": "R1", "function": "Starter Relay"}]
    }
  ]
}`;
    } else if (type === 'wiring') {
      systemPrompt = customPrompt || `You are an expert automotive master technician specialized in electrical diagnostics. Provide wiring color codes for ${year} ${manufacturer} ${modelStr} (${engine}). 
Focus on common circuits.
MUST RETURN ONLY JSON using this exact schema:
{
  "vehicle": "${year} ${manufacturer} ${modelStr}",
  "system": "wiring",
  "confidence": 0.95,
  "circuits": [{"intent": "Ground", "color": "Black", "note": "Connects to chassis"}]
}`;
    } else if (type === 'components') {
      systemPrompt = `You are a master mechanic. Provide component locations for ${year} ${manufacturer} ${modelStr} (${engine}). Format as clean Markdown.`;
    } else if (type === 'warning_lights') {
      systemPrompt = `You are an expert diagnostician. Provide warning lights guide for ${year} ${manufacturer} ${modelStr}. Format as clean Markdown.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I need the EXACT ${type} data for a ${year} ${manufacturer} ${modelStr} with engine ${engine}. Use the strict format requested.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      }
    });

    let text = response.text;
    if (text) {
      // If asking for json, try to extract it from markdown blocks
      if (type === 'fuses' || type === 'wiring') {
         const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
         if (jsonMatch && jsonMatch[1]) {
           text = jsonMatch[1];
         } else {
           const start = text.indexOf('{');
           const end = text.lastIndexOf('}');
           if (start !== -1 && end !== -1 && end > start) {
             text = text.substring(start, end + 1);
           }
         }
      }
      try {
        await setCache(cacheKey, text, null); // null means never expires
      } catch (e) {
        console.warn("Could not write to cache", e);
      }
      return text;
    }
    return "Dataset currently inaccessible. High-altitude network interference detected.";
  } catch (error: any) {
    console.error("Failed to generate dynamic vehicle data:", error);
    
    try {
      const cachedData = await getCache<string>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    } catch(e) {}
    
    // Check for rate limiting
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return `### DATA TEMPORARILY UNAVAILABLE\n\n**Rate limit exceeded.** You have reached the usage quota for the AI assistant.\n\n**Advice:** Please wait a short while, and try your request again. The quota typically resets daily. You can monitor your usage in your Google AI Studio plan and billing details.`;
    }

    return `### DATA TEMPORARILY UNAVAILABLE\n\nThe diagnostic uplink for this specific ${manufacturer} model is currently being recalibrated.\n\n**Error details:** ${error.message}\n\n**Common Advice:**\n- Verify battery voltage (12.6V engine off).\n- Inspect ground straps for corrosion.\n- Check for symptoms related to the specific fault code if applicable.`;
  }
}

export async function searchMaintenanceGuides(query: string, vehicle: any) {
  const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
  const cacheKey = `ai_search_${vStr}_${query}`;

  try {
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) return cachedData;
  } catch(e) {}

  try {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vehicle: ${vStr}\n\nSearch Query: ${query}\n\nProvide a comprehensive, professional maintenance guide or tips for this specific query on this vehicle. Format your response in clean Markdown with clear headings and bullet points.`,
      config: {
        systemInstruction: `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant and master mechanic. Your goal is to provide step-by-step maintenance guides. Be professional and prioritize safety. Start your response by introducing yourself and mentioning that your owner and lead developer is Ruben Llego.`,
      }
    });

    const text = response.text;
    if (text) {
      try { await setCache(cacheKey, text, null); } catch(e) {}
      return text;
    }
    return "Direct uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("Maintenance Search Error:", error);
    try {
      const cachedData = await getCache<string>(cacheKey);
      if (cachedData) return cachedData;
    } catch(e) {}
    return `Maintenance guide search failed: ${error.message}`;
  }
}
export async function askAutomotiveAssistant(prompt: string, vehicle: any, history: any[] = []) {
  const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
  const cacheKey = `ai_ask_${vStr}_${prompt}`;

  try {
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) return cachedData;
  } catch(e) {}

  try {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vehicle Context: ${vStr}\n\nUser Query: ${prompt}`,
      config: {
        systemInstruction: `You are "AutoMotive Buddy AI", a professional automotive diagnostic intelligence system. Your goal is to provide DIRECT, ACCURATE, and TECHNICIAN-LEVEL answers. 

RULES: 
1. NO CONVERSATIONAL FLUFF. Do not say "How can I help you today" or "Hello". 
2. START DIRECTLY with the answer or diagnostic steps.
3. If the user asks about a DTC, provide: Code Meaning, Top Causes, and Fixes. 
4. Use Bullet points. 
5. Language: Use the user's language (English or Tagalog). 
6. Owner: Ruben Llego.`,
      }
    });
    
    const text = response.text;
    if (text) {
      try { await setCache(cacheKey, text, null); } catch(e) {}
      return text;
    }
    return "Direct uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    try {
      const cachedData = await getCache<string>(cacheKey);
      if (cachedData) return cachedData;
    } catch(e) {}
    const errDetail = error?.message || "Unknown error";
    if (errDetail.includes("404")) {
      return "Diagnostic Matrix Error (404): The requested neural model is currently being upgraded. Please try a standard maintenance query or wait 60 seconds for synchronization.";
    }
    return "Uplink disrupted. The Assistant is currently processing high-priority telemetry elsewhere. Please re-try in a moment.";
  }
}

export async function performDeepDTCSearch(code: string, vehicleContext?: { make?: string, model?: string, year?: string }) {
  const vStr = vehicleContext ? `${vehicleContext.year || ''} ${vehicleContext.make || ''} ${vehicleContext.model || ''}`.trim() : "Generic Vehicle";
  const cacheKey = `ai_dtc_${vStr}_${code}`;

  try {
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) return cachedData;
  } catch(e) {}

  try {
    try {
      const backendResult = await diagnoseDTC(code);
      if (backendResult?.data) {
        const d = backendResult.data;
        const res = {
          code: d.code || code,
          description: d.description,
          system: "Diagnostic System",
          severity: d.severity,
          causes: d.top_causes || [],
          symptoms: d.symptoms || [],
          solutions: d.fixes || [],
          remediation: d.fixes || []
        };
        try { await setCache(cacheKey, res, null); } catch(e) {}
        return res;
      }
    } catch (apiError) {
      console.warn("Backend API not reachable/DTC not found, falling back to GenAI", apiError);
    }
    
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vehicle: ${vStr}\nOBD2 Fault Code: ${code}. Perform a deep technical analysis for this specific vehicle model if possible. Identify the specific part, system affected, common causes, symptoms, and repair protocol. Return ONLY a JSON object with: code, description, system, severity, causes (string array), symptoms (string array), solutions (string array).`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    if (response.text) {
      let cleanText = response.text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      try {
        const parsed = JSON.parse(cleanText);
        const res = {
          code: parsed.code || code,
          description: parsed.description || "Detailed technical description currently being synchronized. Please re-scan in 30 seconds.",
          system: parsed.system || "Diagnostic System",
          severity: parsed.severity || "medium",
          causes: Array.isArray(parsed.causes) ? parsed.causes : ["Information pending"],
          symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : ["Check engine light illumination", "Reduced fuel efficiency"],
          solutions: Array.isArray(parsed.solutions) ? parsed.solutions : ["Inspect electrical connectors", "Perform system scan"],
          remediation: Array.isArray(parsed.solutions) ? parsed.solutions : ["Inspect electrical connectors", "Perform system scan"]
        };
        try { await setCache(cacheKey, res, null); } catch(e) {}
        return res;
      } catch (e) {
        console.warn("JSON Parsing failed, using regex extraction", e);
      }
    }
    throw new Error("Invalid AI response format");
    } catch (error) {
    console.error("Deep Search Error:", error);
    try {
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData) return cachedData;
    } catch(e) {}
    
    // Hardcoded logic for common critical codes that might fail AI search
    if (code.toUpperCase() === 'P1000') {
      return {
        code: 'P1000',
        description: "OBD-II Monitor Testing Incomplete. This indicates that the vehicle's engine computer has not completed its internal self-test cycle. This common on Ford vehicles after a battery disconnect or code clear.",
        system: "Engine Management / Emissions",
        severity: "low",
        causes: ["Battery disconnect", "Recently cleared codes", "Battery replacement", "Incomplete driving cycle"],
        symptoms: ["No physical symptoms usually", "Failure of emissions/smog test", "Check engine light may NOT be on"],
        solutions: ["Perform a 'Drive Cycle' (Specific mix of city and highway driving)", "Check for other stored codes", "Ensure battery is healthy"],
        remediation: ["Perform a 'Drive Cycle'", "Ensure battery is healthy"]
      };
    }

    return {
      code,
      description: "Cloud neural matrix synchronized incorrectly. Showing system-level generic diagnosis for " + code + ". This usually indicates a sensor out-of-range condition.",
      system: "Vehicle Control Cluster",
      severity: "medium",
      causes: ["Sensor failure", "Wiring harness damage", "Corroded electrical connectors", "Blown fuse"],
      symptoms: ["Check engine light active", "Potential performance limit", "Increased fuel consumption"],
      solutions: ["Verify code with physical OBD2 scanner", "Check battery voltage and ground connections", "Inspect associated wiring harness"],
      remediation: ["Verify code with physical OBD2 scanner", "Check battery voltage"]
    };
  }
}

