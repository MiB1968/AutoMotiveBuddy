import { openDB, DBSchema, IDBPDatabase, IDBPTransaction } from "idb";

// ============================================================================
// Type Definitions
// ============================================================================

export interface DTCRecord {
  code: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  system?: string; // e.g., "engine", "transmission", "abs"
  manufacturer?: string;
  possibleCauses?: string[];
  recommendedActions?: string[];
  toolRequirements?: string[];
  safetyPrecaution?: string;
  operationalAction?: string;
  confidence?: number; // 0.0 to 1.0
  confidenceBreakdown?: {
    dtcMatch: number;
    sourceAuthority: number;
    userFeedback: number;
  };
  riskScore?: number; // 0.0 to 1.0
  sourceType?: "oem" | "heuristic" | "ai_inference" | "user_confirmed";
  feasibility?: "proceed" | "limited" | "specialist_required";
  disclaimer?: string;
  workflow?: DiagnosticStep[];
  updatedAt: number;
  createdAt: number;
}

export interface DiagnosticStep {
  id: string;
  title: string;
  instruction: string;
  toolRequired?: string;
  expectedOutcome?: string;
  validationType?: "text" | "number" | "boolean" | "image";
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  result?: string;
}

export interface DiagnosticSession {
  id: string;
  vehicleId?: string;
  dtcCode: string;
  status: "active" | "completed" | "aborted";
  currentStepIndex: number;
  steps: DiagnosticStep[];
  startTime: number;
  endTime?: number;
  notes?: string;
  riskAcknowledged: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: "scan_tool" | "multimeter" | "oscilloscope" | "adas_rig" | "hand_tool" | "other";
  capabilityLevel: "basic" | "intermediate" | "advanced" | "oem";
  isVerified?: boolean;
}

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number | null; // null = never expires
  createdAt: number;
}

export interface LogEntry {
  id?: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  synced?: boolean; // for offline-first sync patterns
}

export type SyncStatus = "pending" | "processing" | "failed" | "done";

export interface QueuedRequest {
  id: string; // Using string UUIDs
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  retries: number;
  status: SyncStatus;
  createdAt: number;
  updatedAt: number;
  priority: "HIGH" | "LOW";
  lastError?: string;
}

interface AutomotiveDB extends DBSchema {
  dtc: {
    key: string;
    value: DTCRecord;
    indexes: {
      "by-severity": string;
      "by-system": string;
      "by-updatedAt": number;
    };
  };
  cache: {
    key: string;
    value: CacheEntry;
    indexes: {
      "by-expiresAt": number;
    };
  };
  sessions: {
    key: string;
    value: DiagnosticSession;
    indexes: {
      "by-status": string;
      "by-dtcCode": string;
      "by-startTime": number;
    };
  };
  equipment: {
    key: string;
    value: Equipment;
    indexes: {
      "by-type": string;
    };
  };
  requests: {
    key: string;
    value: QueuedRequest;
    indexes: {
      "by-status": string;
      "by-priority": string;
      "by-updatedAt": number;
    };
  };
  logs: {
    key: number;
    value: LogEntry;
    indexes: {
      "by-level": string;
      "by-timestamp": number;
      "by-synced": number;
    };
  };
}

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = "automotive-buddy-core";
const DB_VERSION = 5;
const MAX_LOGS = 1000;
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// ============================================================================
// Database Initialization
// ============================================================================

