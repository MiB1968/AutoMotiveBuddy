import { dbPromise } from '../db/database';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';

const COLLECTIONS = ['vehicles', 'fuse_boxes', 'fuses', 'relays'];

export const syncFromFirebase = async () => {
  const localDB = await dbPromise;

  for (let col of COLLECTIONS) {
    const snapshot = await getDocs(collection(db, col));

    for (let docSnap of snapshot.docs) {
      const data = docSnap.data();
      await localDB.put(col, data);
    }
  }

  console.log("✅ Synced FROM Firebase → Local DB (Relational Structure)");
};

export const syncToFirebase = async () => {
  const localDB = await dbPromise;

  for (let col of COLLECTIONS) {
    const allData = await localDB.getAll(col);

    for (let item of allData) {
      await setDoc(doc(db, col, item.id.toString()), {
        ...item,
        updated_at: Date.now()
      });
    }
  }

  console.log("☁️ Synced Local DB → Firebase (Relational Structure)");
};
