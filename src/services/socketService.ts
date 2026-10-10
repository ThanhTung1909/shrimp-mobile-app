import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { DEFAULT_BASE_URL } from './apiClient';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/secureStore';
import { AppDispatch } from '../store';
import { updateRealtimeTelemetry } from '../store/slices/pondSlice';
import { addEmergencyAlert } from '../store/slices/alertSlice';

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
  private subscribedPondIds: Set<string> = new Set();
  private isRefreshing: boolean = false;
  private refreshAttempts: number = 0;

  /**
   * Đăng ký Redux dispatch handler
   */
  public setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Khởi tạo và mở kết nối WebSocket Gateway theo chuẩn Unified Contract
   */
  public async connect(): Promise<void> {
    if (this.socket && this.socket.connected) {
      console.log('🟢 [WebSocket] Socket đã kết nối sẵn.');
      return;
    }

    // Nếu socket đang tồn tại ở trạng thái đóng, dọn dẹp trước khi tạo mới
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const token = await getAccessToken();
    if (!token) {
      console.log('⚠️ [WebSocket] Không tìm thấy Access Token. Bỏ qua kết nối socket.');
      return;
    }

    const wsUrl = getWebSocketUrl();
    console.log(`🔌 [WebSocket] Đang khởi tạo kết nối tới: ${wsUrl}`);

    // Truyền trực tiếp chuỗi accessToken thuần (không chứa tiền tố Bearer) theo chuẩn Unified Contract
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

  /**
   * Thiết lập các event listener
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 [WebSocket] Kết nối thành công tới Gateway Telemetry:', this.socket?.id);
      this.refreshAttempts = 0;
      this.isRefreshing = false;

      // Re-subscribe tất cả các phòng đầm tôm đang theo dõi
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 [WebSocket] Ngắt kết nối. Lý do:', reason);
    });

    this.socket.on('connect_error', async (err: any) => {
      console.warn('⚠️ [WebSocket Connection Error]:', err?.message || err);
      await this.handleAuthError(err);
    });

    this.socket.on('error', async (err: any) => {
      console.warn('⚠️ [WebSocket Error Event]:', err?.message || err);
      await this.handleAuthError(err);
    });

    // Lắng nghe dữ liệu cảm biến mới
    this.socket.on('telemetry:new', (payload: any) => {
      console.log('📊 [Realtime Telemetry Received]:', payload);
      const data = payload?.data || payload?.telemetry || payload;
      if (this.dispatch && data) {
        this.dispatch(updateRealtimeTelemetry(data));
      }
    });

    // Lắng nghe cảnh báo khẩn cấp
    this.socket.on('alert:triggered', (payload: any) => {
      console.log('🚨 [Realtime Alert Triggered]:', payload);
      const alert = payload?.data || payload?.alert || payload;
      if (this.dispatch && alert) {
        this.dispatch(addEmergencyAlert(alert));
      }
    });
  }

  /**
   * Tự động xử lý Refresh Token khi Token bị lỗi xác thực / hết hạn trên Socket
   */
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
      console.log(`🔄 [WebSocket] Lỗi JWT (${errorMsg}). Thử refresh token cho socket lần ${this.refreshAttempts}...`);

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post<{ accessToken: string; refreshToken: string }>(
          `${DEFAULT_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
        await saveTokens(newAccessToken, newRefreshToken);

        const cleanNewAccessToken = newAccessToken.replace(/^Bearer\s+/i, '').trim();

        if (this.socket) {
          this.socket.auth = {
            token: cleanNewAccessToken,
          };
          console.log('✅ [WebSocket] Refresh Token thành công. Kết nối lại socket...');
          this.socket.connect();
        }
      } catch (refreshErr) {
        console.warn('⚠️ [WebSocket] Refresh token socket thất bại, tạm ngừng socket (giữ nguyên session REST API):', refreshErr);
        this.disconnect();
      } finally {
        this.isRefreshing = false;
      }
    } else if (isAuthError) {
      console.warn('⚠️ [WebSocket] Đã thử refresh socket nhưng thất bại. Tạm đóng kết nối socket.');
      this.disconnect();
    }
  }

  /**
   * Tham gia theo dõi 1 đầm tôm
   */
  public subscribePond(pondId: string, ackCallback?: (response: { status: string; message?: string }) => void): void {
    if (!pondId) return;
    this.subscribedPondIds.add(pondId);

    if (this.socket && this.socket.connected) {
      console.log(`📡 [WebSocket] Gửi yêu cầu subscribe_pond: ${pondId}`);
      this.socket.emit('subscribe_pond', { pondId }, (ack: any) => {
        console.log(`📩 [WebSocket] Subscribe Pond (${pondId}) Ack:`, ack);
        if (ackCallback) {
          ackCallback(ack);
        }
      });
    } else {
      console.log(`⏳ [WebSocket] Socket chưa kết nối. Đã thêm ${pondId} vào hàng đợi re-subscribe.`);
    }
  }

  /**
   * Rời khỏi phòng theo dõi đầm tôm
   */
  public unsubscribePond(pondId: string): void {
    if (!pondId) return;
    this.subscribedPondIds.delete(pondId);

    if (this.socket && this.socket.connected) {
      console.log(`📡 [WebSocket] Gửi yêu cầu unsubscribe_pond: ${pondId}`);
      this.socket.emit('unsubscribe_pond', { pondId });
    }
  }

  /**
   * Re-subscribe tất cả các đầm tôm đang trong danh sách theo dõi
   */
  public resubscribeAll(): void {
    if (!this.socket || !this.socket.connected) return;
    this.subscribedPondIds.forEach((pondId) => {
      console.log(`🔄 [WebSocket] Re-subscribing pond: ${pondId}`);
      this.socket?.emit('subscribe_pond', { pondId }, (ack: any) => {
        console.log(`📩 [WebSocket] Re-subscribe Pond (${pondId}) Ack:`, ack);
      });
    });
  }

  /**
   * Ngắt kết nối socket
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🚪 [WebSocket] Đóng kết nối socket.');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Trạng thái kết nối
   */
  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }
}

export const socketService = new SocketService();
