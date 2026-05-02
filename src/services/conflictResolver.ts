export interface RecordBase {
  id: string;
  updatedAt: number;
  version: number;
}

export function resolveConflict<T extends RecordBase>(
  local: T,
  server: T
): { resolved: T; conflict: boolean } {
  // If versions match, just use LWW on updatedAt
  if (local.version === server.version) {
    if (local.updatedAt > server.updatedAt) {
      return { resolved: local, conflict: false };
    }
    return { resolved: server, conflict: false };
  }

  // Version mismatch = direct conflict
  // In a real app, you might try to merge or flag for manual resolution.
  // Here we'll return local but flag as conflict.
  return { resolved: local, conflict: true };
}
