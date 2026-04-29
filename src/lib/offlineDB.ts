import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "automotive-buddy-offline";
const STORE_NAME = "requests";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function addToQueue(endpoint: string, payload: any) {
  const db = await getDB();
  const id = await db.add(STORE_NAME, {
    endpoint,
    payload,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  console.log(`[OFFLINE] Request queued: ${endpoint} (ID: ${id})`);
}

export async function getQueue() {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
}

export async function clearQueue() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
  console.log("[OFFLINE] Queue cleared");
}

export async function removeFromQueue(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
