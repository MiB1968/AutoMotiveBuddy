import { ModelRouter } from '../router/modelRouter';
import { DTCKnowledge } from '../rag/engine';

export class SymptomAnalyzerAgent {
  private router: ModelRouter;

  constructor(router: ModelRouter) {
    this.router = router;
  }

  async run(symptoms: string, vehicleInfo: any, context: DTCKnowledge[]) {
    const contextStr = context.map(c => `[Code: ${c.code}] ${c.description}. Likely causes: ${c.causes.join(', ')}`).join('\n');
    
    const prompt = `
      OPENCLAW AI STACK v2 - SYMPTOM ANALYZER AGENT
      
      VEHICLE: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}
      USER SYMPTOMS: "${symptoms}"
      
      TECHNICAL KNOWLEDGE BASE (RAG):
      ${contextStr}
      
      TASK:
      Analyze the symptoms against the technical knowledge.
      Identify the most likely DTC codes that match these symptoms.
      Provide a breakdown of the suspected subsystem (Engine, Transmission, etc.).
      
      FILTERING RULE: If no clear match is found, focus on the most dangerous possibility.
      
      RETURN FORMAT: JSON
      {
        "suspected_codes": ["P0300", ...],
        "subsystem": "string",
        "reasoning": "string",
        "initial_confidence": 0.0-1.0
      }
    `;

    const response = await this.router.route(prompt, 'low');
    try {
      // Extract JSON from markdown if needed
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response;
      return JSON.parse(jsonStr);
    } catch (e) {
      return { suspected_codes: [], subsystem: "Unknown", reasoning: response, initial_confidence: 0.5 };
    }
  }
}
