import { useEffect, useState } from 'react';
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

    socketService.subscribePond(pondId, (ack) => {
      if (ack?.status === 'success') {
        setIsSubscribed(true);
        setSubscriptionError(null);
      } else if (ack?.status === 'error') {
        setIsSubscribed(false);
        const errMsg = ack?.message || 'Không có quyền truy cập ao nuôi này.';
        setSubscriptionError(errMsg);
      }
    });

    return () => {
      socketService.unsubscribePond(pondId);
      setIsSubscribed(false);
    };
  }, [pondId]);

  return { isSubscribed, subscriptionError };
};
