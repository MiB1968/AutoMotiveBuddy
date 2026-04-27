import { syncFromFirebase, syncToFirebase } from './syncService';

export const startAutoSync = () => {
  window.addEventListener('online', async () => {
    console.log("🌐 Back Online → Syncing...");
    await syncFromFirebase();
    await syncToFirebase();
  });
};
