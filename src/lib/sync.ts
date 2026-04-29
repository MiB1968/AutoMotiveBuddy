import api from "../services/api";
import { getQueue, removeFromQueue } from "./offlineDB";

let isSyncing = false;

export async function syncQueue() {
  if (isSyncing) return;
  
  const items = await getQueue();
  if (items.length === 0) return;

  isSyncing = true;
  console.log(`[SYNC] Attempting to sync ${items.length} items...`);

  try {
    // Send all items to the centralized sync endpoint
    const response = await api.post("/sync", { items });
    
    if (response.data.status === "ok") {
      console.log(`[SYNC] Successfully synced ${response.data.count} items`);
      // Clear processed items
      // For safety, the server returns the IDs it successfully processed
      // But in this simple implementation, we clear what we sent if the batch succeeded
      const idsToRemove = items.map(i => i.id);
      for (const id of idsToRemove) {
        await removeFromQueue(id);
      }
    }
  } catch (err) {
    console.warn("[SYNC] Sync cycle failed - will retry in next interval");
  } finally {
    isSyncing = false;
  }
}

// Start auto-sync every 10 seconds
export function startSyncEngine() {
    console.log("[SYNC] Engine Started (10s interval)");
    setInterval(syncQueue, 10000);
    
    // Also try immediately
    syncQueue();
}
