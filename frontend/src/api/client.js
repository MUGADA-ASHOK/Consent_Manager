import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8095',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear on login attempt failures
      if (!error.config.url.includes('/api/auth/login')) {
        localStorage.removeItem('cm_token');
        localStorage.removeItem('cm_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
