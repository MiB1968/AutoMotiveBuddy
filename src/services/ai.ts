import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

export const getAI = () => {
  if (!ai && apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export async function generateDynamicVehicleData(type: 'fuses' | 'components' | 'warning_lights', manufacturer: string, modelStr: string, year: string, engine: string) {
  const genAI = getAI();
  if (!genAI) throw new Error("AI not configured");

  const model = "gemini-3-flash-preview";
  let systemPrompt = "";

  if (type === 'fuses') {
    systemPrompt = `You are a professional automotive electrician. Provide a detailed summary of the main fuse boxes (Engine Bay and Interior/Passenger Compartment), relay locations, and critical fuse diagrams for the ${year} ${manufacturer} ${modelStr} (${engine}). Format your response in clean Markdown with tables for the fuse numbers, amp ratings, and descriptions.`;
  } else if (type === 'components') {
    systemPrompt = `You are a master mechanic. Provide a detailed guide on component locations for the ${year} ${manufacturer} ${modelStr} (${engine}). Include exact locations for: OBD2 port, battery, main engine computer (ECU/PCM), starter motor, alternator, oxygen sensors, mass airflow sensor, and oil/air/cabin filters. Format your response in clean Markdown.`;
  } else if (type === 'warning_lights') {
    systemPrompt = `You are an expert automotive diagnostician. Provide a detailed guide on the dashboard warning lights for the ${year} ${manufacturer} ${modelStr}. Categorize them by severity (Red = Stop ASAP, Yellow = Check soon, Green/Blue = Informational). Describe what each light looks like, what it means, and recommended actions. Format your response in clean Markdown.`;
  }

  try {
    const chat = genAI.chats.create({
      model: model,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3, // Lower temp for more factual/consistent output
      }
    });

    const response = await chat.sendMessage({ message: `I need the ${type} data for a ${year} ${manufacturer} ${modelStr} with engine ${engine}.` });
    return response.text || "No data available at this time. Please expand search parameters.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Unable to retrieve vehicle dataset from cloud neural matrix.");
  }
}

export async function askAutomotiveAssistant(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const genAI = getAI();
  if (!genAI) throw new Error("AI not configured");

  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant.
Your goal is to help users identify engine codes (DTCs), explain symptoms, and suggest solutions.
Be professional, technical yet accessible, and always prioritize safety.
Owner: Ruben Llego.
Greeting: "Hello! I'm your AutoMotive Buddy. How can I help with your vehicle today?"

ADDITIONAL CONTEXT ABOUT AUTOMOTIVE-AI:
You also provide support for the Automotive AI open-source project (Voice Activated Vehicle Diagnostic Assistant 🚗🗣️), available at: https://github.com/Eloquent-Algorithmics/Automotive-AI
Here is information about the app:
It's an experimental application that integrates OpenAi (gpt-3.5-turbo-0125 or gpt-4-turbo), API, NLP, TTS, STT, and an OBD-II ELM327 device to create a voice-activated, hands-free vehicle diagnostic assistant.
Built and tested on Windows 11 & Ubuntu 22.04 using Python 3.12 and requires Miniconda.
Supported hardware: OBDlink MX+ Bluetooth ELM327 or ELM327 emulator for desktop testing.

Voice Commands Include:
- "engine rpm", "intake air temperature", "fuel tank level", "engine coolant temperature"
- "start a diagnostic report", "read trouble codes", "freeze frame data", "clear trouble codes"
- "start a conversation" (for JSON conversation history)
- "ask question", "check outlook", "check gmail", etc.

KNOWLEDGE DOMAINS:
You have comprehensive knowledge of automotive diagnostics and repair, similar to databases like StartMyCar and manual guides.
You can help users with:
- Fuse Box Diagrams and Relay Locations
- Dashboard Warning Lights meanings and solutions
- OBD2 / DTC Fault Codes troubleshooting
- Maintenance schedules and DIY repair advice
- Component locations (OBD port, filters, sensors)

Use this knowledge to help users inquiring about the Automotive AI project, installation, voice commands, or general troubleshooting.`;

  try {
    const chat = genAI.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history,
    });

    const response = await chat.sendMessage({ message: prompt });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting to my diagnostics database. Please try again later.";
  }
}
