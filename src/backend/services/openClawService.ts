
import { AIService } from './aiService';
import { firestore } from '../../../server';

export interface OpenClawRequest {
    agentId: string;
    task: string;
    context: any;
    prompt: string;
    systemInstruction: string;
    image?: { data: string, mimeType: string };
}

export class OpenClawEngine {
    private static async logExecution(req: OpenClawRequest, response: any, error?: any) {
        if (!firestore) return;

        try {
            const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await firestore.collection('openclaw_logs').doc(logId).set({
                agentId: req.agentId,
                task: req.task,
                timestamp: new Date().toISOString(),
                request: {
                    context: req.context,
                    prompt: req.prompt,
                    systemInstruction: req.systemInstruction,
                    hasImage: !!req.image
                },
                response: response || null,
                status: error ? 'failure' : 'success',
                error: error ? error.message : null
            });
        } catch (e) {
            console.error("[OpenClaw] Logging Error:", e);
        }
    }

    /**
     * The primary entry point for all reasoning in the AutoMotive Buddy SaaS.
     * All logic defaults to OpenClaw routing.
     */
    static async reason(req: OpenClawRequest) {
        console.log(`[OpenClaw] Reasoning task: ${req.task} for agent ${req.agentId}`);
        
        let finalResponse: any;
        let finalError: any;

        try {
            // In a more advanced implementation, we would check local rules/DDE cache here
            // BEFORE hitting external AI services.
            
            // Execute reasoning via primary intelligence provider (Gemini via AIService)
            finalResponse = await AIService.generateJSON(req.prompt, req.systemInstruction, req.image);
            
            return finalResponse;
        } catch (error: any) {
            finalError = error;
            console.error(`[OpenClaw] Execution failed for task ${req.task}:`, error);
            throw error;
        } finally {
            // Always log the interaction for auditing and future DDE training
            await this.logExecution(req, finalResponse, finalError);
        }
    }
}
