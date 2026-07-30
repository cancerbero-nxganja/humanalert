import { postFeedback, getAlerts, getMissingPersons, getAnimalAlerts, getMapPins } from '@/lib/api';

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postFeedback', () => {
    it('returns true on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      const result = await postFeedback({
        source: 'web',
        context: 'test',
        rating: 'thumbs-up',
        language: 'en',
      });
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/feedback'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns false on server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const result = await postFeedback({
        source: 'app',
        context: 'test',
        rating: 4,
        language: 'es',
      });
      expect(result).toBe(false);
    });

    it('includes message when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await postFeedback({
        source: 'web',
        context: 'test',
        rating: 'thumbs-up',
        language: 'fr',
        message: 'Great!',
      });
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.message).toBe('Great!');
    });
  });

  describe('getAlerts', () => {
    it('returns array on success', async () => {
      const data = [{ id: '1', title: 'Test' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) });
      const result = await getAlerts();
      expect(result).toEqual(data);
    });

    it('throws on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(getAlerts()).rejects.toThrow('Failed to fetch alerts');
    });

    it('appends query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await getAlerts({ status: 'ACTIVE' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('status=ACTIVE');
    });
  });

  describe('getMissingPersons', () => {
    it('returns array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      const result = await getMissingPersons();
      expect(Array.isArray(result)).toBe(true);
    });

    it('throws on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(getMissingPersons()).rejects.toThrow('Failed to fetch missing persons');
    });

    it('appends query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await getMissingPersons({ amber_only: 'true' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('amber_only=true');
    });
  });

  describe('getAnimalAlerts', () => {
    it('returns array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      const result = await getAnimalAlerts();
      expect(Array.isArray(result)).toBe(true);
    });

    it('throws on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(getAnimalAlerts()).rejects.toThrow('Failed to fetch animal alerts');
    });

    it('appends query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await getAnimalAlerts({ status: 'FOUND' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('status=FOUND');
    });
  });

  describe('getMapPins', () => {
    it('returns array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      const result = await getMapPins();
      expect(Array.isArray(result)).toBe(true);
    });

    it('throws on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(getMapPins()).rejects.toThrow('Failed to fetch map pins');
    });

    it('appends query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await getMapPins({ category: 'shelter' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('category=shelter');
    });
  });

  describe('API_BASE env fallback', () => {
    it('uses NEXT_PUBLIC_API_URL when set', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://custom-api.example.com';
      jest.resetModules();
      const { API_BASE } = await import('@/lib/api');
      expect(API_BASE).toBe('http://custom-api.example.com');
      delete process.env.NEXT_PUBLIC_API_URL;
      jest.resetModules();
    });
  });
});
