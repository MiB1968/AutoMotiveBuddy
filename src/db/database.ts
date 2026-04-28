import { openDB } from 'idb';

export const dbPromise = openDB('autoMotiveBuddyDB', 2, {
  upgrade(db) {
    // VEHICLES
    if (!db.objectStoreNames.contains('vehicles')) {
      db.createObjectStore('vehicles', { keyPath: 'id' });
    }

    // WIRING
    if (!db.objectStoreNames.contains('wiring')) {
      const store = db.createObjectStore('wiring', { keyPath: 'id' });
      store.createIndex('vehicle_id', 'vehicle_id');
      store.createIndex('component', 'component');
      store.createIndex('wire_color', 'wire_color');
    }

    // FUSES
    if (!db.objectStoreNames.contains('fuses')) {
      const store = db.createObjectStore('fuses', { keyPath: 'id' });
      store.createIndex('vehicle_id', 'vehicle_id');
      store.createIndex('fuse_number', 'fuse_number');
    }

    // RELAYS
    if (!db.objectStoreNames.contains('relays')) {
      const store = db.createObjectStore('relays', { keyPath: 'id' });
      store.createIndex('vehicle_id', 'vehicle_id');
      store.createIndex('name', 'name');
    }

    // CACHE (SEARCH RESULTS)
    if (!db.objectStoreNames.contains('cache')) {
      const store = db.createObjectStore('cache', { keyPath: 'query' });
      store.createIndex('timestamp', 'timestamp');
    }
  }
});
