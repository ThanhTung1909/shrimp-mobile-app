import { apiClient, unwrapApiResponse } from './apiClient';

export type ShrimpBatchStatus = 'ACTIVE' | 'HARVESTED' | 'FAILED';

export interface ShrimpBatchBackend {
  batchId: string;
  pondId: string;
  stockingDate: string;
  initialQuantity: string | number;
  shrimpSpecies: string;
  expectedHarvestDate: string | null;
  status: ShrimpBatchStatus;
  createdAt?: string;
}

export interface HarvestLogBackend {
  harvestLogId: string;
  batchId: string;
  harvestDate: string;
  harvestQuantity: string | number | null;
  harvestWeightKg: string | number;
  note: string | null;
  createdAt: string;
}

export interface HarvestSummaryBackend {
  batchId: string;
  totalWeightKg: number;
  harvestCount: number;
}

export interface CreateHarvestDto {
  harvestDate: string;
  harvestQuantity?: number;
  harvestWeightKg: number;
  note?: string;
}

export const cropApi = {
  getPondCrops: async (pondId: string): Promise<ShrimpBatchBackend[]> => {
    const response = await apiClient.get<any>(`/ponds/${pondId}/crops`);
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  getHarvests: async (batchId: string): Promise<HarvestLogBackend[]> => {
    const response = await apiClient.get<any>(`/crops/${batchId}/harvests`);
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  getHarvestSummary: async (batchId: string): Promise<HarvestSummaryBackend> => {
    const response = await apiClient.get<any>(`/crops/${batchId}/harvest-summary`);
    return unwrapApiResponse<HarvestSummaryBackend>(response.data);
  },

  createHarvest: async (batchId: string, dto: CreateHarvestDto): Promise<HarvestLogBackend> => {
    const body: CreateHarvestDto = {
      harvestDate: dto.harvestDate,
      harvestWeightKg: dto.harvestWeightKg,
      ...(dto.harvestQuantity !== undefined && dto.harvestQuantity > 0
        ? { harvestQuantity: Math.round(dto.harvestQuantity) }
        : {}),
      ...(dto.note?.trim() ? { note: dto.note.trim() } : {}),
    };
    const response = await apiClient.post<any>(`/crops/${batchId}/harvests`, body);
    return unwrapApiResponse<HarvestLogBackend>(response.data);
  },
};
