import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as jose from 'jose';
import { KeyManager } from './src/backend/core/keyManager';
import { KeyLimiter } from './src/backend/core/keyLimiter';
import { KeyRouter } from './src/backend/core/keyRouter';
import authRouter from './src/backend/core/authRouter';
import adminRouter from './src/backend/core/adminRouter';
import { authenticateJWT } from './src/backend/middleware/auth';
import { checkSubscription } from './src/backend/middleware/subscription';

// Initialize Firebase Admin for Node
const firebaseConfig = process.env.FIREBASE_CONFIG;
let firebaseInitError: string | null = null;
let adminApp: any = null;

try {
  if (firebaseConfig) {
    const apps = getApps();
    if (apps.length === 0) {
      const creds = JSON.parse(firebaseConfig) as ServiceAccount;
      adminApp = initializeApp({
        credential: cert(creds)
      });
      console.log("Firebase Admin initialized in Node (Modern SDK)");
    } else {
      adminApp = apps[0];
    }
  } else {
    firebaseInitError = "FIREBASE_CONFIG (Service Account JSON) is missing in environment variables.";
    console.warn(firebaseInitError);
  }
} catch (e: any) {
  firebaseInitError = `Firebase Admin Initialization Failed: ${e.message}`;
  console.error(firebaseInitError);
}

const JWT_SECRET = process.env.JWT_SECRET || 'neural-bridge-secret-999';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });

  // Load DTCs
  let dtcMaster: any[] = [];
  try {
    const dataPath = path.join(process.cwd(), 'data/dtc_master.json');
    if (fs.existsSync(dataPath)) {
      dtcMaster = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Error loading DTC Master:", e);
  }

  // --- HEALTH ---
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: "online", 
      firebase: getApps().length > 0 ? "ready" : "not_initialized",
      config_status: firebaseInitError || "ok"
    });
  });

  // --- PUBLIC AUTH ---
  app.use('/api/auth', authRouter);

  // --- PROTECTED ROUTES ---
  const gated = [authenticateJWT, checkSubscription];

  // Profile is just authenticated
  app.get('/api/user/profile', authenticateJWT, (req: any, res) => {
    res.json({ status: "success", user: req.user });
  });

  // ADMIN
  app.use('/api/admin', adminRouter);

  // DATA ACCESS (Gated by Subscription)
  app.get('/api/dtc/search/:keyword', gated, (req, res) => {
    const { keyword } = req.params;
    const q = keyword.toLowerCase();
    const results = dtcMaster.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      (d.system && d.system.toLowerCase().includes(q))
    );
    res.json(results.slice(0, 50));
  });

  app.get('/api/dtc/:code', gated, async (req, res) => {
    const code = req.params.code.toUpperCase();
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
    res.status(404).json({ error: "Code not found in master database" });
  });

  // AI DIAGNOSE (Gated)
  const keyManager = new KeyManager([process.env.GEMINI_API_KEY || ""]);
  const keyLimiter = new KeyLimiter();
  const keyRouter = new KeyRouter(keyManager, keyLimiter);
  const aiCache = new Map<string, string>();

  app.post('/api/ai/diagnose', gated, async (req, res) => {
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
    res.status(500).json({ error: "AI reasoning failure" });
  });

  // TELEMETRY (Gated)
  app.get('/api/live/all', gated, (req, res) => {
    const rpm = Math.floor(800 + Math.random() * 2000);
    const temp = Math.floor(80 + Math.random() * 25);
    res.json({ rpm: rpm.toString(), temp: temp.toString() });
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
    console.log("AutoMoto Buddy Pro Backend running on http://localhost:" + PORT);
  });
}

startServer();

