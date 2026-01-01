#!/usr/bin/env node

/**
 * Cloudevy Downtime Scheduler Service
 * 
 * Handles scheduled start/stop actions for cloud servers
 * Version: 1.0.0
 */

import express from 'express';
import Scheduler from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 8003;

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   Cloudevy Downtime Scheduler Service v1.0.0    ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Port: ${PORT}`);
console.log('');

// Health check endpoint (required for Kubernetes readiness)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'downtime-scheduler',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check endpoint (checks DB connection)
app.get('/ready', async (req, res) => {
  try {
    // Import prisma dynamically to check connection
    const { default: prisma } = await import('./config/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Start HTTP server for health checks
app.listen(PORT, () => {
  console.log(`✅ Health check server listening on port ${PORT}`);
  console.log(`   GET http://localhost:${PORT}/health`);
  console.log(`   GET http://localhost:${PORT}/ready`);
  console.log('');
});

// Initialize and start scheduler
const scheduler = new Scheduler();

scheduler.start().catch(error => {
  console.error('💥 Fatal error starting scheduler:', error);
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('');
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await scheduler.stop();
    
    // Import prisma to disconnect
    const { default: prisma } = await import('./config/prisma.js');
    await prisma.$disconnect();
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('');
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await scheduler.stop();
    
    const { default: prisma } = await import('./config/prisma.js');
    await prisma.$disconnect();
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

