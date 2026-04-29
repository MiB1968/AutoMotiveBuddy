import api from "./apiClient";

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
