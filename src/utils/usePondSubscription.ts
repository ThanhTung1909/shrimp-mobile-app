import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { socketService } from '../services/socketService';

export interface UsePondSubscriptionResult {
  isSubscribed: boolean;
  subscriptionError: string | null;
}

export const usePondSubscription = (pondId?: string): UsePondSubscriptionResult => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (!pondId) {
      setIsSubscribed(false);
      setSubscriptionError(null);
      return;
    }

    setSubscriptionError(null);

    // Gửi yêu cầu đăng ký phòng đầm tôm
    socketService.subscribePond(pondId, (ack) => {
      if (ack?.status === 'success') {
        setIsSubscribed(true);
        setSubscriptionError(null);
      } else if (ack?.status === 'error') {
        setIsSubscribed(false);
        const errMsg = ack?.message || 'Không có quyền truy cập đầm tôm này.';
        setSubscriptionError(errMsg);
        Alert.alert(
          'Từ chối truy cập',
          `Bạn không có quyền giám sát dữ liệu đầm tôm này: ${errMsg}`,
          [{ text: 'Đóng' }]
        );
      }
    });

    // Clean up: Hủy đăng ký khi thoát khỏi màn hình
    return () => {
      socketService.unsubscribePond(pondId);
      setIsSubscribed(false);
    };
  }, [pondId]);

  return { isSubscribed, subscriptionError };
};
