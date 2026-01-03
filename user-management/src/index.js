import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import invitationsRoutes from './routes/invitations.js';
import emailService from './services/email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8004;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8001',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  const emailReady = await emailService.testConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    emailService: emailReady ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/invitations', invitationsRoutes);

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
app.listen(PORT, async () => {
  console.log(`🚀 CloudEvy User Management Service running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  
  // Test email connection
  const emailReady = await emailService.testConnection();
  if (!emailReady) {
    console.warn('⚠️  Email service is not configured properly. Please check GMAIL_USER and GMAIL_APP_PASSWORD env vars.');
  }
});

