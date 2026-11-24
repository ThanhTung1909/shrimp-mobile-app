import { apiClient, unwrapApiResponse } from './apiClient';
import { PondBackendResponse } from './pondApi';

export interface FarmBackend {
  farmId: string;
  farmName: string;
  ownerId: string | null;
  address: string | null;
  totalArea: string | number | null;
  ponds?: PondBackendResponse[];
}

export const farmApi = {
  getFarms: async (): Promise<FarmBackend[]> => {
    try {
      const response = await apiClient.get<any>('/farms', {
        params: { page: 1, limit: 100 },
      });
      const payload = unwrapApiResponse<any>(response.data);
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    } catch (err: any) {
      // GET /farms is ADMIN/MANAGER only; FARMER receives 403 -> gracefully return []
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        return [];
      }
      throw err;
    }
  },

  getFarmPonds: async (farmId: string): Promise<PondBackendResponse[]> => {
    const response = await apiClient.get<any>(`/farms/${farmId}/ponds`);
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },
};
