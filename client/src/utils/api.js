import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const transactionAPI = {
  getAll: (params) => API.get('/transactions', { params }),
  create: (data) => API.post('/transactions', data),
  update: (id, data) => API.put(`/transactions/${id}`, data),
  delete: (id) => API.delete(`/transactions/${id}`),
  getStats: (params) => API.get('/transactions/summary/stats', { params }),
};

export const categoryAPI = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
};

export const reportAPI = {
  getMonthly: (params) => API.get('/reports/monthly', { params }),
  getCategoryBreakdown: (params) => API.get('/reports/category-breakdown', { params }),
  getDailyTrend: (params) => API.get('/reports/daily-trend', { params }),
  getTopExpenses: (params) => API.get('/reports/top-expenses', { params }),
  getBalanceHistory: (params) => API.get('/reports/balance-history', { params }),
};

export default API;
