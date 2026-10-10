import { apiClient, unwrapApiResponse } from './apiClient';

export interface TelemetryDataBackend {
  id?: string;
  recordedAt?: string;
  recorded_at?: string;
  deviceId?: string;
  device_id?: string;
  temperature?: number | string | null;
  temp?: number | string | null;
  ph?: number | string | null;
  phValue?: number | string | null;
  ph_value?: number | string | null;
  salinity?: number | string | null;
  sal?: number | string | null;
  dissolvedOxygen?: number | string | null;
  dissolved_oxygen?: number | string | null;
  do?: number | string | null;
  turbidity?: number | string | null;
  turb?: number | string | null;
  waterLevel?: number | string | null;
  water_level?: number | string | null;
  isBuffered?: boolean;
  [key: string]: any;
}

export interface QueryTelemetryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface TelemetryLatestApiResponse {
  success: boolean;
  data: TelemetryDataBackend;
}

export interface TelemetryHistoryApiResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: TelemetryDataBackend[];
}

export const telemetryApi = {
  /**
   * Lấy bản ghi đo đạc thời gian thực mới nhất của 1 thiết bị
   */
  getLatestTelemetry: async (deviceId: string): Promise<TelemetryDataBackend> => {
    const response = await apiClient.get<any>(`/telemetry/device/${deviceId}/latest`);
    return unwrapApiResponse<TelemetryDataBackend>(response.data);
  },

  /**
   * Lấy lịch sử chỉ số đo đạc của 1 thiết bị
   */
  getTelemetryHistory: async (
    deviceId: string,
    query?: QueryTelemetryParams
  ): Promise<TelemetryHistoryApiResponse> => {
    const response = await apiClient.get<any>(`/telemetry/device/${deviceId}/history`, {
      params: query,
    });
    const payload = response.data;
    if (payload && Array.isArray(payload.data)) {
      return payload;
    }
    if (Array.isArray(payload)) {
      return { success: true, total: payload.length, page: 1, limit: 100, data: payload };
    }
    return { success: true, total: 0, page: 1, limit: 100, data: [] };
  },
};
