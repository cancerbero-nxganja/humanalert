import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';

export interface WsEvent {
  type: string;
  data: unknown;
  queued_at: string;
}

const MAX_QUEUE = 100;
const clients = new Set<WebSocket>();
const eventQueue: WsEvent[] = [];

export function attachWsServer(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    for (const event of eventQueue) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    }
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });
}

export function broadcast(type: string, data: unknown): void {
  const event: WsEvent = { type, data, queued_at: new Date().toISOString() };

  eventQueue.push(event);
  if (eventQueue.length > MAX_QUEUE) {
    eventQueue.shift();
  }

  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function getQueuedEvents(): WsEvent[] {
  return [...eventQueue];
}

export function clearQueue(): void {
  eventQueue.length = 0;
  clients.clear();
}

export function getConnectedCount(): number {
  return clients.size;
}
