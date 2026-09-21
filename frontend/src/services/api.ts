import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vulnguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vulnguard_token');
      localStorage.removeItem('vulnguard_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const analysisAPI = {
  analyze: (data: {
    source_code: string;
    language: string;
    model: string;
    explain: boolean;
  }) => api.post('/analyze', data),
  getHistory: (skip = 0, limit = 50) =>
    api.get(`/history?skip=${skip}&limit=${limit}`),
  getAnalysis: (id: number) => api.get(`/history/${id}`),
  deleteAnalysis: (id: number) => api.delete(`/history/${id}`),
  getCorrections: (id: number) => api.get(`/corrections/${id}`),
  getModels: () => api.get('/models'),
  healthCheck: () => api.get('/health'),
};

export default api;
