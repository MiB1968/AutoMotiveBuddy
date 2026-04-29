import { Router } from "express";
import fs from "fs";
import path from "path";

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

router.get("/search", (req, res) => {
    const { color, query } = req.query;
    const db = loadWiringDB();
    const results: any[] = [];

    db.vehicles.forEach((v: any) => {
        v.systems.forEach((s: any) => {
            s.circuits.forEach((c: any) => {
                c.wires.forEach((w: any) => {
                    let match = false;
                    if (color && w.color.toLowerCase() === (color as string).toLowerCase()) match = true;
                    if (query && (
                        w.function.toLowerCase().includes((query as string).toLowerCase()) ||
                        c.name.toLowerCase().includes((query as string).toLowerCase()) ||
                        s.system.toLowerCase().includes((query as string).toLowerCase())
                    )) match = true;

                    if (match) {
                        results.push({
                            vehicle: v.name,
                            system: s.system,
                            circuit: c.name,
                            ...w
                        });
                    }
                });
            });
        });
    });

    res.json({ status: "success", count: results.length, results });
});

router.get("/systems", (req, res) => {
    const db = loadWiringDB();
    const systems = db.vehicles[0]?.systems.map((s: any) => s.system) || [];
    res.json(systems);
});

export default router;
