import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as jose from 'jose';
import { KeyManager } from './src/backend/core/keyManager';
import { KeyLimiter } from './src/backend/core/keyLimiter';
import { KeyRouter } from './src/backend/core/keyRouter';
import authRouter from './src/backend/core/authRouter';
import adminRouter from './src/backend/core/adminRouter';
import wiringRouter from './src/backend/core/wiringRouter';
import dtcRouter from './src/backend/core/dtcRouter';
import aiRouter from './src/backend/core/aiRouter';
import syncRouter from './src/backend/core/syncRouter';
import { authenticateJWT } from './src/backend/middleware/auth';
import { checkSubscription } from './src/backend/middleware/subscription';

// Initialize Firebase Admin for Node
const firebaseConfig = process.env.FIREBASE_CONFIG;
let firebaseInitError: string | null = null;
let adminApp: any = null;
let firestore: any = null;

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
    let firestoreDbId: string | undefined = undefined;
    try {
      const appConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(appConfigPath)) {
        const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf-8'));
        firestoreDbId = appConfig.firestoreDatabaseId;
        if (firestoreDbId) console.log(`[FIREBASE] Using database: ${firestoreDbId}`);
      }
    } catch (e) {
      console.warn("Could not read firebase-applet-config.json for databaseId context");
    }

    // @ts-ignore
    firestore = getFirestore(adminApp, firestoreDbId);
  } else {
    firebaseInitError = "FIREBASE_CONFIG (Service Account JSON) is missing in environment variables.";
    console.warn(firebaseInitError);
  }
} catch (e: any) {
  firebaseInitError = `Firebase Admin Initialization Failed: ${e.message}`;
  console.error(firebaseInitError);
}

export { firestore };

const JWT_SECRET = process.env.JWT_SECRET || 'neural-bridge-secret-999';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logger
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });

  // Load DTCs
  let dtcMaster: any[] = [];
  try {
    const dataPath = path.join(process.cwd(), 'src/lib/dtc_master.json');
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

  // WIRING (Gated)
  app.use('/api/wiring', gated, wiringRouter);

  // DTC (Gated)
  app.use('/api/dtc', gated, dtcRouter);

  // AI (Gated)
  app.use('/api/ai', gated, aiRouter);

  // SYNC (Gated)
  app.use('/api/sync', gated, syncRouter);

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

