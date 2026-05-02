import axios from 'axios';
import { add } from './queueStore';
import { logWarn, logError } from './logger';

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 5. ALL API communication must use JWT authentication (Authorization: Bearer token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('autobuddy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 8. FAILED API requests MUST be stored locally and retried automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // If no config, we can't retry
    if (!config) return Promise.reject(error);

    const method = (config.method || 'GET').toUpperCase();
    const isMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

    // 7. OFFLINE-FIRST behavior: Queue mutations if network is down or server is 5xx
    if (isMutating && (!response || response.status >= 500)) {
       logWarn("api", `Mutation failed (${method} ${config.url}). Queuing for background sync.`, { 
         error: error.message,
         status: response?.status 
       });
       
       try {
         await add({
           id: crypto.randomUUID(),
           url: config.url || '',
           method: method as any,
           body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
           headers: config.headers as any,
           retries: 0,
           status: "pending",
           priority: "HIGH"
         });
         
         // Return a synthesized response so the UI doesn't crash
         return Promise.resolve({ 
           data: { offline: true, message: "Operation queued for background synchronization." }, 
           status: 202,
           statusText: "Accepted (Offline Queue)",
           headers: {},
           config: config
         });
       } catch (queueErr) {
         logError("api", "Failed to add to offline queue", queueErr);
       }
    }

    logError("api", error, { url: config.url, method });
    return Promise.reject(error);
  }
);

/**
 * Fetch-like wrapper for compatibility with Sync Engine v2 requirements
 */
export async function apiRequest<T = any>(url: string, options: any = {}): Promise<T> {
  const res = await apiClient({
    url,
    method: options.method || 'GET',
    data: options.body,
    headers: options.headers,
    ...options
  });
  return res.data;
}

export default apiClient;
