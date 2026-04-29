import { openDB } from 'idb';

export const dbPromise = openDB('autoMotiveBuddyDB', 3, {
  upgrade(db, oldVersion) {
    // Delete legacy structures
    if (db.objectStoreNames.contains('fuses')) db.deleteObjectStore('fuses');
    if (db.objectStoreNames.contains('relays')) db.deleteObjectStore('relays');

    // VEHICLES
    if (!db.objectStoreNames.contains('vehicles')) {
      db.createObjectStore('vehicles', { keyPath: 'id' });
    }

    // FUSE_BOXES
    if (!db.objectStoreNames.contains('fuse_boxes')) {
      const store = db.createObjectStore('fuse_boxes', { keyPath: 'id' });
      store.createIndex('vehicle_id', 'vehicle_id');
    }

    // FUSES (Normalized)
    if (!db.objectStoreNames.contains('fuses')) {
      const store = db.createObjectStore('fuses', { keyPath: 'id' });
      store.createIndex('fuse_box_id', 'fuse_box_id');
    }

    // RELAYS (Normalized)
    if (!db.objectStoreNames.contains('relays')) {
      const store = db.createObjectStore('relays', { keyPath: 'id' });
      store.createIndex('fuse_box_id', 'fuse_box_id');
    }

    // WIRING
    if (!db.objectStoreNames.contains('wiring')) {
      const store = db.createObjectStore('wiring', { keyPath: 'id' });
      store.createIndex('vehicle_id', 'vehicle_id');
      store.createIndex('component', 'component');
      store.createIndex('wire_color', 'wire_color');
    }

    // CACHE (SEARCH RESULTS)
    if (!db.objectStoreNames.contains('cache')) {
      const store = db.createObjectStore('cache', { keyPath: 'query' });
      store.createIndex('timestamp', 'timestamp');
    }
  }
});
