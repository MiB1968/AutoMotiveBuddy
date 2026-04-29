import axios from "axios";
import { BASE_API } from "../lib/config";

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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access globally
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
