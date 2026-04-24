import { GoogleGenAI } from "@google/genai";

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
      model: "gemini-1.5-flash",
      contents: `I need the ${type} data for a ${year} ${manufacturer} ${modelStr} with engine ${engine}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    return response.text;
  } catch (error) {
    console.error("Failed to generate dynamic vehicle data:", error);
    throw new Error("Unable to retrieve vehicle dataset from cloud neural matrix.");
  }
}

export async function askAutomotiveAssistant(prompt: string, vehicle: any, history: any[] = []) {
  try {
    const ai = getAI();
    const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Vehicle Context: ${vStr}\n\nUser Query: ${prompt}`,
      config: {
        systemInstruction: `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant. Your goal is to help users identify engine codes (DTCs), explain symptoms, and suggest solutions. Be professional, technical yet accessible, and always prioritize safety. Owner: Ruben Llego. Greeting: "Hello! I'm your AutoMotive Buddy. How can I help with your vehicle today?" Do not use markdown headers larger than h3.`,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Unable to reach the diagnostic cloud matrix.");
  }
}

export async function performDeepDTCSearch(code: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Perform a deep technical search for the OBD2 fault code: ${code}. Identify the specific part, system affected, common symptoms, and repair protocol. Return ONLY a JSON object with: code, description, system, severity, symptoms (string array), solutions (string array).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    if (response.text) {
      let cleanText = response.text;
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0];
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0];
      }
      return JSON.parse(cleanText.trim());
    }
    throw new Error("No response text from AI Search");
  } catch (error) {
    console.error("Deep Search Error:", error);
    throw error;
  }
}

