import apiClient from '../../../services/apiClient';

export const diagnoseDTC = async (code: string, symptoms: string[] = []) => {
  return apiClient.post(`/api/ai/diagnose`, { code, symptoms });
};
