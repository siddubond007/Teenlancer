import axios from 'axios';

const isLocalDev = import.meta.env.DEV;

const API = axios.create({
  baseURL: isLocalDev
    ? `http://${window.location.hostname}:5000/api`
    : (import.meta.env.VITE_API_URL || 'https://student-marketplace-kg2f.onrender.com/api'),
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

// Category API
export const fetchCategories = () => API.get('/categories');
