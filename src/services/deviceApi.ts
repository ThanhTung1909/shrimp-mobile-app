import { apiClient, unwrapApiResponse } from './apiClient';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface DeviceBackend {
  deviceId: string;
  pondId: string | null;
  deviceName: string;
  macAddress: string;
  firmwareVersion: string | null;
  status: DeviceStatus;
  lastActiveAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  pond?: {
    pondId: string;
    pondName: string;
  } | null;
}

export const deviceApi = {
  /**
   * Lấy toàn bộ danh sách thiết bị mà người dùng có quyền xem.
   * Lưu ý (DEF-03): KHÔNG truyền ?pondId= để tránh lỗi validation UUIDv4 với dữ liệu Ao nuôi chuẩn hóa.
   * Filter theo pondId thực hiện phía client.
   */
  getDevices: async (): Promise<DeviceBackend[]> => {
    const response = await apiClient.get<any>('/devices', {
      params: { page: 1, limit: 100 },
    });
    const payload = unwrapApiResponse<any>(response.data);
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  updateDeviceStatus: async (deviceId: string, status: DeviceStatus): Promise<DeviceBackend> => {
    const response = await apiClient.patch<any>(`/devices/${deviceId}/status`, { status });
    return unwrapApiResponse<DeviceBackend>(response.data);
  },

  reportDeviceFault: async (deviceId: string, reason?: string): Promise<DeviceBackend> => {
    const cleanReason = reason?.trim();
    const response = await apiClient.post<any>(
      `/devices/${deviceId}/report-fault`,
      cleanReason ? { reason: cleanReason.slice(0, 500) } : {}
    );
    return unwrapApiResponse<DeviceBackend>(response.data);
  },
};
