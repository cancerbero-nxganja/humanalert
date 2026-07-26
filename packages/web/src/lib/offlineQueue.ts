const QUEUE_KEY = 'humanalert_feedback_queue';

export interface QueuedFeedback {
  id: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export function getQueue(): QueuedFeedback[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueue(payload: Record<string, unknown>): QueuedFeedback {
  const item: QueuedFeedback = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };
  const queue = getQueue();
  queue.push(item);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full — drop silently
  }
  return item;
}

export function dequeue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

export async function flushQueue(apiBase: string): Promise<{ succeeded: number; failed: number }> {
  const queue = getQueue();
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(`${apiBase}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) {
        dequeue(item.id);
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}
