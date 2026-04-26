import api from "../services/api";
import { getDB } from "../offline/db";

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
