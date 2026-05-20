import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ─── Auth ──────────────────────────────────────────────── */
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  signup: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

/* ─── Analytics ─────────────────────────────────────────── */
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  overview: (period?: string) => api.get('/analytics/overview', { params: { period } }),
  transactions: (params?: Record<string, any>) => api.get('/analytics/transactions', { params }),
  vendors: (params?: Record<string, any>) => api.get('/analytics/vendors', { params }),
  categories: () => api.get('/analytics/categories'),
  departments: () => api.get('/analytics/departments'),
};

/* ─── Documents ─────────────────────────────────────────── */
export const documentsAPI = {
  list: (params?: Record<string, any>) => api.get('/documents/', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  upload: (file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBatch: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/documents/upload-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
};

/* ─── Anomalies ─────────────────────────────────────────── */
export const anomalyAPI = {
  list: (params?: Record<string, any>) => api.get('/anomalies/', { params }),
  summary: () => api.get('/anomalies/summary'),
  get: (id: string) => api.get(`/anomalies/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/anomalies/${id}/status`, null, { params: { status } }),
  runDetection: () => api.post('/anomalies/run-detection'),
};

/* ─── Forecasting ───────────────────────────────────────── */
export const forecastAPI = {
  revenue: (periods?: number) => api.get('/forecasting/revenue', { params: { periods } }),
  expenses: () => api.get('/forecasting/expenses'),
  operationalCosts: () => api.get('/forecasting/operational-costs'),
  summary: () => api.get('/forecasting/summary'),
};

/* ─── Compliance ────────────────────────────────────────── */
export const complianceAPI = {
  summary: () => api.get('/compliance/summary'),
  flags: (params?: Record<string, any>) => api.get('/compliance/flags', { params }),
  getFlag: (id: string) => api.get(`/compliance/flags/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/compliance/flags/${id}/status`, null, { params: { status } }),
  regulations: () => api.get('/compliance/regulations'),
  gapAnalysis: () => api.get('/compliance/gap-analysis'),
};

/* ─── Risk ──────────────────────────────────────────────── */
export const riskAPI = {
  dashboard: () => api.get('/risk/dashboard'),
  scores: () => api.get('/risk/scores'),
  vendors: () => api.get('/risk/vendors'),
  compute: () => api.post('/risk/compute'),
};

/* ─── AI Chat ───────────────────────────────────────────── */
export const chatAPI = {
  send: (message: string, session_id?: string) =>
    api.post('/chat/message', { message, session_id }),
  history: (session_id?: string, limit?: number) =>
    api.get('/chat/history', { params: { session_id, limit } }),
  sessions: () => api.get('/chat/sessions'),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
};

/* ─── Admin ─────────────────────────────────────────────── */
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params?: Record<string, any>) => api.get('/admin/users', { params }),
  updateRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, null, { params: { role } }),
  toggleStatus: (userId: string) =>
    api.patch(`/admin/users/${userId}/status`),
  auditLogs: (params?: Record<string, any>) => api.get('/admin/audit-logs', { params }),
  notifications: (unread_only?: boolean) =>
    api.get('/admin/notifications', { params: { unread_only } }),
  markRead: (id: string) => api.patch(`/admin/notifications/${id}/read`),
  modelMetrics: () => api.get('/admin/model-metrics'),
};

export default api;
