import { dbPromise } from '../db/database';

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9 ]/g, '');

export const searchLocalDB = async (query: string) => {
  const db = await dbPromise;
  const normalized = normalize(query);

  const wiring = await db.getAll('wiring');
  const fuses = await db.getAll('fuses'); // Since they are now all in one store though they might have fuse_box_id
  const relays = await db.getAll('relays');

  const results = [
    ...wiring.filter(w =>
      normalize(w.component + ' ' + w.wire_color).includes(normalized)
    ),
    ...fuses.filter(f =>
      normalize(f.function || '' + ' ' + f.fuse_number).includes(normalized)
    ),
    ...relays.filter(r =>
      normalize(r.relay_name || '' + ' ' + r.function).includes(normalized)
    )
  ];

  return results;
};
