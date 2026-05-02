import { getNextBatch, updateStatus, updateRetry, markDone, QueuedRequest } from "./queueStore";
import { logError, logInfo } from "./logger";
import { getUnsyncedLogs, markLogsAsSynced, getWeakCacheEntries, deleteCache } from "./db";

const MAX_RETRIES = 5;
const BATCH_SIZE = 5;
const BASE_DELAY = 2000;

let isProcessing = false;

export async function startSyncEngine() {
  if (isProcessing) return;
  isProcessing = true;

  logInfo("sync", "Starting Sync Engine v2...");

  while (true) {
    try {
      await sleep(1000);

      if (!navigator.onLine) {
        await sleep(5000);
        continue;
      }

      // 1. Sync mutating requests
      const batch = await getNextBatch(BATCH_SIZE);
      if (batch.length > 0) {
        logInfo("sync", `Processing batch of ${batch.length} requests`);
        for (const req of batch) {
          await processRequest(req);
        }
      }

      // 2. Sync logs
      await syncLogs();

      // 3. Maintenance: cleanup weak cache entries
      await maintainNeuralCache();

      // Longer sleep if no mutations were processed
      if (batch.length === 0) {
        await sleep(10000);
      }
    } catch (err) {
      logError("sync", "Sync Engine loop error", err);
      await sleep(10000);
    }
  }
}

async function syncLogs() {
  const unsynced = await getUnsyncedLogs();
  if (unsynced.length === 0) return;

  try {
    const response = await fetch("/api/logs/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: unsynced })
    });

    if (response.ok) {
      const ids = unsynced.map(l => l.id!) as number[];
      await markLogsAsSynced(ids);
      logInfo("sync", `Synced ${ids.length} logs`);
    }
  } catch (err) {
    // Silent fail for logs
  }
}

async function maintainNeuralCache() {
  try {
    const weakEntries = await getWeakCacheEntries();
    for (const entry of weakEntries) {
      await deleteCache(entry.key);
    }
    if (weakEntries.length > 0) {
      logInfo("sync", `Cleared ${weakEntries.length} weak entries for AI regeneration`);
    }
  } catch (err) {
    // Maintenance error
  }
}

async function processRequest(req: QueuedRequest) {
  try {
    await updateStatus(req.id, "processing");

    logInfo("sync", `Syncing ${req.method} ${req.url}`);

    const res = await fetch(req.url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers || {})
      },
      body: req.body ? JSON.stringify(req.body) : undefined
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server returned ${res.status}: ${errorText}`);
    }

    await markDone(req.id);
    logInfo("sync", `Successfully synced ${req.id}`);

  } catch (err: any) {
    const nextRetry = req.retries + 1;

    if (nextRetry >= MAX_RETRIES) {
      logError("sync", `Permanent failure for request ${req.id} after ${nextRetry} attempts`, err);
      await updateStatus(req.id, "failed", err.message);
      return;
    }

    logInfo("sync", `Temporary failure for ${req.id}. Retry ${nextRetry}/${MAX_RETRIES}`);
    await updateRetry(req.id, nextRetry);
    
    // Optional: wait a bit more if we hit a server error
    const delay = BASE_DELAY * Math.pow(2, nextRetry);
    await sleep(delay);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
