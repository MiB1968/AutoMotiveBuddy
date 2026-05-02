import { ModelRouter } from './router/modelRouter';
import { RAGEngine } from './rag/engine';
import { SymptomAnalyzerAgent } from './agents/symptomAnalyzer';

export interface OpenClawResult {
  diagnosis: string;
  likely_causes: string[];
  confidence: number;
  recommended_fix: string;
  estimated_cost: string;
  subsystem: string;
  agent_logs: any[];
}

export class AgentOrchestrator {
  private router: ModelRouter;
  private rag: RAGEngine;
  private symptomAgent: SymptomAnalyzerAgent;

  constructor() {
    this.router = new ModelRouter();
    this.rag = new RAGEngine();
    this.symptomAgent = new SymptomAnalyzerAgent(this.router);
  }

  async diagnose(message: string, vehicle: any): Promise<OpenClawResult> {
    const logs: any[] = [];
    
    // 1. RAG Retrieval
    logs.push({ step: "RAG", message: "Scanning Neural Registry for technical matches..." });
    const context = await this.rag.retrieve(message);
    if (context.length > 0) {
      logs.push({ step: "RAG_SUCCESS", message: `Registry found ${context.length} relevant protocols (${context.map(c => c.code).join(', ')}).` });
    } else {
      logs.push({ step: "RAG_EMPTY", message: "No exact registry match. Falling back to semantic reasoning matrix." });
    }
    
    // 2. Symptom Analysis Agent
    logs.push({ step: "AGENT_SYMPTOM", message: "Symptom Agent analyzing physical failure signatures..." });
    const analysis = await this.symptomAgent.run(message, vehicle, context);
    logs.push({ step: "AGENT_SYMPTOM_RESULT", message: `Agent hypothesis: Suspected subsystem is ${analysis.subsystem}.` });

    // 3. Root Cause Agent (Deep Reasoning)
    logs.push({ step: "AGENT_ROOT_CAUSE", message: "Root Cause Agent cross-referencing telemetry with known fail-states..." });
    const rootCausePrompt = `
      OPENCLAW AI STACK v2 - ROOT CAUSE AGENT
      
      VEHICLE: ${vehicle.year} ${vehicle.make} ${vehicle.model}
      SYMPTOMS: "${message}"
      CONTEXT: ${JSON.stringify(context)}
      INITIAL ANALYSIS: ${JSON.stringify(analysis)}
      
      TASK: 
      Perform a deep dive into why this specific failure is occurring. 
      Consider secondary symptoms and cross-system interference.
      
      RETURN FORMAT: JSON
      {
        "primary_fault": "string",
        "causality_chain": "string",
        "severity_level": "low|medium|high|critical"
      }
    `;

    const rootCauseRaw = await this.router.route(rootCausePrompt, 'high');
    let rootCause: any;
    try {
      const jsonStr = rootCauseRaw.match(/\{[\s\S]*\}/)?.[0] || rootCauseRaw;
      rootCause = JSON.parse(jsonStr);
      logs.push({ step: "AGENT_ROOT_CAUSE_RESULT", message: `Causality identified: ${rootCause.primary_fault}.` });
    } catch (e) {
      rootCause = { primary_fault: analysis.reasoning, causality_chain: "Direct Symptom Match", severity_level: "medium" };
    }

    // 4. Final Verdict Agent (Reasoning Stage)
    logs.push({ step: "AGENT_VERDICT", message: "Repair Advisor Agent synthesizing final procedural path..." });
    const verdictPrompt = `
      OPENCLAW AI STACK v2 - REPAIR ADVISOR ORCHESTRATOR
      
      VEHICLE: ${vehicle.year} ${vehicle.make} ${vehicle.model}
      SYMPTOMS: ${message}
      ROOT CAUSE: ${JSON.stringify(rootCause)}
      TECHNICAL DATA: ${JSON.stringify(context)}
      
      TASK: 
      Generate a final diagnostic verdict and actionable repair plan.
      
      REQUIREMENTS:
      - Calculate a confidence score (0.0-1.0) based on data density.
      - Estimate cost in USD range ($X-$Y).
      - Provide a "Neural Verdict" (a concise summary).
      
      RETURN FORMAT: JSON
      {
        "issue": "string",
        "likely_causes": ["string"],
        "confidence": 0.0-1.0,
        "recommended_fix": "string",
        "estimated_cost": "$X-$Y"
      }
    `;

    const verdictRaw = await this.router.route(verdictPrompt, 'high');
    let verdict: any;
    try {
      const jsonStr = verdictRaw.match(/\{[\s\S]*\}/)?.[0] || verdictRaw;
      verdict = JSON.parse(jsonStr);
    } catch (e) {
      verdict = { 
        issue: "Analysis Complete", 
        likely_causes: context.flatMap(c => c.causes), 
        confidence: 0.6, 
        recommended_fix: "Manual inspection required.", 
        estimated_cost: "Varies" 
      };
    }

    return {
      diagnosis: verdict.issue,
      likely_causes: verdict.likely_causes,
      confidence: verdict.confidence,
      recommended_fix: verdict.recommended_fix,
      estimated_cost: verdict.estimated_cost,
      subsystem: analysis.subsystem || "Unknown",
      agent_logs: logs
    };
  }
}
