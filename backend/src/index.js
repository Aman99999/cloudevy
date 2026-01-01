import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import cloudAccountsRoutes from './routes/cloudAccounts.js';
import serversRoutes from './routes/servers.js';
import metricsRoutes from './routes/metrics.js';
import agentRoutes from './routes/agent.js';
import schedulesRoutes from './routes/schedules.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Auto-detect CORS origin based on environment
const getCorsOrigin = () => {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  if (NODE_ENV === 'production') {
    return 'https://cloudevy.in';
  } else {
    return 'http://localhost:8001';
  }
};

const CORS_ORIGIN = getCorsOrigin();

console.log('🌐 CORS Origin:', CORS_ORIGIN);
console.log('📊 Environment:', NODE_ENV);

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cloud-accounts', cloudAccountsRoutes);
app.use('/api/servers', serversRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/schedules', schedulesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CloudEvy Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
});

