import { Router } from "express";
import { executeSkill } from "../runtime/skillExecutor";
import { firestore } from "../../../server";

import { diagnosticCaseService } from "../services/diagnosticCaseService";
import { AgentOrchestrator } from "../openclaw/orchestrator";

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post("/openclaw-diagnose", async (req: any, res) => {
    const { message, vehicle } = req.body;
    try {
        const result = await orchestrator.diagnose(message, vehicle);
        res.json({ status: 'success', ...result });
    } catch (e: any) {
        console.error("OpenClaw Error:", e);
        res.status(500).json({ status: 'error', error: e.message });
    }
});
// ... (previous code)

router.post("/log-case", async (req: any, res) => {
    try {
        await diagnosticCaseService.logCase({
            ...req.body,
            userId: req.user?.uid || 'guest'
        });
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json(e);
    }
});

router.post("/confirm-fix", async (req: any, res) => {
    const { caseId, fixDescription } = req.body;
    try {
        await diagnosticCaseService.logCase({
            caseId,
            actualFix: { confirmed: true, description: fixDescription }
        });
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json(e);
    }
});

router.post("/diagnose", async (req: any, res) => {
    const { vehicle, symptom, code } = req.body;
    
    try {
        const result = await executeSkill("ai_diagnose", { 
            message: `Symptom: ${symptom}${code ? ` | DTC: ${code}` : ''}`,
            vehicleInfo: vehicle 
        }, {
            userId: req.user?.uid || 'guest',
            user: req.user,
            vehicle: vehicle,
            tools: { firestore, ai: null },
            timestamp: new Date().toISOString()
        });
        res.json(result);
    } catch (e: any) {
        res.status(500).json(e);
    }
});

router.post("/ai-diagnose", async (req: any, res) => {
    const { message, image, vehicle } = req.body;
    
    try {
        const result = await executeSkill("ai_diagnose", { message, image }, {
            userId: req.user?.uid || 'guest',
            user: req.user,
            vehicle: vehicle,
            tools: { firestore, ai: null },
            timestamp: new Date().toISOString()
        });
        res.json(result);
    } catch (e: any) {
        res.status(500).json(e);
    }
});

router.post("/process-result", async (req: any, res) => {
    const { testAction, result, previousContext, vehicle } = req.body;
    
    try {
        const output = await executeSkill("process_test_result", { 
            testAction, 
            result: result as 'normal' | 'abnormal' | 'not_sure', 
            previousContext 
        }, {
            userId: req.user?.uid || 'guest',
            user: req.user,
            vehicle: vehicle,
            tools: { firestore, ai: null },
            timestamp: new Date().toISOString()
        });
        res.json(output.result); // result field in execution response
    } catch (e: any) {
        res.status(500).json(e);
    }
});

export default router;

