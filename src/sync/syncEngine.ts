import api from "../services/api";
import { getDB } from "../offline/db";
import { getWeakCacheEntries, deleteCache } from "../services/db";

export async function syncData() {
  try {
    const db = await getDB();
    if (!db) return false;

    // 1. Get offline logs
    const allLogs = await db.getAll("logs");
    
    // 2. Push to backend if we have any
    if (allLogs.length > 0) {
      try {
        await api.post("/sync/upload", { logs: allLogs });
        await db.clear("logs");
      } catch (err) {
        console.warn("Could not upload logs. Server offline.");
      }
    }

    // 3. Get latest updates (e.g. DTC dictionary updates)
    const res = await api.get("/sync/download").catch((err) => {
      console.warn("Sync server unavailable. Working strictly offline.");
      return null;
    });

    // 4. Update local DB
    if (res && res.data && res.data.dtc) {
      const tx = db.transaction("dtc", "readwrite");
      for (const item of res.data.dtc) {
        await tx.store.put(item);
      }
      await tx.done;
    }

    // 5. Background Sync: Refresh weak confidence neural data matrix
    try {
      const weakEntries = await getWeakCacheEntries();
      for (const entry of weakEntries) {
         // To completely refresh, we delete from cache so the next retrieve fetches fresh live AI data.
         await deleteCache(entry.key);
      }
      if (weakEntries.length > 0) {
         console.log(`[Neural Matrix] Scheduled ${weakEntries.length} weak entries for AI regeneration.`);
      }
    } catch(err) {
      console.warn("Neural sync error:", err);
    }

    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error && error.message === 'Network Error') {
        console.warn("Network Error during sync, working offline.");
    } else {
        console.error("Sync Engine Error:", error);
    }
    return false;
  }
}
