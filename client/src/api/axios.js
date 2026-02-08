import axios from 'axios';

const BASE_URL = '';

const instance = axios.create({
  baseURL: BASE_URL,
});

function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
}

// Attach token only to protected endpoints (not /auth/*)
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');

  // Skip attaching token to /auth/* endpoints
  const isAuthEndpoint = config.url?.startsWith('/auth/');
  if (token && !isAuthEndpoint) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Refresh token only when a 401 occurs from protected endpoint
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;
    const isRetried = originalRequest._retry;
    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/');

    // Refresh only if it's a 401 from a protected resource
    if (is401 && !isAuthEndpoint && !isRetried) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        // Attempt to refresh access token
        const refreshResponse = await instance.post('/auth/refresh', {
          refreshToken,
          deviceId: getDeviceId(),
        });

        const newAccessToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken;
        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh failed – clear session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
