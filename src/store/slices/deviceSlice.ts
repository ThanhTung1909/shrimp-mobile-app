import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deviceApi, DeviceBackend, DeviceStatus } from '../../services/deviceApi';
import { telemetryApi, TelemetryDataBackend } from '../../services/telemetryApi';
import { logoutThunk, logoutAllThunk } from './authSlice';

interface DeviceState {
  devices: DeviceBackend[];
  historyMap: Record<string, TelemetryDataBackend[]>;
  loading: boolean;
  historyLoading: boolean;
  faultSubmitting: boolean;
  updatingStatusId: string | null;
  error: string | null;
}

const initialState: DeviceState = {
  devices: [],
  historyMap: {},
  loading: false,
  historyLoading: false,
  faultSubmitting: false,
  updatingStatusId: null,
  error: null,
};

export const fetchDevicesThunk = createAsyncThunk(
  'device/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await deviceApi.getDevices();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách thiết bị IoT');
    }
  }
);

export const fetchDeviceHistoryThunk = createAsyncThunk(
  'device/fetchHistory',
  async (
    { deviceId, hours = 24 }: { deviceId: string; hours?: number },
    { rejectWithValue }
  ) => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
      const res = await telemetryApi.getTelemetryHistory(deviceId, {
        page: 1,
        limit: 100,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      // Sort ascending by recordedAt for chronological charting
      const sorted = [...(res.data || [])].sort((a, b) => {
        const ta = new Date(a.recordedAt || a.recorded_at || 0).getTime();
        const tb = new Date(b.recordedAt || b.recorded_at || 0).getTime();
        return ta - tb;
      });
      return { deviceId, data: sorted };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải lịch sử cảm biến 24h');
    }
  }
);

export const reportDeviceFaultThunk = createAsyncThunk(
  'device/reportFault',
  async (
    { deviceId, reason }: { deviceId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      return await deviceApi.reportDeviceFault(deviceId, reason);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể gửi báo cáo sự cố thiết bị');
    }
  }
);

export const updateDeviceStatusThunk = createAsyncThunk(
  'device/updateStatus',
  async (
    { deviceId, status }: { deviceId: string; status: DeviceStatus },
    { rejectWithValue }
  ) => {
    try {
      return await deviceApi.updateDeviceStatus(deviceId, status);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể cập nhật trạng thái thiết bị');
    }
  }
);

export const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    clearDeviceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDevicesThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDevicesThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.devices = action.payload;
    });
    builder.addCase(fetchDevicesThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchDeviceHistoryThunk.pending, (state) => {
      state.historyLoading = true;
    });
    builder.addCase(fetchDeviceHistoryThunk.fulfilled, (state, action) => {
      state.historyLoading = false;
      state.historyMap[action.payload.deviceId] = action.payload.data;
    });
    builder.addCase(fetchDeviceHistoryThunk.rejected, (state, action) => {
      state.historyLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(reportDeviceFaultThunk.pending, (state) => {
      state.faultSubmitting = true;
      state.error = null;
    });
    builder.addCase(reportDeviceFaultThunk.fulfilled, (state, action) => {
      state.faultSubmitting = false;
      const updated = action.payload;
      if (updated?.deviceId) {
        const idx = state.devices.findIndex((d) => d.deviceId === updated.deviceId);
        if (idx >= 0) {
          state.devices[idx] = { ...state.devices[idx], ...updated };
        }
      }
    });
    builder.addCase(reportDeviceFaultThunk.rejected, (state, action) => {
      state.faultSubmitting = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateDeviceStatusThunk.pending, (state, action) => {
      state.updatingStatusId = action.meta.arg.deviceId;
    });
    builder.addCase(updateDeviceStatusThunk.fulfilled, (state, action) => {
      state.updatingStatusId = null;
      const updated = action.payload;
      if (updated?.deviceId) {
        const idx = state.devices.findIndex((d) => d.deviceId === updated.deviceId);
        if (idx >= 0) {
          state.devices[idx] = { ...state.devices[idx], ...updated };
        }
      }
    });
    builder.addCase(updateDeviceStatusThunk.rejected, (state, action) => {
      state.updatingStatusId = null;
      state.error = action.payload as string;
    });

    builder.addCase(logoutThunk.fulfilled, () => initialState);
    builder.addCase(logoutAllThunk.fulfilled, () => initialState);
  },
});

export const { clearDeviceError } = deviceSlice.actions;
export default deviceSlice.reducer;
