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
      await api.post("/sync/upload", { logs: allLogs });
      await db.clear("logs");
    }

    // 3. Get latest updates (e.g. DTC dictionary updates)
    const res = await api.get("/sync/download");

    // 4. Update local DB
    if (res.data && res.data.dtc) {
      const tx = db.transaction("dtc", "readwrite");
      for (const item of res.data.dtc) {
        await tx.store.put(item);
      }
      await tx.done;
    }

    return true;
  } catch (error) {
    console.error("Sync Engine Error:", error);
    return false;
  }
}
