// frontend/src/lib/api/endpoints.ts
import apiClient from './client';

// Authentication endpoints
export const registerUser = async (userData: { name: string; email: string; password: string; otp?: string; }) => {
    const response = await apiClient.post('/api/v1/auth/register', userData);
    return response.data;
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  const response = await apiClient.post('/api/v1/auth/login', credentials);
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await apiClient.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/v1/auth/users/me');
  return response.data;
};

// Lab Reports endpoints
export const uploadReport = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/v1/reports/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getReportHistory = async () => {
  const response = await apiClient.get('/api/v1/reports/reports/history');
  return response.data;
};

export const getReportById = async (reportId: string) => {
  const response = await apiClient.get(`/api/v1/reports/reports/${reportId}`);
  return response.data;
};

export const getDietPlan = async (reportId: string) => {
  const response = await apiClient.get(`/api/v1/reports/reports/${reportId}/diet-plan`);
  return response.data;
};

export const downloadReportPdf = async (reportId: string) => {
  const response = await apiClient.get(`/api/v1/reports/reports/download-pdf/${reportId}`, {
    responseType: 'blob', // Important to get a blob response
  });
  return response.data;
};
