import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000", // API is served by the same Express server
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
