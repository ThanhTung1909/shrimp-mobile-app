import { apiClient, unwrapApiResponse } from './apiClient';
import { DeviceStatus } from './deviceApi';

export enum PondStatus {
  ACTIVE = 'ACTIVE',
  HARVESTED = 'HARVESTED',
  EMPTY = 'EMPTY',
}

export interface DeviceSummary {
  deviceId: string;
  pondId: string;
  deviceName: string;
  macAddress: string;
  firmwareVersion?: string | null;
  status: DeviceStatus;
  lastActiveAt?: string | null;
}

export interface ThresholdConfigItem {
  configId: string;
  id?: string;
  pondId: string;
  metricName: string;
  parameterId?: string;
  parameterName?: string;
  minValue: number;
  maxValue: number;
  normalMin?: number;
  normalMax?: number;
  dangerMin?: number;
  dangerMax?: number;
  unit?: string;
  isActive: boolean;
}

export interface PondBackendResponse {
  pondId: string;
  userId?: string;
  farmId?: string | null;
  farm?: {
    farmId: string;
    farmName: string;
    address?: string | null;
  } | null;
  pondName: string;
  location?: string | null;
  areaM2: number;
  depthM: number;
  shrimpDensity: number;
  status: PondStatus;
  createdAt?: string;
  devices?: DeviceSummary[];
  thresholdConfigs?: ThresholdConfigItem[];
}

export interface FindPondsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PondStatus;
}

export interface FindPondsPaginatedResponse {
  data: PondBackendResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const pondApi = {
  getPonds: async (query?: FindPondsQuery): Promise<FindPondsPaginatedResponse> => {
    const response = await apiClient.get<any>('/ponds', {
      params: { limit: 100, ...query },
    });
    const payload = unwrapApiResponse<any>(response.data);

    if (Array.isArray(payload)) {
      return {
        data: payload,
        total: payload.length,
        page: 1,
        limit: payload.length || 100,
        totalPages: 1,
      };
    }

    if (payload && typeof payload === 'object') {
      const list = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.ponds)
        ? payload.ponds
        : Array.isArray(payload.items)
        ? payload.items
        : [];

      return {
        data: list,
        total: typeof payload.total === 'number' ? payload.total : list.length,
        page: typeof payload.page === 'number' ? payload.page : 1,
        limit: typeof payload.limit === 'number' ? payload.limit : 100,
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 1,
      };
    }

    return { data: [], total: 0, page: 1, limit: 100, totalPages: 1 };
  },

  getPondById: async (pondId: string): Promise<PondBackendResponse | null> => {
    try {
      const response = await apiClient.get<any>(`/ponds/${pondId}`);
      return unwrapApiResponse<PondBackendResponse>(response.data);
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
