import 'dotenv/config';
import http from 'http';
import app from './app';
import { setupWebSockets } from './sockets';

const PORT = Number(process.env.PORT || 3001);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

const server = http.createServer(app);
setupWebSockets(server);

server.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log('[Server] Honey device backend listening on port ' + PORT);
  if (!process.env.HONEY_SERIAL_PORT) {
    console.warn('[Hardware] HONEY_SERIAL_PORT is missing; real scans are disabled until configured.');
  }
});

const shutdown = (signal: string) => {
  console.log('[Server] Received ' + signal + ', closing HTTP server.');
  server.close((error) => {
    if (error) {
      console.error('[Server] Shutdown failed:', error);
      process.exitCode = 1;
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
