import { openDB, DBSchema, IDBPDatabase } from "idb";

interface AutomotiveDB extends DBSchema {
  dtc: {
    key: string;
    value: any;
  };
  cache: {
    key: string;
    value: any;
  };
  logs: {
    key: number;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<AutomotiveDB>> | null = null;

export const getDB = () => {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<AutomotiveDB>("automotive-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("dtc")) {
          db.createObjectStore("dtc", { keyPath: "code" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache");
        }
        if (!db.objectStoreNames.contains("logs")) {
          db.createObjectStore("logs", { autoIncrement: true });
        }
      }
    });
  }
  return dbPromise;
};

export async function saveDTCOffline(data: any) {
  const db = await getDB();
  if (!db) return;
  // Make sure code exists
  if (!data.code) return;
  await db.put("dtc", data);
}

export async function getDTCOffline(code: string) {
  const db = await getDB();
  if (!db) return null;
  return await db.get("dtc", code);
}

export async function addOfflineLog(log: any) {
  const db = await getDB();
  if (!db) return;
  await db.add("logs", log);
}
