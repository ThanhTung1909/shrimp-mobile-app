import { apiClient, unwrapApiResponse } from './apiClient';

export interface ThresholdConfigBackend {
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
  color?: string;
  isActive: boolean;
}

export interface CreateThresholdDto {
  metricName: string;
  minValue: number;
  maxValue: number;
  isActive?: boolean;
}

export interface UpdateThresholdDto {
  metricName?: string;
  minValue?: number;
  maxValue?: number;
  isActive?: boolean;
}

export const thresholdApi = {
  getPondThresholds: async (pondId: string): Promise<ThresholdConfigBackend[]> => {
    const response = await apiClient.get<any>(`/ponds/${pondId}/thresholds`);
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  createThreshold: async (
    pondId: string,
    dto: CreateThresholdDto
  ): Promise<ThresholdConfigBackend> => {
    const response = await apiClient.post<any>(`/ponds/${pondId}/thresholds`, dto);
    return unwrapApiResponse<ThresholdConfigBackend>(response.data);
  },

  updateThreshold: async (
    configId: string,
    dto: UpdateThresholdDto
  ): Promise<ThresholdConfigBackend> => {
    const response = await apiClient.patch<any>(`/ponds/thresholds/${configId}`, dto);
    return unwrapApiResponse<ThresholdConfigBackend>(response.data);
  },
};
