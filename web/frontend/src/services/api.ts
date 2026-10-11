import axios from 'axios';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.VITE_API_URL : (import.meta.env && import.meta.env.VITE_API_URL)) || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    if (!error.response) {
      window.dispatchEvent(new Event('network:error'));
      return Promise.reject(error);
    } 
    
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject})
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:unauthorized'));
        isRefreshing = false;
        return Promise.reject(error);
      }

      return new Promise(function (resolve, reject) {
        axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          .then(({data}) => {
            const token = data.data.token;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            processQueue(null, token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.dispatchEvent(new Event('auth:unauthorized'));
            reject(err);
          })
          .finally(() => { isRefreshing = false })
      });
    } else if (error.response.status === 401) {
       localStorage.removeItem('token');
       localStorage.removeItem('refreshToken');
       window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
