export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface FeedbackPayload {
  source: 'app' | 'web' | 'landing';
  context: string;
  rating: number | 'thumbs-up' | 'thumbs-down';
  message?: string;
  email?: string;
  language: string;
}

export async function postFeedback(payload: FeedbackPayload): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function getAlerts(params?: Record<string, string>): Promise<unknown[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/api/v1/alerts${qs}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function getMissingPersons(params?: Record<string, string>): Promise<unknown[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/api/v1/missing-persons${qs}`);
  if (!res.ok) throw new Error('Failed to fetch missing persons');
  return res.json();
}

export async function getAnimalAlerts(params?: Record<string, string>): Promise<unknown[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/api/v1/animal-alerts${qs}`);
  if (!res.ok) throw new Error('Failed to fetch animal alerts');
  return res.json();
}

export async function getMapPins(params?: Record<string, string>): Promise<unknown[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/api/v1/map-pins${qs}`);
  if (!res.ok) throw new Error('Failed to fetch map pins');
  return res.json();
}
