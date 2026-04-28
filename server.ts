import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { KeyManager } from './src/backend/core/keyManager';
import { KeyLimiter } from './src/backend/core/keyLimiter';
import { KeyRouter } from './src/backend/core/keyRouter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Load DTCs from JSON
  let dtcMaster: any[] = [];
  try {
    const dataPath = path.join(process.cwd(), 'data/dtc_master.json');
    if (fs.existsSync(dataPath)) {
      dtcMaster = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Error loading DTC Master:", e);
  }

  // --- SYNC ROUTES ---
  app.post('/api/sync/upload', (req, res) => {
    const logs = req.body.logs || [];
    console.log(`Received ${logs.length} offline logs from client sync`);
    res.json({ status: "received", count: logs.length });
  });

  app.get('/api/sync/download', (req, res) => {
    res.json({
      dtc: [
        {
          code: "P0101",
          description: "Mass Air Flow Sensor Issue (Updated via Sync)",
          system: "Powertrain",
          symptoms: ["Check Engine Light", "Poor fuel economy"],
          solutions: ["Replace MAF"]
        }
      ]
    });
  });

  // --- API ROUTES ---

  // NEW: Search DTC by keyword
  app.get('/api/dtc/search/:keyword', (req, res) => {
    const { keyword } = req.params;
    const q = keyword.toLowerCase();

    const results = dtcMaster.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      (d.system && d.system.toLowerCase().includes(q))
    );

    res.json(results.slice(0, 50)); // Limit to 50 results
  });

  // DTC Route (Multi-Layer Logic)
  app.get('/api/dtc/:code', async (req, res) => {
    const code = req.params.code.toUpperCase();

    // 1. Verified Lookups
    const dtc = dtcMaster.find(d => d.code === code);
    if (dtc) {
      return res.json({
        ...dtc,
        causes: Array.isArray(dtc.causes) ? dtc.causes : (typeof dtc.causes === 'string' ? dtc.causes.split(',') : []),
        symptoms: Array.isArray(dtc.symptoms) ? dtc.symptoms : (typeof dtc.symptoms === 'string' ? dtc.symptoms.split(',') : []),
        solutions: Array.isArray(dtc.solutions) ? dtc.solutions : (typeof dtc.solutions === 'string' ? dtc.solutions.split(',') : []),
        status: "VERIFIED",
        confidence: 1.0
      });
    }

    // 2. Generic Fallback
    const genericCodePrefix = code.substring(0, 3);
    const generic = dtcMaster.find(d => d.code.startsWith(genericCodePrefix));
    if (generic) {
      return res.json({
        code: code,
        description: generic.description,
        system: generic.system,
        severity: generic.severity,
        symptoms: [`Related to ${generic.causes}`],
        solutions: [`Related to ${generic.solutions}`],
        manufacturer: "Generic Fallback",
        status: "PARTIAL",
        confidence: 0.6
      });
    }

    // 3. AI Fallback (Live Search Proxy)
    // We move this to the frontend as per security guidelines.
    // For now, return a placeholder that tells the frontend to use its own AI.
    return res.json({
      code: code,
      description: `Searching for ${code} in global database...`,
      system: "Cloud Matrix Sync",
      severity: "medium",
      symptoms: ["Pending live retrieval"],
      solutions: ["System initializing search protocols"],
      manufacturer: "SEARCH_REQUIRED",
      status: "AI_PENDING",
      confidence: 0.5
    });
  });

  // --- AI BACKEND ---
  const keyManager = new KeyManager([process.env.GEMINI_API_KEY || ""]);
  const keyLimiter = new KeyLimiter();
  const keyRouter = new KeyRouter(keyManager, keyLimiter);
  const aiCache = new Map<string, string>();

  app.post('/api/ai/diagnose', async (req, res) => {
    const { code, symptoms } = req.body;
    const message = `Diagnose DTC code ${code} with symptoms ${symptoms}`;
    
    if (aiCache.has(message)) {
        return res.json({ success: true, ai_data: aiCache.get(message) });
    }

    const result = await keyRouter.aiRequest(message);
    if (result) {
        aiCache.set(message, result);
        return res.json({ success: true, ai_data: result });
    }
    
    res.status(500).json({ error: "AI failed" });
  });

  app.post('/api/ai/generate', async (req, res) => {
    return res.json({
      result: "Frontend AI fallback triggered. Please ensure Gemini API is configured in the browser."
    });
  });

  // Component Locator Route
  app.post('/api/ai/component-locate', (req, res) => {
    const { query } = req.body;
    return res.json({
      result: `Estimated location for [${query}]: Typically found in the engine bay or under the dashboard. Use an inspection mirror or refer to generic technical manuals for exact pinouts.`
    });
  });

  // Live Telemetry Mock
  app.get('/api/live/all', (req, res) => {
    // Generate some simulated live data
    const rpm = Math.floor(800 + Math.random() * 2000);
    const temp = Math.floor(80 + Math.random() * 25);
    res.json({ rpm: rpm.toString(), temp: temp.toString() });
  });

  // Admin Logs Mock
  app.get('/api/admin/logs', (req, res) => {
    res.json([
      { action: "DTC Search P0101", timestamp: new Date().toISOString() },
      { action: "AI Diagnose Request", timestamp: new Date(Date.now() - 50000).toISOString() },
      { action: "Live Telemetry Connected", timestamp: new Date(Date.now() - 100000).toISOString() }
    ]);
  });

  // Unit Manuals Mock
  app.get('/api/manual', (req, res) => {
    res.json({ content: "### GENERAL SERVICE MANUAL\n\n1. Ensure vehicle is powered off before accessing main electronics.\n2. When servicing the high-voltage system, wear class 0 rubber gloves.\n3. Verify all DTCs using OBD-II scanner before replacing modules." });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
