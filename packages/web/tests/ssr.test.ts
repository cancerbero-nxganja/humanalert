/**
 * @jest-environment node
 */
// SSR safety: window/navigator are undefined in Node.js (Next.js server-side rendering)
import { getQueue } from '../src/lib/offlineQueue';

describe('offlineQueue SSR (window undefined)', () => {
  it('getQueue returns empty array when window is undefined', () => {
    expect(typeof window).toBe('undefined');
    expect(getQueue()).toEqual([]);
  });
});
