import * as http from 'http';
import { createApp } from './app';
import { attachWsServer } from './ws/broadcast';

const PORT = process.env.PORT ?? 4000;
const app = createApp();
const server = http.createServer(app);

attachWsServer(server);

server.listen(PORT, () => {
  console.log(`HumanAlert API running on port ${PORT} (HTTP + WebSocket /ws)`);
});
