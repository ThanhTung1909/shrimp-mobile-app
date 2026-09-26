import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'shrimp_access_token';
const REFRESH_TOKEN_KEY = 'shrimp_refresh_token';
const REMEMBER_PHONE_KEY = 'shrimp_remember_phone';

export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error saving auth tokens:', error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error fetching refresh token:', error);
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const saveRememberPhone = async (phone: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REMEMBER_PHONE_KEY, phone);
  } catch (error) {
    console.error('Error saving remember phone:', error);
  }
};

export const getRememberPhone = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REMEMBER_PHONE_KEY);
  } catch (error) {
    console.error('Error getting remember phone:', error);
    return null;
  }
};

export const clearRememberPhone = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REMEMBER_PHONE_KEY);
  } catch (error) {
    console.error('Error clearing remember phone:', error);
  }
};
