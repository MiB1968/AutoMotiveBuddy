
import { OpenClawEngine } from '../../services/openClawService';
import { Skill } from '../../runtime/types';

export const processTestResultSkill: Skill<{ 
    previousContext: string, 
    testAction: string, 
    result: 'normal' | 'abnormal' | 'not_sure' 
}, any> = {
  name: "process_test_result",
  description: "Evaluate the result of a diagnostic test and determine the next logical step",
  schema: {
    input: { 
        previousContext: "string (summary of previous diagnosis)", 
        testAction: "string (the instruction that was followed)", 
        result: "string (normal | abnormal | not_sure)" 
    },
    output: { 
        hypothesis: "string (refined theory)", 
        actions: "DiagnosticAction[]", 
        confidence_delta: "number" 
    }
  },
  async execute({ previousContext, testAction, result }, ctx) {
    const prompt = `
        PREVIOUS CONTEXT: ${previousContext}
        TEST PERFORMED: ${testAction}
        REPORTED RESULT: ${result.toUpperCase()}

        Evaluate this result in the context of the vehicle (${ctx.vehicle?.year} ${ctx.vehicle?.make} ${ctx.vehicle?.model}).
        
        Refine the diagnostic path. If the result was NORMAL, eliminate that branch. If ABNORMAL, narrow down.
        
        Return exactly a JSON object:
        {
            "hypothesis": "Updated theory",
            "actions": DiagnosticAction[],
            "confidence_delta": number (-20 to +20),
            "conclusion": "string (optional)"
        }
    `;

    const systemInstruction = "You are the Master Technician Response Analyzer inside the OpenClaw Framework. Be precise, logical, and decisive.";

    try {
        return await OpenClawEngine.reason({
            agentId: 'OpenClaw-Refiner',
            task: 'Test Result Processing',
            context: { vehicle: ctx.vehicle, action: testAction, result },
            prompt,
            systemInstruction
        });
    } catch (e) {
        throw new Error("Failed to synthesize follow-up logic via OpenClaw Matrix.");
    }
  }
};

