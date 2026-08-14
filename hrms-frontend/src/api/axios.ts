import axios from 'axios';

// Use the Vite proxy locally and the current Django host for the combined
// deployment.  A deployed standalone frontend can still override this value.
const baseAPIUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: baseAPIUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/accounts/login/') || url.includes('/accounts/employee-login/') || url.includes('/accounts/register/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const loginType = localStorage.getItem('login_type');
        const redirectUrl = loginType === 'employee' ? '/emp/login' : '/login';
        try {
          const refreshURL = baseAPIUrl.endsWith('/api')
            ? `${baseAPIUrl}/accounts/token/refresh/`
            : `${baseAPIUrl}/api/accounts/token/refresh/`;
          const res = await axios.post(refreshURL, { refresh: refreshToken });
          localStorage.setItem('access_token', res.data.access);
          if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('login_type');
          localStorage.removeItem('user');
          window.location.href = redirectUrl;
        }
      } else {
        const loginType = localStorage.getItem('login_type');
        const redirectUrl = loginType === 'employee' ? '/emp/login' : '/login';
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('login_type');
        localStorage.removeItem('user');
        window.location.href = redirectUrl;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
