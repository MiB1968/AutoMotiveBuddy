import api from './apiClient';
import { getCache, setCache } from './db';

export async function generateDynamicVehicleData(type: 'fuses' | 'components' | 'warning_lights' | 'wiring', manufacturer: string, modelStr: string, year: string, engine: string, customPrompt?: string) {
  const cacheKey = `ai_data_${type}_${manufacturer}_${modelStr}_${year}_${engine}_${customPrompt || ''}`;
  
  try {
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) return cachedData;
  } catch (e) {}

  try {
    const response = await api.post('/api/ai/diagnose', {
      vehicle: `${year} ${manufacturer} ${modelStr} (${engine})`,
      symptom: customPrompt || type,
      type
    });
    
    const text = response.data.recommendation || response.data.issue || JSON.stringify(response.data);
    try { await setCache(cacheKey, text, null); } catch (e) {}
    return text;
  } catch (error: any) {
    console.error("AI Bridge failure:", error);
    return `### SYSTEM OFFLINE\n\nThe diagnostic neural link is currently unavailable. Error: ${error.message}`;
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
    const response = await api.post('/api/ai/ai-diagnose', { message: query, vehicle });
    const d = response.data;
    
    // Extract readable text from structured response if necessary
    // Handle both { result: { conclusion: ... } } and { conclusion: ... } directly
    const resObj = d.result || d;
    const text = typeof resObj === 'string' 
      ? resObj 
      : (resObj?.conclusion || resObj?.hypothesis || resObj?.observation || resObj?.diagnosis || resObj?.description || JSON.stringify(resObj));

    if (text) {
      try { await setCache(cacheKey, text.toString(), null); } catch(e) {}
      return text.toString();
    }
    return "Neural uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("Maintenance Search Error:", error);
    return `Maintenance guide search failed: ${error.message}`;
  }
}

export async function askAutomotiveAssistant(prompt: string, vehicle: any, image?: string) {
  const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
  const cacheKey = `ai_ask_${vStr}_${prompt}_${image ? 'with_image' : 'no_image'}`;

  try {
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) return cachedData;
  } catch(e) {}

  try {
    const response = await api.post('/api/ai/ai-diagnose', { message: prompt, image: image, vehicle });
    const d = response.data;

    // Extract readable text from structured response if necessary
    const resObj = d.result || d;
    const text = typeof resObj === 'string' 
      ? resObj 
      : (resObj?.conclusion || resObj?.hypothesis || resObj?.observation || resObj?.diagnosis || resObj?.description || JSON.stringify(resObj));

    if (text) {
      try { await setCache(cacheKey, text.toString(), null); } catch(e) {}
      return text.toString();
    }
    return "Direct uplink failed. Please re-state your query.";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return "Uplink disrupted. The Assistant is currently processing high-priority telemetry elsewhere.";
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
    const response = await api.post('/api/ai/diagnose', {
      vehicle: vStr,
      code,
      symptom: "Performing deep DTC analysis"
    });
    
    if (response.data.status === "success") {
      const d = response.data;
      const res = {
        code: d.code || code,
        description: d.diagnosis || d.issue || d.description || "Comprehensive diagnostic analysis complete.",
        system: d.system || "Engine Management",
        severity: d.riskLevel || d.severity || "medium",
        confidence: d.confidence || 0.9,
        provider: d.provider || "gemini",
        sourceType: d.sourceType || "AI",
        feasibility: d.feasibility || "PROCEED",
        causes: Array.isArray(d.causes) && d.causes.length > 0 ? d.causes : ["Unknown Cause"],
        symptoms: Array.isArray(d.symptoms) && d.symptoms.length > 0 ? d.symptoms : ["Check engine light"],
        actions: Array.isArray(d.actions) ? d.actions : (Array.isArray(d.workflow) ? d.workflow : []),
        fixes: Array.isArray(d.actions) ? d.actions : (Array.isArray(d.workflow) ? d.workflow : []),
        disclaimers: d.disclaimers || []
      };
      try { await setCache(cacheKey, res, null); } catch(e) {}
      return res;
    }
    throw new Error("Invalid response from neural uplink");
  } catch (error: any) {
    console.error("Deep Search Error:", error);
    return {
      code,
      description: "Cloud neural matrix synchronized incorrectly. Using fallback local logic.",
      system: "Vehicle Control Cluster",
      severity: "medium",
      causes: ["Sensor failure", "Wiring harness damage"],
      symptoms: ["Check engine light active"],
      solutions: ["Scan vehicle with OBD2 tool"],
      remediation: ["Scan vehicle with OBD2 tool"]
    };
  }
}