let dbPromise: Promise<IDBPDatabase<AutomotiveDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<AutomotiveDB>> | null => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;

  if (!dbPromise) {
    dbPromise = openDB<AutomotiveDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        // v1 → initial schema
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains("dtc")) {
            db.createObjectStore("dtc", { keyPath: "code" });
          }
          if (!db.objectStoreNames.contains("cache")) {
            db.createObjectStore("cache");
          }
          if (!db.objectStoreNames.contains("logs")) {
            db.createObjectStore("logs", { autoIncrement: true, keyPath: "id" });
          }
        }

        // v2 → add indexes
        if (oldVersion < 2) {
          const dtcStore = tx.objectStore("dtc");
          if (!dtcStore.indexNames.contains("by-severity"))
            dtcStore.createIndex("by-severity", "severity");
          if (!dtcStore.indexNames.contains("by-system"))
            dtcStore.createIndex("by-system", "system");
          if (!dtcStore.indexNames.contains("by-updatedAt"))
            dtcStore.createIndex("by-updatedAt", "updatedAt");

          const cacheStore = tx.objectStore("cache");
          if (!cacheStore.indexNames.contains("by-expiresAt"))
            cacheStore.createIndex("by-expiresAt", "expiresAt");

          const logsStore = tx.objectStore("logs");
          if (!logsStore.indexNames.contains("by-level"))
            logsStore.createIndex("by-level", "level");
          if (!logsStore.indexNames.contains("by-timestamp"))
            logsStore.createIndex("by-timestamp", "timestamp");
          if (!logsStore.indexNames.contains("by-synced"))
            logsStore.createIndex("by-synced", "synced");
        }

        // v3 -> add sessions and equipment
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains("sessions")) {
            const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
            sessionStore.createIndex("by-status", "status");
            sessionStore.createIndex("by-dtcCode", "dtcCode");
            sessionStore.createIndex("by-startTime", "startTime");
          }
          if (!db.objectStoreNames.contains("equipment")) {
            const equipmentStore = db.createObjectStore("equipment", { keyPath: "id" });
            equipmentStore.createIndex("by-type", "type");
          }
        }

        // v4 -> add sync requests
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains("requests")) {
             const requestStore = db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
             requestStore.createIndex("by-status", "status");
          }
        }

        // v5 -> redesign requests for Sync Engine v2
        if (oldVersion < 5) {
          if (db.objectStoreNames.contains("requests")) {
            db.deleteObjectStore("requests");
          }
          const requestStore = db.createObjectStore("requests", { keyPath: "id" });
          requestStore.createIndex("by-status", "status");
          requestStore.createIndex("by-priority", "priority");
          requestStore.createIndex("by-updatedAt", "updatedAt");
        }
      },
      blocked() {
        console.warn("[AutomotiveDB] Upgrade blocked by another tab");
      },
      blocking() {
        console.warn("[AutomotiveDB] This tab is blocking a DB upgrade. Closing...");
        dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
      terminated() {
        console.error("[AutomotiveDB] Connection terminated unexpectedly");
        dbPromise = null;
      },
    });
  }
  return dbPromise;
};

// Helper: safely run an operation if DB is available (SSR-safe)
async function withDB<T>(
  fn: (db: IDBPDatabase<AutomotiveDB>) => Promise<T>,
  fallback: T
): Promise<T> {
  const dbP = getDB();
  if (!dbP) return fallback;
  try {
    const db = await dbP;
    return await fn(db);
  } catch (err) {
    console.error("[AutomotiveDB] Operation failed:", err);
    return fallback;
  }
}

// ============================================================================
// DTC Operations
// ============================================================================

