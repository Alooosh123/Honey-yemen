import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { setupWebSockets } from './sockets';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Initialize WebSockets
setupWebSockets(server);

server.listen(PORT, () => {
  console.log(`[Server] Honey Quality Assessment System backend listening on port ${PORT}`);
});
