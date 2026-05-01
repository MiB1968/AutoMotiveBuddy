import { Router } from "express";
import { executeSkill } from "../runtime/skillExecutor";
import { firestore } from "../../../server";

const router = Router();

router.get("/search/:keyword", async (req: any, res) => {
    const { keyword } = req.params;
    
    try {
        const result = await executeSkill("dtc_lookup", { keyword }, {
            userId: req.user?.uid || 'guest',
            user: req.user,
            tools: { firestore, ai: null },
            timestamp: new Date().toISOString()
        });
        res.json(result.result);
    } catch (e: any) {
        res.status(500).json(e);
    }
});

export default router;
