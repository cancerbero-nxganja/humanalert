import { enqueue, getQueue, dequeue, clearQueue, flushQueue } from '@/lib/offlineQueue';

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts empty', () => {
    expect(getQueue()).toEqual([]);
  });

  it('returns empty array when localStorage has malformed JSON', () => {
    localStorage.setItem('humanalert_feedback_queue', 'not-valid-json{{{');
    expect(getQueue()).toEqual([]);
  });

  it('enqueues an item', () => {
    const item = enqueue({ source: 'web', context: 'test', rating: 'thumbs-up', language: 'en' });
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(item.id);
    expect(queue[0].payload).toMatchObject({ context: 'test' });
  });

  it('enqueues multiple items', () => {
    enqueue({ a: 1 });
    enqueue({ b: 2 });
    expect(getQueue()).toHaveLength(2);
  });

  it('dequeues by id', () => {
    const a = enqueue({ a: 1 });
    const b = enqueue({ b: 2 });
    dequeue(a.id);
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(b.id);
  });

  it('clearQueue removes all', () => {
    enqueue({ x: 1 });
    enqueue({ x: 2 });
    clearQueue();
    expect(getQueue()).toEqual([]);
  });

  it('flushQueue sends items and dequeues on success', async () => {
    enqueue({ source: 'web', context: 'test', rating: 'thumbs-up', language: 'en' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const result = await flushQueue('http://localhost:3001');
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(getQueue()).toHaveLength(0);
  });

  it('flushQueue counts failed items when fetch throws', async () => {
    enqueue({ source: 'web', context: 'test', rating: 'thumbs-up', language: 'en' });
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await flushQueue('http://localhost:3001');
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(getQueue()).toHaveLength(1);
  });

  it('flushQueue counts failed items when server returns non-ok', async () => {
    enqueue({ source: 'web', context: 'test', rating: 'thumbs-up', language: 'en' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const result = await flushQueue('http://localhost:3001');
    expect(result.failed).toBe(1);
    expect(getQueue()).toHaveLength(1);
  });

  it('flushQueue handles empty queue', async () => {
    const result = await flushQueue('http://localhost:3001');
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);
  });
});
