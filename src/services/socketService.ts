import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { DEFAULT_BASE_URL, unwrapApiResponse } from './apiClient';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/secureStore';
import type { AppDispatch, RootState } from '../store';
import { updateRealtimeTelemetry } from '../store/slices/pondSlice';
import { addEmergencyAlert, fetchAlertsThunk } from '../store/slices/alertSlice';
import { setSocketConnected } from '../store/slices/uiSlice';

const getWebSocketUrl = (): string => {
  let url = DEFAULT_BASE_URL;
  if (url.startsWith('https://')) {
    url = url.replace('https://', 'wss://');
  } else if (url.startsWith('http://')) {
    url = url.replace('http://', 'ws://');
  }
  return `${url}/telemetry`;
};

class SocketService {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;
  private getState: (() => RootState) | null = null;
  private subscribedPondCounts: Map<string, number> = new Map();
  private isRefreshing = false;
  private refreshAttempts = 0;

  public setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  public setStore(dispatch: AppDispatch, getState: () => RootState) {
    this.dispatch = dispatch;
    this.getState = getState;
  }

  public async connect(): Promise<void> {
    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const token = await getAccessToken();
    if (!token) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    const accessToken = token.replace(/^Bearer\s+/i, '').trim();

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.refreshAttempts = 0;
      this.isRefreshing = false;
      this.dispatch?.(setSocketConnected(true));
      this.resubscribeAll();
    });

    this.socket.on('disconnect', () => {
      this.dispatch?.(setSocketConnected(false));
    });

    this.socket.on('connect_error', async (err: any) => {
      this.dispatch?.(setSocketConnected(false));
      await this.handleAuthError(err);
    });

    this.socket.on('error', async (err: any) => {
      await this.handleAuthError(err);
    });

    this.socket.on('telemetry:new', (payload: any) => {
      const data = payload?.data || payload?.telemetry || payload;
      if (this.dispatch && data) {
        this.dispatch(updateRealtimeTelemetry(data));
      }
    });

    this.socket.on('alert:triggered', (payload: any) => {
      const rawAlert = payload?.data || payload?.alert || payload;
      if (!this.dispatch || !rawAlert) return;

      const pondId = rawAlert.pondId || rawAlert.pond_id;
      const matchedPond =
        pondId && this.getState
          ? this.getState().pond.ponds.find((p) => p.id === pondId)
          : undefined;

      const resolvedPondName =
        rawAlert.pondName ||
        rawAlert.pond?.pondName ||
        matchedPond?.name ||
        undefined;

      const metricName = rawAlert.metricName || rawAlert.metric;
      const triggeredValue = rawAlert.triggeredValue ?? rawAlert.value;
      const alertLevel = rawAlert.alertLevel || rawAlert.severity || 'CRITICAL';

      this.dispatch(
        addEmergencyAlert({
          id: rawAlert.alertId || rawAlert.id,
          alertId: rawAlert.alertId || rawAlert.id,
          pondId,
          pondName: resolvedPondName,
          title:
            alertLevel === 'CRITICAL'
              ? 'CẢNH BÁO KHẨN CẤP'
              : 'CẢNH BÁO NGƯỠNG AN TOÀN',
          message:
            rawAlert.message ||
            'Phát hiện chỉ số môi trường nước vượt ngưỡng an toàn!',
          severity: alertLevel,
          metric: metricName,
          value: typeof triggeredValue === 'number' ? triggeredValue : Number(triggeredValue),
          threshold: rawAlert.threshold,
          timestamp: rawAlert.createdAt || rawAlert.timestamp || new Date().toISOString(),
          actionSuggestion: rawAlert.recommendation?.actionSuggestion,
        })
      );

      // Refresh REST alert list so AlertCenterScreen stays synchronized
      this.dispatch(fetchAlertsThunk());
    });
  }

  private async handleAuthError(err: any): Promise<void> {
    const errorMsg = String(err?.message || err).toLowerCase();
    const isAuthError =
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('jwt expired') ||
      errorMsg.includes('invalid token') ||
      errorMsg.includes('jwt malformed') ||
      errorMsg.includes('auth') ||
      errorMsg.includes('hết hạn');

    if (isAuthError && !this.isRefreshing && this.refreshAttempts < 2) {
      this.isRefreshing = true;
      this.refreshAttempts++;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post<any>(
          `${DEFAULT_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const refreshPayload = unwrapApiResponse<{ accessToken: string; refreshToken: string }>(
          refreshResponse.data
        );
        const newAccessToken = refreshPayload?.accessToken;
        const newRefreshToken = refreshPayload?.refreshToken;
        if (!newAccessToken) {
          throw new Error('Missing access token in refresh response');
        }

        await saveTokens(newAccessToken, newRefreshToken);

        const cleanNewAccessToken = newAccessToken.replace(/^Bearer\s+/i, '').trim();

        if (this.socket) {
          this.socket.auth = { token: cleanNewAccessToken };
          this.socket.connect();
        }
      } catch {
        this.disconnect();
      } finally {
        this.isRefreshing = false;
      }
    } else if (isAuthError) {
      this.disconnect();
    }
  }

  public subscribePond(
    pondId: string,
    ackCallback?: (response: { status: string; message?: string }) => void
  ): void {
    if (!pondId) return;
    const prevCount = this.subscribedPondCounts.get(pondId) || 0;
    this.subscribedPondCounts.set(pondId, prevCount + 1);

    if (this.socket && this.socket.connected) {
      if (prevCount === 0 || ackCallback) {
        this.socket.emit('subscribe_pond', { pondId }, (ack: any) => {
          if (ackCallback) ackCallback(ack);
        });
      }
    }
  }

  public unsubscribePond(pondId: string): void {
    if (!pondId) return;
    const prevCount = this.subscribedPondCounts.get(pondId) || 0;
    if (prevCount <= 1) {
      this.subscribedPondCounts.delete(pondId);
      if (this.socket && this.socket.connected) {
        this.socket.emit('unsubscribe_pond', { pondId });
      }
    } else {
      this.subscribedPondCounts.set(pondId, prevCount - 1);
    }
  }

  public resubscribeAll(): void {
    if (!this.socket || !this.socket.connected) return;
    this.subscribedPondCounts.forEach((_count, pondId) => {
      this.socket?.emit('subscribe_pond', { pondId });
    });
  }

  public disconnect(clearSubscriptions = true): void {
    if (clearSubscriptions) {
      this.subscribedPondCounts.clear();
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.dispatch?.(setSocketConnected(false));
  }

  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }
}

export const socketService = new SocketService();
