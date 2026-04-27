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
  updatedAt: number;
  createdAt: number;
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
  logs: {
    key: number;
    value: LogEntry;
    indexes: {
      "by-level": string;
      "by-timestamp": number;
      "by-synced": string; // IndexedDB doesn't index booleans well
    };
  };
}

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = "automotive-db";
const DB_VERSION = 2;
const MAX_LOGS = 1000; // Auto-prune older logs beyond this
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

export async function deleteCache(key: string): Promise<boolean> {
  return withDB(async (db) => {
    await db.delete("cache", key);
    return true;
  }, false);
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
      let cursor = await tx.store.index("by-timestamp").openCursor();
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
    const idx = tx.store.index("by-timestamp");
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
    (db) => db.getAllFromIndex("logs", "by-synced", "false" as any),
    []
  );
}

export async function markLogsAsSynced(ids: number[]): Promise<void> {
  return withDB(async (db) => {
    const tx = db.transaction("logs", "readwrite");
    await Promise.all(
      ids.map(async (id) => {
        const log = await tx.store.get(id);
        if (log) {
          log.synced = true;
          await tx.store.put(log);
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
// Maintenance & Diagnostics
// ============================================================================

export async function getDBStats(): Promise<{
  dtc: number;
  cache: number;
  logs: number;
} | null> {
  return withDB(
    async (db) => ({
      dtc: await db.count("dtc"),
      cache: await db.count("cache"),
      logs: await db.count("logs"),
    }),
    null
  );
}

export async function clearAllData(): Promise<void> {
  return withDB(async (db) => {
    const tx = db.transaction(["dtc", "cache", "logs"], "readwrite");
    await Promise.all([
      tx.objectStore("dtc").clear(),
      tx.objectStore("cache").clear(),
      tx.objectStore("logs").clear(),
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
