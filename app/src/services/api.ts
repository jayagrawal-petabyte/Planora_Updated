import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.13:5000/api';

if (!process.env.EXPO_PUBLIC_API_URL) {
  if (Platform.OS === 'web') {
    API_URL = 'http://localhost:5000/api';
  } else {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const localhost = debuggerHost.split(':')[0];
      API_URL = `http://${localhost}:5000/api`;
    }
  }
}
console.log("Connecting to API at:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let unauthorizedCallback: (() => void) | null = null;
let networkErrorCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  unauthorizedCallback = callback;
};

export const setNetworkErrorCallback = (callback: () => void) => {
  networkErrorCallback = callback;
};

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Network Error Handling
    if (!error.response) {
      if (networkErrorCallback) {
        networkErrorCallback();
      }
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Expired-token / Unauthorized handling
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

      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('refreshToken');
        } catch (e) {}
        if (unauthorizedCallback) {
          unauthorizedCallback();
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      return new Promise(function (resolve, reject) {
        axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          .then(async ({data}) => {
            const token = data.data.token;
            await SecureStore.setItemAsync('token', token);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            processQueue(null, token);
            resolve(api(originalRequest));
          })
          .catch(async (err) => {
            processQueue(err, null);
            try {
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('refreshToken');
            } catch (e) {}
            if (unauthorizedCallback) {
              unauthorizedCallback();
            }
            reject(err);
          })
          .finally(() => { isRefreshing = false })
      });
    } else if (error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
      } catch (e) {}
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
