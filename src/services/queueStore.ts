import { 
  getNextSyncBatch, 
  updateRequestStatus, 
  updateRequestRetry, 
  removeRequestFromQueue, 
  addRequestToQueue,
  SyncStatus,
  QueuedRequest
} from "./db";

export type { SyncStatus, QueuedRequest };

export async function getNextBatch(limit: number) {
  return getNextSyncBatch(limit);
}

export async function updateStatus(id: string, status: SyncStatus, error?: string) {
  return updateRequestStatus(id, status, error);
}

export async function updateRetry(id: string, retries: number) {
  return updateRequestRetry(id, retries);
}

export async function markDone(id: string) {
  return removeRequestFromQueue(id);
}

export async function add(request: Omit<QueuedRequest, "createdAt" | "updatedAt">) {
  return addRequestToQueue(request);
}
