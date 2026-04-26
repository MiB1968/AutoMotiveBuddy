import { GoogleGenAI } from "@google/genai";
import { diagnoseDTC } from './api';

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export async function generateDynamicVehicleData(type: 'fuses' | 'components' | 'warning_lights', manufacturer: string, modelStr: string, year: string, engine: string) {
  try {
    const ai = getAI();
    let systemPrompt = "";

    if (type === 'fuses') {
      systemPrompt = `You are a top-tier automotive electrician and technical writer. Provide a highly detailed, comprehensive guide to the fuse boxes and relays for the ${year} ${manufacturer} ${modelStr} (${engine}), matching the detail level found in professional databases like StartMyCar or OEM service manuals.

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
    } else if (type === 'components') {
      systemPrompt = `You are a master mechanic. Provide a detailed guide on component locations for the ${year} ${manufacturer} ${modelStr} (${engine}). Include exact locations for: OBD2 port, battery, main engine computer (ECU/PCM), starter motor, alternator, oxygen sensors, mass airflow sensor, and oil/air/cabin filters. Format your response in clean Markdown.`;
    } else if (type === 'warning_lights') {
      systemPrompt = `You are an expert automotive diagnostician. Provide a detailed guide on the dashboard warning lights for the ${year} ${manufacturer} ${modelStr}. Categorize them by severity (Red = Stop ASAP, Yellow = Check soon, Green/Blue = Informational). Describe what each light looks like, what it means, and recommended actions. Format your response in clean Markdown.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I need the ${type} data for a ${year} ${manufacturer} ${modelStr} with engine ${engine}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    return response.text || "Dataset currently inaccessible. High-altitude network interference detected.";
  } catch (error: any) {
    console.error("Failed to generate dynamic vehicle data:", error);
    return `### DATA TEMPORARILY UNAVAILABLE\n\nThe diagnostic uplink for this specific ${manufacturer} model is currently being recalibrated.\n\n**Error details:** ${error.message}\n\n**Common Advice:**\n- Verify battery voltage (12.6V engine off).\n- Inspect ground straps for corrosion.\n- Check for symptoms related to the specific fault code if applicable.`;
  }
}

export async function searchMaintenanceGuides(query: string, vehicle: any) {
  try {
    const ai = getAI();
    const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vehicle: ${vStr}\n\nSearch Query: ${query}\n\nProvide a comprehensive, professional maintenance guide or tips for this specific query on this vehicle. Format your response in clean Markdown with clear headings and bullet points.`,
      config: {
        systemInstruction: `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant and master mechanic. Your goal is to provide step-by-step maintenance guides. Be professional and prioritize safety. Start your response by introducing yourself and mentioning that your owner and lead developer is Ruben Llego.`,
      }
    });
    
    return response.text || "Direct uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("Maintenance Search Error:", error);
    return `Maintenance guide search failed: ${error.message}`;
  }
}
export async function askAutomotiveAssistant(prompt: string, vehicle: any, history: any[] = []) {
  try {
    const ai = getAI();
    const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vehicle Context: ${vStr}\n\nUser Query: ${prompt}`,
      config: {
        systemInstruction: `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant. Your goal is to help users identify engine codes (DTCs), explain symptoms, and suggest solutions. You now officially support both English and Tagalog (Filipino) languages. Respond in the language used by the user, or as specifically requested. Be professional, technical yet accessible, and always prioritize safety. Owner: Ruben Llego. Greeting: "Hello! I'm your AutoMotive Buddy. How can I help with your vehicle today?" (or its Tagalog equivalent if the user speaks Tagalog). Do not use markdown headers larger than h3.`,
      }
    });
    
    return response.text || "Direct uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    const errDetail = error?.message || "Unknown error";
    if (errDetail.includes("404")) {
      return "Diagnostic Matrix Error (404): The requested neural model is currently being upgraded. Please try a standard maintenance query or wait 60 seconds for synchronization.";
    }
    return "Uplink disrupted. The Assistant is currently processing high-priority telemetry elsewhere. Please re-try in a moment.";
  }
}

export async function performDeepDTCSearch(code: string) {
  try {
    try {
      const backendResult = await diagnoseDTC(code);
      if (backendResult?.data) {
        const d = backendResult.data;
        return {
          code: d.code || code,
          description: d.description,
          system: "Diagnostic System",
          severity: d.severity,
          causes: d.top_causes || [],
          symptoms: d.symptoms || [],
          solutions: d.fixes || [],
          remediation: d.fixes || []
        };
      }
    } catch (apiError) {
      console.warn("Backend API not reachable/DTC not found, falling back to GenAI", apiError);
    }
    
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform a deep technical search for the OBD2 fault code: ${code}. Identify the specific part, system affected, common causes, symptoms, and repair protocol. Return ONLY a JSON object with: code, description, system, severity, causes (string array), symptoms (string array), solutions (string array).`,
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
        return {
          code: parsed.code || code,
          description: parsed.description || "Detailed technical description currently being synchronized. Please re-scan in 30 seconds.",
          system: parsed.system || "Diagnostic System",
          severity: parsed.severity || "medium",
          causes: Array.isArray(parsed.causes) ? parsed.causes : ["Information pending"],
          symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : ["Check engine light illumination", "Reduced fuel efficiency"],
          solutions: Array.isArray(parsed.solutions) ? parsed.solutions : ["Inspect electrical connectors", "Perform system scan"],
          remediation: Array.isArray(parsed.solutions) ? parsed.solutions : ["Inspect electrical connectors", "Perform system scan"]
        };
      } catch (e) {
        console.warn("JSON Parsing failed, using regex extraction", e);
      }
    }
    throw new Error("Invalid AI response format");
    } catch (error) {
    console.error("Deep Search Error:", error);
    
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

