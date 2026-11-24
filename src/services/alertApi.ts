import { apiClient, unwrapApiResponse } from './apiClient';

export type AlertLevel = 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface AiRecommendationBackend {
  recommendationId: string;
  alertId: string;
  actionSuggestion: string;
  chemicalDosage: string | null;
}

export interface AlertBackend {
  alertId: string;
  pondId: string;
  deviceId: string | null;
  message: string | null;
  metricName: string;
  triggeredValue: number;
  alertLevel: AlertLevel;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  pond?: {
    pondId: string;
    pondName: string;
  } | null;
  resolvedBy?: {
    userId: string;
    fullName: string;
  } | null;
  recommendation?: AiRecommendationBackend | null;
}

export const alertApi = {
  /**
   * Lấy danh sách cảnh báo theo phân trang.
   * Lưu ý (DEF-03 & DEF-09): KHÔNG truyền ?isResolved= hay ?pondId=; lọc phía client để ổn định tuyệt đối.
   */
  getAlerts: async (params?: { page?: number; limit?: number }): Promise<AlertBackend[]> => {
    const response = await apiClient.get<any>('/alerts', {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 100 },
    });
    const raw = response.data;
    // AlertsController wraps { success, total, data } inside TransformInterceptor { statusCode, data: { success, total, data } }
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    const unwrapped = unwrapApiResponse<any>(raw);
    if (Array.isArray(unwrapped)) return unwrapped;
    if (unwrapped && Array.isArray(unwrapped.data)) return unwrapped.data;
    return [];
  },

  resolveAlert: async (alertId: string, resolutionNote?: string): Promise<AlertBackend> => {
    const cleanNote = resolutionNote?.trim();
    const response = await apiClient.patch<any>(
      `/alerts/${alertId}/resolve`,
      cleanNote ? { resolutionNote: cleanNote } : {}
    );
    const raw = response.data;
    if (raw?.data?.data && typeof raw.data.data === 'object') {
      return raw.data.data as AlertBackend;
    }
    return unwrapApiResponse<AlertBackend>(raw);
  },
};
