import axios from 'axios';

// Create Axios client. Uses relative /api which Vite proxies to backend,
// or fallback to http://127.0.0.1:5000/api if accessed directly.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('miniforum_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired token if server rejected
      const hadToken = localStorage.getItem('miniforum_token');
      if (hadToken && error.config.url !== '/auth/login' && error.config.url !== '/auth/register') {
        localStorage.removeItem('miniforum_token');
        localStorage.removeItem('miniforum_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
