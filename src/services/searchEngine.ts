import { dbPromise } from '../db/database';

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9 ]/g, '');

export const searchLocalDB = async (query: string) => {
  const db = await dbPromise;
  const normalized = normalize(query);

  const wiring = await db.getAll('wiring');
  const fuses = await db.getAll('fuses');
  const relays = await db.getAll('relays');

  const results = [
    ...wiring.filter(w =>
      normalize(w.component + ' ' + w.wire_color).includes(normalized)
    ),
    ...fuses.filter(f =>
      normalize(f.component + ' ' + f.fuse_number).includes(normalized)
    ),
    ...relays.filter(r =>
      normalize(r.name).includes(normalized)
    )
  ];

  return results;
};
