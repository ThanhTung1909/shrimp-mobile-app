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

function buildPaginatedHistory(
  source: Record<string, any>,
  defaultPage: number,
  defaultLimit: number
): TelemetryHistoryApiResponse {
  const records: TelemetryDataBackend[] = source.data;
  return {
    success: true,
    total: typeof source.total === 'number' ? source.total : records.length,
    page: typeof source.page === 'number' ? source.page : defaultPage,
    limit: typeof source.limit === 'number' ? source.limit : defaultLimit,
    data: records,
  };
}

/** Normalize telemetry history API responses across TransformInterceptor and paginated shapes. */
export function normalizeTelemetryHistoryResponse(
  raw: unknown,
  query?: QueryTelemetryParams
): TelemetryHistoryApiResponse {
  const defaultPage = query?.page ?? 1;
  const defaultLimit = query?.limit ?? 100;

  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return {
      success: true,
      total: 0,
      page: defaultPage,
      limit: defaultLimit,
      data: [],
    };
  }

  const unwrapped = unwrapApiResponse<any>(raw);

  if (Array.isArray(unwrapped)) {
    return {
      success: true,
      total: unwrapped.length,
      page: defaultPage,
      limit: defaultLimit,
      data: unwrapped,
    };
  }

  if (unwrapped && typeof unwrapped === 'object' && Array.isArray(unwrapped.data)) {
    return buildPaginatedHistory(unwrapped, defaultPage, defaultLimit);
  }

  if (Array.isArray((raw as Record<string, any>).data)) {
    return buildPaginatedHistory(raw as Record<string, any>, defaultPage, defaultLimit);
  }

  return {
    success: true,
    total: 0,
    page: defaultPage,
    limit: defaultLimit,
    data: [],
  };
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
    return normalizeTelemetryHistoryResponse(response.data, query);
  },
};
