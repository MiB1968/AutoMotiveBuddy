import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const DTC_PATH = path.join(process.cwd(), 'src/lib/dtc_master.json');

const loadDTCData = () => {
    try {
        if (fs.existsSync(DTC_PATH)) {
            return JSON.parse(fs.readFileSync(DTC_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error("[DTC] Database read error:", e);
    }
    return [];
};

router.get("/search/:keyword", (req, res) => {
    const { keyword } = req.params;
    const data = loadDTCData();
    
    const results = data.filter((item: any) => 
        item.code?.toLowerCase().includes(keyword.toLowerCase()) || 
        item.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        item.system?.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 50);

    res.json({ status: "success", count: results.length, results });
});

export default router;
