import path from 'path';
import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';
import authRoutes from './routes/auth.routes';
import shopsRoutes from './routes/shops.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import saasRoutes from './routes/saas.routes';
import { measurementRepository } from './db/measurement.repository';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve generated technical measurement reports.
app.use('/reports', express.static(path.join(process.cwd(), 'public', 'reports'), {
  dotfiles: 'deny',
  index: false,
  fallthrough: false,
}));

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/saas', saasRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Honey Quality Assessment System',
    version: '3.1.0-hardware-runtime',
    hardwareConfigured: Boolean(process.env.HONEY_SERIAL_PORT),
    hardwarePortConfigured: Boolean(process.env.HONEY_SERIAL_PORT),
    timestamp: new Date().toISOString(),
  });
});


app.get('/ready', async (_req, res) => {
  const databaseAvailable = await measurementRepository.isAvailable();
  const hardwareConfigured = Boolean(process.env.HONEY_SERIAL_PORT);
  const ready = databaseAvailable && hardwareConfigured;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database: databaseAvailable ? 'connected' : 'unavailable',
    hardwareConfigured,
    timestamp: new Date().toISOString(),
  });
});

export default app;
