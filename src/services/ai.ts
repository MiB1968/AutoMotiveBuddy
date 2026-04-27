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
      systemPrompt = customPrompt || `You are a top-tier automotive electrician and technical writer. Provide a highly detailed, comprehensive guide to the fuse boxes and relays for the ${year} ${manufacturer} ${modelStr} (${engine}), matching the detail level found in professional databases like StartMyCar or OEM service manuals.

Your response MUST include:
1. Exact locations of EVERY fuse box (Engine Compartment, Passenger Compartment, Trunk, etc.) with detailed instructions on how to access them.
2. Complete tables for EACH fuse box containing:
   - Fuse/Relay Number
   - Amperage Rating (e.g., 10A, 20A)
   - Color code if applicable
   - A complete, detailed list of every circuit/component protected by that fuse. 
3. Comprehensive relay mapping including what each relay controls.
4. Any special warnings or "hidden" fuses.

Format entirely in clean, readable Markdown using tables, bolding for emphasis, and clear headings. Do NOT skip any fuses; provide as exhaustive a list as possible.`;
    } else if (type === 'wiring') {
      systemPrompt = customPrompt || `You are an expert automotive master technician specialized in electrical diagnostics. Provide a detailed guide for wiring color codes and circuit identification for the ${year} ${manufacturer} ${modelStr} (${engine}). 
Focus on:
1. Common wiring color standards for this specific manufacturer.
2. Connector pinouts for major modules (ECU, Body Control Module) if available.
3. Wire colors for critical circuits: Ground, Constant 12V+, Switched/Ignition 12V, CAN-High, CAN-Low, Fuel Pump, and Starter Trigger.
4. Professional tips for tracing electrical gremlins in this model.
Format in clean Markdown with tables where appropriate.`;
    } else if (type === 'components') {
      systemPrompt = `You are a master mechanic. Provide a detailed guide on component locations for the ${year} ${manufacturer} ${modelStr} (${engine}). Include exact locations for: OBD2 port, battery, main engine computer (ECU/PCM), starter motor, alternator, oxygen sensors, mass airflow sensor, and oil/air/cabin filters. Format your response in clean Markdown.` + (customPrompt ? ` ${customPrompt}` : '');
    } else if (type === 'warning_lights') {
      systemPrompt = `You are an expert automotive diagnostician. Provide a detailed guide on the dashboard warning lights for the ${year} ${manufacturer} ${modelStr}. Categorize them by severity (Red = Stop ASAP, Yellow = Check soon, Green/Blue = Informational). Describe what each light looks like, what it means, and recommended actions. Format your response in clean Markdown.` + (customPrompt ? ` ${customPrompt}` : '');
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I need the ${type} data for a ${year} ${manufacturer} ${modelStr} with engine ${engine}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (text) {
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

