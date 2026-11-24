import { apiClient, unwrapApiResponse } from './apiClient';

export interface TelemetryDataBackend {
  id?: string;
  recordedAt?: string;
  recorded_at?: string;
  deviceId?: string;
  device_id?: string;
  pondId?: string;
  pond_id?: string;
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

export interface TelemetryHistoryApiResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: TelemetryDataBackend[];
}

export const telemetryApi = {
  getLatestTelemetry: async (deviceId: string): Promise<TelemetryDataBackend> => {
    const response = await apiClient.get<any>(`/telemetry/device/${deviceId}/latest`);
    return unwrapApiResponse<TelemetryDataBackend>(response.data);
  },

  getTelemetryHistory: async (
    deviceId: string,
    query?: QueryTelemetryParams
  ): Promise<TelemetryHistoryApiResponse> => {
    const response = await apiClient.get<any>(`/telemetry/device/${deviceId}/history`, {
      params: query,
    });
    const raw = response.data;
    const unwrapped = unwrapApiResponse<any>(raw);
    if (Array.isArray(unwrapped)) {
      return { success: true, total: unwrapped.length, page: 1, limit: 100, data: unwrapped };
    }
    if (unwrapped && Array.isArray(unwrapped.data)) {
      return {
        success: true,
        total: typeof unwrapped.total === 'number' ? unwrapped.total : unwrapped.data.length,
        page: typeof unwrapped.page === 'number' ? unwrapped.page : 1,
        limit: typeof unwrapped.limit === 'number' ? unwrapped.limit : 100,
        data: unwrapped.data,
      };
    }
    if (raw && Array.isArray(raw.data)) {
      return {
        success: true,
        total: typeof raw.total === 'number' ? raw.total : raw.data.length,
        page: raw.page || 1,
        limit: raw.limit || 100,
        data: raw.data,
      };
    }
    return { success: true, total: 0, page: 1, limit: 100, data: [] };
  },
};
