import api from './api';

export async function generateDynamicVehicleData(type: 'fuses' | 'components' | 'warning_lights', manufacturer: string, modelStr: string, year: string, engine: string) {
  try {
    const res = await api.post('/ai/generate', {
      type,
      make: manufacturer,
      modelStr,
      year,
      engine
    });
    return res.data.result;
  } catch (error) {
    console.error("Failed to generate dynamic vehicle data:", error);
    throw new Error("Unable to retrieve vehicle dataset from cloud neural matrix.");
  }
}

export async function askAutomotiveAssistant(prompt: string, history: any[] = []) {
  try {
    const res = await api.post('/ai/diagnose', {
      query: prompt
    });
    return res.data.answer;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Unable to reach the diagnostic cloud matrix.");
  }
}

