import { dbPromise } from '../db/database';

export const saveToCache = async (query: string, results: any) => {
  const db = await dbPromise;
  await db.put('cache', {
    query,
    results,
    timestamp: Date.now()
  });
};

export const getFromCache = async (query: string) => {
  const db = await dbPromise;
  return await db.get('cache', query);
};
