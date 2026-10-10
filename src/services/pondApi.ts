import { apiClient, unwrapApiResponse } from './apiClient';

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
  status: 'ONLINE' | 'OFFLINE';
  lastActiveAt?: string | null;
}

export interface ThresholdConfigItem {
  configId: string;
  pondId: string;
  parameterName: string;
  minValue?: number | null;
  maxValue?: number | null;
  unit: string;
}

export interface PondBackendResponse {
  pondId: string;
  userId: string;
  pondName: string;
  areaM2: number;
  depthM: number;
  shrimpDensity: number;
  status: PondStatus;
  createdAt: string;
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
  /**
   * Lấy danh sách các ao nuôi thuộc về nông dân/kỹ thuật viên (Giải bọc linh hoạt mọi dạng Response)
   */
  getPonds: async (query?: FindPondsQuery): Promise<FindPondsPaginatedResponse> => {
    const response = await apiClient.get<any>('/ponds', {
      params: query,
    });
    const payload = unwrapApiResponse<any>(response.data);

    // Trường hợp 1: Backend trả về mảng trực tiếp [PondBackendResponse, ...]
    if (Array.isArray(payload)) {
      return {
        data: payload,
        total: payload.length,
        page: 1,
        limit: payload.length || 100,
        totalPages: 1,
      };
    }

    // Trường hợp 2: Backend trả về đối tượng có bọc data mảng { data: [...] }
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

  /**
   * Lấy thông tin chi tiết một ao nuôi theo ID (Xử lý an toàn khi gặp lỗi 400/404)
   */
  getPondById: async (pondId: string): Promise<PondBackendResponse | null> => {
    try {
      const response = await apiClient.get<any>(`/ponds/${pondId}`);
      return unwrapApiResponse<PondBackendResponse>(response.data);
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn(`⚠️ [Pond API] Không thể lấy chi tiết ao nuôi ID (${pondId}) - Status ${error.response.status}`);
        return null;
      }
      throw error;
    }
  },
};
