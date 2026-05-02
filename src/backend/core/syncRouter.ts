import { Router } from "express";
import fs from "fs";
import path from "path";
import { firestore } from "../../../server";

const router = Router();

// Upload logs and audit data
router.post("/upload", async (req: any, res) => {
  const { logs, items } = req.body;
  const syncItems = items || logs || [];
  const user = req.user;
  
  if (!Array.isArray(syncItems)) {
    return res.status(400).json({ error: "Invalid sync payload - expected array" });
  }

  console.log(`[SYNC:UPLOAD] User ${user?.email} processing ${syncItems.length} records`);

  try {
    if (firestore) {
      const batch = firestore.batch();
      const syncLogRef = firestore.collection('sync_audit_logs');

      for (const item of syncItems) {
        const docRef = syncLogRef.doc();
        batch.set(docRef, {
          ...item,
          userId: user?.uid,
          userEmail: user?.email,
          processedAt: new Date().toISOString(),
          status: 'synced_cloud_active'
        });
      }
      
      await batch.commit();
      console.log(`[SYNC:UPLOAD] Transferred ${syncItems.length} records to Mainline Database`);
    } else {
      console.warn("[SYNC:UPLOAD] Matrix Unreachable - Local spool only");
    }

    res.json({ 
      status: "success", 
      count: syncItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("[SYNC:UPLOAD] Neural Link Corruption:", e);
    res.status(500).json({ error: "Sync storage failure", message: e.message });
  }
});

// Download latest system data (DTCs, announcements, etc)
router.get("/download", async (req, res) => {
  try {
    // In a real app, this would fetch from Firestore. 
    // Here we'll return any master DTC data we have.
    const DTC_PATH = path.join(process.cwd(), 'src/lib/dtc_master.json');
    let dtcData = [];
    if (fs.existsSync(DTC_PATH)) {
      dtcData = JSON.parse(fs.readFileSync(DTC_PATH, 'utf-8'));
    }

    res.json({
      status: "success",
      dtc: dtcData.slice(0, 100), // Only send top 100 updates for mobile optimization
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    res.status(500).json({ error: "Data retrieval failure" });
  }
});

// Sync logs to cloud for observability
router.post("/logs/sync", async (req: any, res) => {
  const { logs } = req.body;
  const user = req.user;

  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: "Invalid logs payload" });
  }

  try {
    if (firestore) {
      const batch = firestore.batch();
      const logsRef = firestore.collection('system_logs');

      for (const log of logs) {
        const docRef = logsRef.doc();
        batch.set(docRef, {
          ...log,
          userId: user?.uid,
          userEmail: user?.email,
          receivedAt: new Date().toISOString()
        });
      }
      await batch.commit();
    }

    res.json({ status: "ok", count: logs.length });
  } catch (e: any) {
    console.error("[SYNC] Logs upload failed:", e);
    res.status(500).json({ error: "Logs sync failure" });
  }
});

router.post("/", async (req: any, res) => {
  const { items } = req.body;
  const user = req.user;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid sync payload" });
  }

  console.log(`[SYNC] User ${user?.email} processing ${items.length} items`);

  try {
    if (firestore) {
      const batch = firestore.batch();
      const syncLogRef = firestore.collection('sync_audit_logs');

      for (const item of items) {
        const docRef = syncLogRef.doc();
        batch.set(docRef, {
          ...item,
          userId: user?.uid,
          userEmail: user?.email,
          processedAt: new Date().toISOString(),
          status: 'synced_authorized'
        });

        // LWW Strategy: If item has a payload with updatedAt, try to update the master record
        if (item.payload && (item.payload.id || item.payload.code) && item.payload.updatedAt) {
          try {
            const collectionName = item.endpoint.split('/')[2]; // e.g., "dtc" from "/api/dtc/save"
            if (collectionName) {
              const targetId = (item.payload.id || item.payload.code).toString();
              const targetRef = firestore.collection(collectionName).doc(targetId);
              
              // We use a transaction or merge with check for LWW
              // For simplicity in a batch, we just set it, but we can do a merge if we want
              // Note: batch.set(..., {merge: true}) is common, but for LWW we'd need to fetch first.
              // Since batches don't support reads, we'd need a Transaction for true LWW.
              // However, we'll use 'merge' as a step towards stability.
              batch.set(targetRef, {
                ...item.payload,
                lastSyncedAt: new Date().toISOString()
              }, { merge: true });
            }
          } catch (err) {
            console.warn(`[SYNC] Failed to apply LWW for item: ${item.endpoint}`);
          }
        }
      }
      
      await batch.commit();
      console.log(`[SYNC] Firestore Batch Commit Successful for ${items.length} items`);
    } else {
      console.warn("[SYNC] Firestore unavailable - items logged to console only");
      for (const item of items) {
        console.log(`[SYNC-LOCAL-LOG] ${item.endpoint}: ${JSON.stringify(item.payload)}`);
      }
    }

    res.json({ 
      status: "ok", 
      count: items.length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("[SYNC] Fatal failure in sync commit:", e);
    res.status(500).json({ error: "Sync storage failure", message: e.message });
  }
});

export default router;
