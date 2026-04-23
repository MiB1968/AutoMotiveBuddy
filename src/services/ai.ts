import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

export const getAI = () => {
  if (!ai && apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export async function askAutomotiveAssistant(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const genAI = getAI();
  if (!genAI) throw new Error("AI not configured");

  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant.
Your goal is to help users identify engine codes (DTCs), explain symptoms, and suggest solutions.
Be professional, technical yet accessible, and always prioritize safety.
Owner: Ruben Llego.
Greeting: "Hello! I'm your AutoMotive Buddy. How can I help with your vehicle today?"`;

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
