import axios from "axios";

// This points to our backend API (which could be the same Vite dev server if running fullstack)
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

export const diagnoseDTC = async (code: string, vehicleInfo: any = {}) => {
  const payload = {
    code,
    vehicle_type: vehicleInfo.type || "light",
    brand: vehicleInfo.make || "Unknown",
    model: vehicleInfo.model || "Unknown",
    year: parseInt(vehicleInfo.year) || 2023
  };
  
  const response = await api.post("/diagnose", payload);
  return response.data;
};

export default api;
