import axios from "axios";

// This points to our backend API
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "https://automotive-buddy-api-e5qr.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autobuddy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const diagnoseDTC = async (code: string) => {
  try {
    const response = await api.get(`/api/dtc/${code}`);
    return response.data;
  } catch (error: any) {
    console.error("DTC diagnostic API call failed:", error);
    throw new Error(
      error.response?.data?.message || 
      "Failed to connect to the diagnostic service. Please try again later."
    );
  }
};

export default api;
