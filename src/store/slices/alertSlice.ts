import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EmergencyAlert {
  id: string;
  pondId?: string;
  pondName?: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  isRead?: boolean;
}

interface AlertState {
  activeAlerts: EmergencyAlert[];
  unreadAlertCount: number;
  currentActiveAlert: EmergencyAlert | null;
}

const initialState: AlertState = {
  activeAlerts: [],
  unreadAlertCount: 0,
  currentActiveAlert: null,
};

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addEmergencyAlert: (state, action: PayloadAction<Partial<EmergencyAlert>>) => {
      const payload = action.payload;
      const newAlert: EmergencyAlert = {
        id: payload.id || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        pondId: payload.pondId,
        pondName: payload.pondName || (payload.pondId ? `Ao ${payload.pondId}` : 'Đầm tôm'),
        title: payload.title || 'CẢNH BÁO KHẨN CẤP',
        message: payload.message || 'Phát hiện chỉ số vượt ngưỡng an toàn!',
        severity: payload.severity || 'CRITICAL',
        metric: payload.metric,
        value: payload.value,
        threshold: payload.threshold,
        timestamp: payload.timestamp || new Date().toISOString(),
        isRead: false,
      };

      state.activeAlerts.unshift(newAlert);
      state.unreadAlertCount += 1;
      state.currentActiveAlert = newAlert;
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
      state.unreadAlertCount = 0;
    },
    clearAlerts: (state) => {
      state.activeAlerts = [];
      state.unreadAlertCount = 0;
      state.currentActiveAlert = null;
    },
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
