const VITE_API_URL = (import.meta as any).env?.VITE_API_URL;
let API_BASE_URL = VITE_API_URL && VITE_API_URL !== 'undefined' ? VITE_API_URL : '';

const cleanUrl = API_BASE_URL.trim().toLowerCase();
const isPlaceholder = ['none', 'local', 'default', 'null', 'undefined', '.', '/', '-', 'v1'].includes(cleanUrl);

if (API_BASE_URL.includes('automotive-buddy-api.onrender.com') || isPlaceholder) {
  API_BASE_URL = '';
}

export const BASE_API = API_BASE_URL;
export const getApiUrl = (path: string) => BASE_API ? `${BASE_API}${path}` : path;
