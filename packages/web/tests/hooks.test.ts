import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useFeedbackSync } from '@/hooks/useFeedbackSync';

jest.mock('@/lib/offlineQueue', () => ({
  getQueue: jest.fn(() => []),
  flushQueue: jest.fn().mockResolvedValue({ succeeded: 0, failed: 0 }),
}));

jest.mock('@/lib/api', () => ({
  API_BASE: 'http://localhost:3001',
}));

import { getQueue, flushQueue } from '@/lib/offlineQueue';
const mockGetQueue = getQueue as jest.Mock;
const mockFlushQueue = flushQueue as jest.Mock;

describe('useOnlineStatus', () => {
  afterEach(() => {
    (navigator as { onLine: boolean }).onLine = true;
  });

  it('returns true when online', () => {
    (navigator as { onLine: boolean }).onLine = true;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false when navigator.onLine is false', () => {
    (navigator as { onLine: boolean }).onLine = false;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('updates to false when offline event fires', () => {
    (navigator as { onLine: boolean }).onLine = true;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      (navigator as { onLine: boolean }).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('updates to true when online event fires', () => {
    (navigator as { onLine: boolean }).onLine = false;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      (navigator as { onLine: boolean }).onLine = true;
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});

describe('useFeedbackSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as { onLine: boolean }).onLine = true;
  });

  it('flushes queue on mount when online and queue is non-empty', async () => {
    mockGetQueue.mockReturnValue([{ id: '1', payload: {}, timestamp: Date.now(), retries: 0 }]);

    await act(async () => {
      renderHook(() => useFeedbackSync());
      await Promise.resolve(); // allow microtasks
    });

    expect(mockFlushQueue).toHaveBeenCalledWith('http://localhost:3001');
  });

  it('does not flush when queue is empty', async () => {
    mockGetQueue.mockReturnValue([]);

    await act(async () => {
      renderHook(() => useFeedbackSync());
      await Promise.resolve();
    });

    expect(mockFlushQueue).not.toHaveBeenCalled();
  });

  it('flushes queue when online event fires', async () => {
    (navigator as { onLine: boolean }).onLine = false;
    mockGetQueue.mockReturnValue([{ id: '1', payload: {}, timestamp: Date.now(), retries: 0 }]);

    const { unmount } = renderHook(() => useFeedbackSync());

    (navigator as { onLine: boolean }).onLine = true;
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(mockFlushQueue).toHaveBeenCalled();
    unmount();
  });
});
