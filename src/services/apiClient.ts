import axios from "axios";
import { BASE_API } from "../lib/config";
import { addOfflineLog } from "./db";

const apiClient = axios.create({
  baseURL: BASE_API,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("autobuddy_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Audit failed request for offline-first telemetry
    try {
      await addOfflineLog({
        level: "error",
        message: `API Failure: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        context: {
          status: error.response?.status,
          data: error.config?.data,
          error: error.message
        }
      });
    } catch (e) {}

    if (error.response?.status === 401) {
      // Handle unauthorized access globally using hash routing
      localStorage.removeItem("autobuddy_token");
      window.location.hash = "#login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
