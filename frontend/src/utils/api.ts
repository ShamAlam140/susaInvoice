import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://susainvoice.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // 20 seconds
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('refreshToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
