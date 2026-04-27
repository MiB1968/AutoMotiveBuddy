import { dbPromise } from '../db/database';

export const saveWiring = async (data: any) => {
  const db = await dbPromise;

  const existing = await db.get('wiring', data.id);

  if (existing) {
    data.confidence = Math.min(1, existing.confidence + 0.05);
  } else {
    data.confidence = 0.7;
  }

  await db.put('wiring', data);
};
