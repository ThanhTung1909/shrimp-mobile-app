import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'shrimp_access_token';
const REFRESH_TOKEN_KEY = 'shrimp_refresh_token';
const REMEMBER_PHONE_KEY = 'shrimp_remember_phone';

// Helper lưu trữ đa nền tảng (Web dùng localStorage, Native iOS/Android dùng SecureStore)
const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error(`LocalStorage error setting key ${key}:`, e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      console.error(`LocalStorage error getting key ${key}:`, e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.error(`LocalStorage error removing key ${key}:`, e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const saveTokens = async (accessToken: any, refreshToken: any): Promise<void> => {
  try {
    const rawAccess =
      typeof accessToken === 'string'
        ? accessToken
        : accessToken?.accessToken || accessToken?.token || accessToken?.access_token || '';

    const rawRefresh =
      typeof refreshToken === 'string'
        ? refreshToken
        : refreshToken?.refreshToken || refreshToken?.refresh_token || '';

    const cleanAccessToken = String(rawAccess).replace(/^Bearer\s+/i, '').trim();
    const cleanRefreshToken = String(rawRefresh).replace(/^Bearer\s+/i, '').trim();

    if (cleanAccessToken && cleanAccessToken !== 'undefined' && cleanAccessToken !== 'null') {
      await setItem(ACCESS_TOKEN_KEY, cleanAccessToken);
      console.log('🔑 [SecureStore] Đã lưu Access Token thành công.');
    } else {
      console.warn('⚠️ [SecureStore] Access Token nhận vào rỗng hoặc không hợp lệ:', accessToken);
    }

    if (cleanRefreshToken && cleanRefreshToken !== 'undefined' && cleanRefreshToken !== 'null') {
      await setItem(REFRESH_TOKEN_KEY, cleanRefreshToken);
    }
  } catch (error) {
    console.error('Error saving auth tokens:', error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await getItem(ACCESS_TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token.replace(/^Bearer\s+/i, '').trim();
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await getItem(REFRESH_TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token.replace(/^Bearer\s+/i, '').trim();
  } catch (error) {
    console.error('Error fetching refresh token:', error);
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const saveRememberPhone = async (phone: string): Promise<void> => {
  try {
    await setItem(REMEMBER_PHONE_KEY, phone);
  } catch (error) {
    console.error('Error saving remember phone:', error);
  }
};

export const getRememberPhone = async (): Promise<string | null> => {
  try {
    return await getItem(REMEMBER_PHONE_KEY);
  } catch (error) {
    console.error('Error getting remember phone:', error);
    return null;
  }
};

export const clearRememberPhone = async (): Promise<void> => {
  try {
    await deleteItem(REMEMBER_PHONE_KEY);
  } catch (error) {
    console.error('Error clearing remember phone:', error);
  }
};