export async function saveDTCOffline(
  data: Omit<DTCRecord, "createdAt" | "updatedAt"> & Partial<Pick<DTCRecord, "createdAt" | "updatedAt">>
): Promise<boolean> {
  if (!data.code) {
    console.warn("[AutomotiveDB] saveDTCOffline: missing 'code' field");
    return false;
  }
  return withDB(async (db) => {
    const now = Date.now();
    const existing = await db.get("dtc", data.code);
    const record: DTCRecord = {
      ...existing,
      ...data,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await db.put("dtc", record);
    return true;
  }, false);
}

export async function getDTCOffline(code: string): Promise<DTCRecord | null> {
  return withDB(async (db) => (await db.get("dtc", code)) ?? null, null);
}

export async function getAllDTCs(): Promise<DTCRecord[]> {
  return withDB((db) => db.getAll("dtc"), []);
}

export async function getDTCsBySeverity(
  severity: DTCRecord["severity"]
): Promise<DTCRecord[]> {
  return withDB(
    (db) => db.getAllFromIndex("dtc", "by-severity", severity as string),
    []
  );
}

export async function getDTCsBySystem(system: string): Promise<DTCRecord[]> {
  return withDB((db) => db.getAllFromIndex("dtc", "by-system", system), []);
}

export async function deleteDTCOffline(code: string): Promise<boolean> {
  return withDB(async (db) => {
    await db.delete("dtc", code);
    return true;
  }, false);
}

export async function bulkSaveDTCs(records: DTCRecord[]): Promise<number> {
  return withDB(async (db) => {
    const tx = db.transaction("dtc", "readwrite");
    const now = Date.now();
    let count = 0;
    await Promise.all(
      records.map(async (r) => {
        if (!r.code) return;
        await tx.store.put({
          ...r,
          createdAt: r.createdAt ?? now,
          updatedAt: now,
        });
        count++;
      })
    );
    await tx.done;
    return count;
  }, 0);
}

// ============================================================================
// Cache Operations (with TTL support)
// ============================================================================

export async function setCache<T>(
  key: string,
  value: T,
  ttlMs: number | null = DEFAULT_CACHE_TTL_MS
): Promise<boolean> {
  return withDB(async (db) => {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
      createdAt: Date.now(),
    };
    await db.put("cache", entry, key);
    return true;
  }, false);
}

export async function smartCacheSearch<T>(query: string, typePrefix?: string): Promise<{score: number, key: string, value: T}[]> {
  return withDB(async (db) => {
    // Normalize query
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const qNorm = normalize(query);
    if (!qNorm) return [];
    
    // Split into tokens
    const qTokens = qNorm.split(' ');
    
    const results: {score: number, key: string, value: T}[] = [];
    const tx = db.transaction("cache", "readonly");
    let cursor = await tx.store.openCursor();
    
    while(cursor) {
       const key = cursor.key.toString();
       if (!typePrefix || key.startsWith(typePrefix)) {
          const kNorm = normalize(key);
          // Calculate a simple match score
          let matches = 0;
          for (const token of qTokens) {
            if (kNorm.includes(token)) matches++;
          }
          
          if (matches > 0) {
             results.push({
               score: matches / qTokens.length, // simple ratio
               key: key,
               value: cursor.value.value as T
             });
          }
       }
       cursor = await cursor.continue();
    }
    
    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }, []);
}

export async function getCache<T>(key: string): Promise<T | null> {
  return withDB(async (db) => {
    const entry = (await db.get("cache", key)) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      await db.delete("cache", key);
      return null;
    }
    return entry.value;
  }, null);
}

export async function updateCacheConfidence(key: string, isAccurate: boolean): Promise<boolean> {
   return withDB(async (db) => {
      const entry = await db.get("cache", key);
      if (!entry) return false;
      const val: any = entry.value;
      if (val && typeof val === 'object') {
         if (val.confidence === undefined) val.confidence = 0.95;
         
         if (isAccurate) {
            val.confidence = Math.min(1.0, val.confidence + 0.05);
            val.source = 'user_confirmed';
         } else {
            val.confidence = Math.max(0.1, val.confidence - 0.20);
         }
         
         entry.value = val;
         await db.put("cache", entry, key);
         return true;
      }
      return false;
   }, false);
}

export async function deleteCache(key: string): Promise<boolean> {
  return withDB(async (db) => {
    await db.delete("cache", key);
    return true;
  }, false);
}

export async function getWeakCacheEntries(): Promise<{key: string, value: any}[]> {
   return withDB(async (db) => {
      const results: {key: string, value: any}[] = [];
      const tx = db.transaction("cache", "readonly");
      let cursor = await tx.store.openCursor();
      while(cursor) {
         const val: any = cursor.value.value;
         if (val && typeof val === 'object' && val.confidence !== undefined && val.confidence < 0.6) {
            results.push({ key: cursor.key.toString(), value: val });
         }
         cursor = await cursor.continue();
      }
      return results;
   }, []);
}

