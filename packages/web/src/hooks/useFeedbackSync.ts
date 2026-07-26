import { useEffect } from 'react';
import { flushQueue, getQueue } from '@/lib/offlineQueue';
import { API_BASE } from '@/lib/api';

export function useFeedbackSync(): void {
  useEffect(() => {
    const handleOnline = async () => {
      const queue = getQueue();
      if (queue.length > 0) {
        await flushQueue(API_BASE);
      }
    };

    window.addEventListener('online', handleOnline);

    // Try flushing on mount if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
