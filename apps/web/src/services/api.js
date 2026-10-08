import axios from 'axios';

const isLocalDev = import.meta.env.DEV;

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!isLocalDev && !configuredApiUrl) {
  throw new Error(
    'VITE_API_URL must be configured for production web builds.'
  );
}

const API = axios.create({
  baseURL: isLocalDev
    ? `http://${window.location.hostname}:5000/api`
    : configuredApiUrl.replace(/\/$/, ''),
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  config.headers['X-SkillLaunch-Client'] = 'web';
  return config;
});

export default API;

// Category API
export const fetchCategories = () => API.get('/categories');