export async function clearExpiredCache(): Promise<number> {
  return withDB(async (db) => {
    const tx = db.transaction("cache", "readwrite");
    const now = Date.now();
    let cleared = 0;
    let cursor = await tx.store.openCursor();
    while (cursor) {
      const v = cursor.value as CacheEntry;
      if (v.expiresAt !== null && v.expiresAt < now) {
        await cursor.delete();
        cleared++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return cleared;
  }, 0);
}

// ============================================================================
// Logging Operations
// ============================================================================

export async function addOfflineLog(
  log: Omit<LogEntry, "id" | "timestamp"> & Partial<Pick<LogEntry, "timestamp">>
): Promise<number | null> {
  return withDB(async (db) => {
    const entry: LogEntry = {
      level: log.level ?? "info",
      message: log.message,
      context: log.context,
      timestamp: log.timestamp ?? Date.now(),
      synced: log.synced ?? false,
    };
    const id = (await db.add("logs", entry)) as number;

    // Auto-prune old logs to prevent unbounded growth
    const count = await db.count("logs");
    if (count > MAX_LOGS) {
      const tx = db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");
      let cursor = await store.index("by-timestamp").openCursor();
      let toDelete = count - MAX_LOGS;
      while (cursor && toDelete > 0) {
        await cursor.delete();
        toDelete--;
        cursor = await cursor.continue();
      }
      await tx.done;
    }
    return id;
  }, null);
}

export async function getRecentLogs(limit = 100): Promise<LogEntry[]> {
  return withDB(async (db) => {
    const tx = db.transaction("logs", "readonly");
    const store = tx.objectStore("logs");
    const idx = store.index("by-timestamp");
    const results: LogEntry[] = [];
    let cursor = await idx.openCursor(null, "prev");
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    return results;
  }, []);
}

export async function getUnsyncedLogs(): Promise<LogEntry[]> {
  return withDB(
    (db) => db.getAllFromIndex("logs", "by-synced", 0 as any),
    []
  );
}

export async function markLogsAsSynced(ids: number[]): Promise<void> {
  return withDB(async (db) => {
    const tx = db.transaction("logs", "readwrite");
    const store = tx.objectStore("logs");
    await Promise.all(
      ids.map(async (id) => {
        const log = await store.get(id);
        if (log) {
          log.synced = true;
          await store.put(log);
        }
      })
    );
    await tx.done;
  }, undefined);
}

export async function clearLogs(): Promise<void> {
  return withDB(async (db) => {
    await db.clear("logs");
  }, undefined);
}

// ============================================================================
// Session & Equipment Operations
// ============================================================================

export async function saveSession(session: DiagnosticSession): Promise<void> {
  return withDB(async (db) => {
    await db.put("sessions", session);
  }, undefined);
}

export async function getSession(id: string): Promise<DiagnosticSession | null> {
  return withDB(async (db) => (await db.get("sessions", id)) ?? null, null);
}

export async function getActiveSessions(): Promise<DiagnosticSession[]> {
  return withDB(
    (db) => db.getAllFromIndex("sessions", "by-status", "active"),
    []
  );
}

export async function saveEquipment(equipment: Equipment): Promise<void> {
  return withDB(async (db) => {
    await db.put("equipment", equipment);
  }, undefined);
}

export async function getAllEquipment(): Promise<Equipment[]> {
  return withDB((db) => db.getAll("equipment"), []);
}

export async function deleteEquipment(id: string): Promise<void> {
  return withDB(async (db) => {
    await db.delete("equipment", id);
  }, undefined);
}

// ============================================================================
// Sync Queue Operations (Sync Engine v2)
// ============================================================================

export async function addRequestToQueue(request: Omit<QueuedRequest, "createdAt" | "updatedAt">): Promise<boolean> {
  return withDB(async (db) => {
    const now = Date.now();
    const entry: QueuedRequest = {
      ...request,
      createdAt: now,
      updatedAt: now
    };
    await db.put("requests", entry);
    return true;
  }, false);
}

export async function getNextSyncBatch(limit: number): Promise<QueuedRequest[]> {
  return withDB(async (db) => {
    const tx = db.transaction("requests", "readonly");
    const index = tx.store.index("by-status");
    let cursor = await index.openCursor("pending");
    const results: QueuedRequest[] = [];
    
    while(cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    // Sort by priority (HIGH first) manually if index doesn't filter perfectly
    return results.sort((a, b) => {
      if (a.priority === b.priority) return a.createdAt - b.createdAt;
      return a.priority === "HIGH" ? -1 : 1;
    });
  }, []);
}

export async function updateRequestStatus(id: string, status: SyncStatus, error?: string): Promise<boolean> {
  return withDB(async (db) => {
    const tx = db.transaction("requests", "readwrite");
    const item = await tx.store.get(id);
    if (item) {
      item.status = status;
      item.updatedAt = Date.now();
      if (error) item.lastError = error;
      await tx.store.put(item);
      return true;
    }
    return false;
  }, false);
}

export async function updateRequestRetry(id: string, retries: number): Promise<boolean> {
  return withDB(async (db) => {
    const tx = db.transaction("requests", "readwrite");
    const item = await tx.store.get(id);
    if (item) {
      item.retries = retries;
      item.status = "pending";
      item.updatedAt = Date.now();
      await tx.store.put(item);
      return true;
    }
    return false;
  }, false);
}

export async function removeRequestFromQueue(id: string): Promise<boolean> {
  return withDB(async (db) => {
    await db.delete("requests", id);
    return true;
  }, false);
}

export async function getQueueCount(): Promise<number> {
  return withDB((db) => db.count("requests"), 0);
}

export async function clearQueue(): Promise<boolean> {
  return withDB(async (db) => {
    await db.clear("requests");
    return true;
  }, false);
}

// ============================================================================
// Maintenance & Diagnostics
// ============================================================================

export async function getDBStats(): Promise<{
  dtc: number;
  cache: number;
  logs: number;
  sessions: number;
  equipment: number;
} | null> {
  return withDB(
    async (db) => ({
      dtc: await db.count("dtc"),
      cache: await db.count("cache"),
      logs: await db.count("logs"),
      sessions: await db.count("sessions"),
      equipment: await db.count("equipment"),
    }),
    null
  );
}

export async function clearAllData(): Promise<void> {
  return withDB(async (db) => {
    const tx = db.transaction(["dtc", "cache", "logs", "sessions", "equipment"], "readwrite");
    await Promise.all([
      tx.objectStore("dtc").clear(),
      tx.objectStore("cache").clear(),
      tx.objectStore("logs").clear(),
      tx.objectStore("sessions").clear(),
      tx.objectStore("equipment").clear(),
    ]);
    await tx.done;
  }, undefined);
}

export async function exportData(): Promise<{
  dtc: DTCRecord[];
  logs: LogEntry[];
  exportedAt: number;
} | null> {
  return withDB(
    async (db) => ({
      dtc: await db.getAll("dtc"),
      logs: await db.getAll("logs"),
      exportedAt: Date.now(),
    }),
    null
  );
}

export async function importData(data: {
  dtc?: DTCRecord[];
  logs?: LogEntry[];
}): Promise<boolean> {
  return withDB(async (db) => {
    const tx = db.transaction(["dtc", "logs"], "readwrite");
    if (data.dtc) {
      await Promise.all(data.dtc.map((r) => tx.objectStore("dtc").put(r)));
    }
    if (data.logs) {
      await Promise.all(
        data.logs.map((l) => {
          const { id, ...rest } = l;
          return tx.objectStore("logs").add(rest as LogEntry);
        })
      );
    }
    await tx.done;
    return true;
  }, false);
}
