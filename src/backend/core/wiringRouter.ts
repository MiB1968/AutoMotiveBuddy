import { Router } from "express";
import fs from "fs";
import path from "path";
import { executeSkill } from "../runtime/skillExecutor";
import { firestore } from "../../../server";

const router = Router();
const DB_PATH = path.join(process.cwd(), 'data/wiring_db.json');

const loadWiringDB = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error("[WIRING] Failed to load DB", e);
    }
    return { vehicles: [] };
};

router.get("/search", async (req: any, res) => {
    const { color, query } = req.query;
    
    try {
        const result = await executeSkill("wiring_search", { color: color as string, query: query as string }, {
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

router.get("/systems", (req, res) => {
    const db = loadWiringDB();
    const systems = db.vehicles[0]?.systems.map((s: any) => s.system) || [];
    res.json(systems);
});

export default router;
