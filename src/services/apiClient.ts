import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/secureStore';

// Tự động phát hiện IP máy tính chạy Backend khi dùng thiết bị thật hoặc máy ảo
const getDefaultBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

export const DEFAULT_BASE_URL = getDefaultBaseUrl();

if (__DEV__) {
  console.log(`📡 [AquaSense Mobile] API Base URL: ${DEFAULT_BASE_URL}`);
}

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function unwrapApiResponse<T>(responseData: any): T {
  if (responseData === null || responseData === undefined) {
    return responseData as T;
  }

  let curr = responseData;
  while (curr !== null && curr !== undefined && typeof curr === 'object') {
    // Paginated response with array data and pagination metadata
    if ('data' in curr && Array.isArray(curr.data) && ('total' in curr || 'totalPages' in curr)) {
      return curr as T;
    }

    if ('data' in curr && curr.data !== undefined && curr.data !== null && typeof curr.data === 'object') {
      curr = curr.data;
    } else {
      break;
    }
  }

  return curr as T;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

let onUnauthenticatedCallback: (() => void) | null = null;

export const setOnUnauthenticated = (callback: () => void) => {
  onUnauthenticatedCallback = callback;
};

// Request Interceptor: Đính kèm Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/register',
];

// Response Interceptor: Tự động Refresh Token khi nhận lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const reqUrl = originalRequest.url || '';
      if (PUBLIC_AUTH_PATHS.some((path) => reqUrl.includes(path))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post<any>(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const refreshPayload = unwrapApiResponse<{ accessToken: string; refreshToken: string }>(
          refreshResponse.data
        );
        const newAccessToken = refreshPayload?.accessToken;
        const newRefreshToken = refreshPayload?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Refresh response missing accessToken');
        }

        await saveTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        await clearTokens();
        if (onUnauthenticatedCallback) {
          onUnauthenticatedCallback();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
