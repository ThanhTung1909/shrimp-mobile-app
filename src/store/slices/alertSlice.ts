import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { alertApi, AlertBackend } from '../../services/alertApi';

export interface EmergencyAlert {
  id: string;
  alertId?: string;
  pondId?: string;
  pondName?: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  actionSuggestion?: string;
  isRead?: boolean;
}

interface AlertState {
  alerts: AlertBackend[];
  activeAlerts: EmergencyAlert[];
  unreadAlertCount: number;
  currentActiveAlert: EmergencyAlert | null;
  loading: boolean;
  resolvingId: string | null;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  activeAlerts: [],
  unreadAlertCount: 0,
  currentActiveAlert: null,
  loading: false,
  resolvingId: null,
  error: null,
};

export const fetchAlertsThunk = createAsyncThunk(
  'alert/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await alertApi.getAlerts({ page: 1, limit: 100 });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách cảnh báo');
    }
  }
);

export const resolveAlertThunk = createAsyncThunk(
  'alert/resolve',
  async (
    { alertId, resolutionNote }: { alertId: string; resolutionNote?: string },
    { rejectWithValue }
  ) => {
    try {
      return await alertApi.resolveAlert(alertId, resolutionNote);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Không thể xác nhận xử lý cảnh báo');
    }
  }
);

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addEmergencyAlert: (state, action: PayloadAction<Partial<EmergencyAlert>>) => {
      const payload = action.payload;
      const alertId = payload.alertId || payload.id;
      const newAlert: EmergencyAlert = {
        id: alertId || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        alertId,
        pondId: payload.pondId,
        pondName: payload.pondName || 'Ao nuôi cần kiểm tra',
        title: payload.title || 'CẢNH BÁO KHẨN CẤP',
        message: payload.message || 'Phát hiện chỉ số môi trường vượt ngưỡng an toàn!',
        severity: payload.severity || 'CRITICAL',
        metric: payload.metric,
        value: payload.value,
        threshold: payload.threshold,
        timestamp: payload.timestamp || new Date().toISOString(),
        actionSuggestion: payload.actionSuggestion,
        isRead: false,
      };

      state.activeAlerts.unshift(newAlert);
      state.unreadAlertCount += 1;
      if (newAlert.severity === 'CRITICAL') {
        state.currentActiveAlert = newAlert;
      }
    },
    dismissCurrentAlert: (state) => {
      state.currentActiveAlert = null;
    },
    dismissAlert: (state, action: PayloadAction<string>) => {
      state.activeAlerts = state.activeAlerts.filter((a) => a.id !== action.payload);
      if (state.currentActiveAlert?.id === action.payload) {
        state.currentActiveAlert = null;
      }
    },
    markAllAlertsAsRead: (state) => {
      state.activeAlerts.forEach((a) => {
        a.isRead = true;
      });
      state.unreadAlertCount = state.alerts.filter((a) => a.status === 'ACTIVE').length;
    },
    clearAlerts: (state) => {
      state.alerts = [];
      state.activeAlerts = [];
      state.unreadAlertCount = 0;
      state.currentActiveAlert = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAlertsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAlertsThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.alerts = action.payload;
      state.unreadAlertCount = action.payload.filter((a) => a.status === 'ACTIVE').length;
    });
    builder.addCase(fetchAlertsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(resolveAlertThunk.pending, (state, action) => {
      state.resolvingId = action.meta.arg.alertId;
      state.error = null;
    });
    builder.addCase(resolveAlertThunk.fulfilled, (state, action) => {
      state.resolvingId = null;
      const resolved = action.payload;
      const idx = state.alerts.findIndex((a) => a.alertId === resolved.alertId);
      if (idx >= 0) {
        state.alerts[idx] = { ...state.alerts[idx], ...resolved, status: 'RESOLVED' };
      }
      state.unreadAlertCount = state.alerts.filter((a) => a.status === 'ACTIVE').length;
      if (state.currentActiveAlert?.alertId === resolved.alertId) {
        state.currentActiveAlert = null;
      }
    });
    builder.addCase(resolveAlertThunk.rejected, (state, action) => {
      state.resolvingId = null;
      state.error = action.payload as string;
    });
  },
});

export const {
  addEmergencyAlert,
  dismissCurrentAlert,
  dismissAlert,
  markAllAlertsAsRead,
  clearAlerts,
} = alertSlice.actions;

export default alertSlice.reducer;
