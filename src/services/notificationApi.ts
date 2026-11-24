import { apiClient, unwrapApiResponse } from './apiClient';

export type NotificationChannel = 'FCM' | 'SMS' | 'EMAIL';
export type NotificationSeverity = 'WARNING' | 'CRITICAL';

export interface NotificationPreferenceItem {
  preferenceId?: string;
  severity: NotificationSeverity;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationHistoryItem {
  notificationId?: string;
  id?: string;
  channel: NotificationChannel;
  severity: NotificationSeverity;
  status: string;
  title?: string;
  message?: string;
  sentAt?: string;
  createdAt?: string;
}

export const notificationApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationHistoryItem[]> => {
    const response = await apiClient.get<any>('/notifications', {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
    });
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  getNotificationPreferences: async (): Promise<NotificationPreferenceItem[]> => {
    const response = await apiClient.get<any>('/notifications/preferences');
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  updateNotificationPreferences: async (
    preferences: NotificationPreferenceItem[]
  ): Promise<NotificationPreferenceItem[]> => {
    const cleanItems = preferences.map(({ severity, channel, enabled }) => ({
      severity,
      channel,
      enabled,
    }));
    const response = await apiClient.patch<any>('/notifications/preferences', {
      preferences: cleanItems,
    });
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return cleanItems;
  },
};
