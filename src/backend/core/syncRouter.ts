import { Router } from "express";
import { firestore } from "../../../server";

const router = Router();

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
