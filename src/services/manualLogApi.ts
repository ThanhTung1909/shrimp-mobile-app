import { apiClient, unwrapApiResponse } from './apiClient';

export interface ManualTestLogBackend {
  logId: string;
  pondId: string;
  testedById: string;
  nh3Value: number;
  no2Value: number;
  note: string | null;
  testedAt: string;
  testedBy?: {
    userId: string;
    fullName: string;
  } | null;
}

export interface CreateManualLogDto {
  nh3Value: number;
  no2Value: number;
  note?: string;
  testedAt?: string;
}

export const manualLogApi = {
  getManualLogs: async (
    pondId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ManualTestLogBackend[]> => {
    const response = await apiClient.get<any>(`/ponds/${pondId}/manual-logs`, {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 50 },
    });
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  createManualLog: async (
    pondId: string,
    dto: CreateManualLogDto
  ): Promise<ManualTestLogBackend> => {
    const body: CreateManualLogDto = {
      nh3Value: dto.nh3Value,
      no2Value: dto.no2Value,
      ...(dto.note?.trim() ? { note: dto.note.trim() } : {}),
      ...(dto.testedAt ? { testedAt: dto.testedAt } : {}),
    };
    const response = await apiClient.post<any>(`/ponds/${pondId}/manual-logs`, body);
    return unwrapApiResponse<ManualTestLogBackend>(response.data);
  },
};
