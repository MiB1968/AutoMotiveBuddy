import api from "../services/api";
import { addToQueue } from "./offlineDB";

export async function smartRequest(endpoint: string, payload: any) {
  try {
    const res = await api.post(endpoint, payload);
    return res.data;
  } catch (err: any) {
    // Determine if it's a network error (offline) vs a server error (400, 500)
    // If there's no response, it's usually a connection issue
    if (!err.response) {
      console.warn("[SMART API] Offline protocol triggered. Queuing request...");
      await addToQueue(endpoint, payload);
      return { offline: true, message: "Stored for background sync" };
    }
    
    // For real server errors, propagate them
    throw err;
  }
}
