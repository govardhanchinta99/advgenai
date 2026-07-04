import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/users/refresh`, { refreshToken: refreshToken });
                    if (response.status === 200) {
                        localStorage.setItem('accessToken', response.data.accessToken);
                        localStorage.setItem('refreshToken', response.data.refreshToken);

                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            
            }
        }
            
            return Promise.reject(error);
    }
);

export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export default api;