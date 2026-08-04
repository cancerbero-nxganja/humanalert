import * as http from 'http';
import { WebSocket } from 'ws';
import {
  broadcast,
  getQueuedEvents,
  clearQueue,
  getConnectedCount,
  attachWsServer,
} from '../src/ws/broadcast';

describe('broadcast queue', () => {
  beforeEach(() => clearQueue());

  it('queues events on broadcast', () => {
    broadcast('alert:new', { id: '1' });
    const events = getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('alert:new');
    expect(events[0].data).toEqual({ id: '1' });
    expect(events[0].queued_at).toBeDefined();
  });

  it('accumulates multiple events', () => {
    broadcast('alert:new', { id: '1' });
    broadcast('alert:updated', { id: '1', severity: 'critical' });
    broadcast('alert:resolved', { id: '1' });
    expect(getQueuedEvents()).toHaveLength(3);
  });

  it('caps queue at 100 events', () => {
    for (let i = 0; i < 110; i++) {
      broadcast('test', { i });
    }
    const events = getQueuedEvents();
    expect(events).toHaveLength(100);
    expect((events[0].data as { i: number }).i).toBe(10);
    expect((events[99].data as { i: number }).i).toBe(109);
  });

  it('clearQueue empties the queue', () => {
    broadcast('alert:new', { id: '1' });
    clearQueue();
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it('getConnectedCount returns 0 when no clients connected', () => {
    expect(getConnectedCount()).toBe(0);
  });
});

describe('attachWsServer and client messaging', () => {
  let server: http.Server;
  let serverUrl: string;

  beforeEach((done) => {
    clearQueue();
    server = http.createServer();
    attachWsServer(server);
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      serverUrl = `ws://localhost:${addr.port}/ws`;
      done();
    });
  });

  afterEach((done) => {
    clearQueue();
    server.close(done);
  });

  it('tracks connected clients', (done) => {
    const ws = new WebSocket(serverUrl);
    ws.on('open', () => {
      expect(getConnectedCount()).toBe(1);
      ws.close();
      setTimeout(() => {
        expect(getConnectedCount()).toBe(0);
        done();
      }, 50);
    });
  });

  it('broadcasts to connected clients', (done) => {
    const ws = new WebSocket(serverUrl);
    ws.on('open', () => {
      broadcast('alert:new', { id: 'abc' });
    });
    ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      expect(event.type).toBe('alert:new');
      expect(event.data).toEqual({ id: 'abc' });
      ws.close();
      done();
    });
  });

  it('replays queued events to new client', (done) => {
    broadcast('alert:new', { id: 'queued-1' });
    broadcast('alert:updated', { id: 'queued-2' });

    const received: string[] = [];
    const ws = new WebSocket(serverUrl);
    ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      received.push(event.type);
      if (received.length === 2) {
        expect(received).toContain('alert:new');
        expect(received).toContain('alert:updated');
        ws.close();
        done();
      }
    });
  });

  it('removes client from set on ws error event', (done) => {
    const ws = new WebSocket(serverUrl);
    ws.on('open', () => {
      expect(getConnectedCount()).toBe(1);
      // Destroy the underlying TCP socket to trigger an error on the server-side WebSocket
      (ws as unknown as { _socket: { destroy: () => void } })._socket.destroy();
      setTimeout(() => {
        expect(getConnectedCount()).toBe(0);
        done();
      }, 100);
    });
  });

  it('removes client on ws protocol error (malformed frame triggers error handler)', (done) => {
    const ws = new WebSocket(serverUrl);
    ws.on('open', () => {
      expect(getConnectedCount()).toBe(1);
      // Send a WebSocket frame with RSV bits set — a protocol violation that causes
      // the ws library to emit 'error' on the server-side socket, exercising the
      // ws.on('error', ...) cleanup handler in broadcast.ts.
      // Frame: FIN=1, RSV2=1, RSV3=1 (0xb0), MASK=1 len=0 (0x80), 4-byte mask key (zeros)
      (ws as unknown as { _socket: { write: (b: Buffer) => void } })._socket.write(
        Buffer.from([0xb0, 0x80, 0x00, 0x00, 0x00, 0x00])
      );
      setTimeout(() => {
        expect(getConnectedCount()).toBe(0);
        done();
      }, 150);
    });
    ws.on('error', () => {}); // suppress client-side error noise
  });
});
