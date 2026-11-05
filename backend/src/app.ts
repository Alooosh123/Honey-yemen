import path from 'path';
import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';
import authRoutes from './routes/auth.routes';
import shopsRoutes from './routes/shops.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import saasRoutes from './routes/saas.routes';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static PDF reports & public assets
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/reports', express.static(path.join(process.cwd(), 'public', 'reports')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/saas', saasRoutes);

// System Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Honey Quality Assessment System v3.0 (Web-Based)',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default app;
