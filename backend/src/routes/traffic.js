import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import trafficAnalyzer from '../services/trafficAnalyzer.js';

const router = express.Router();

/**
 * GET /api/traffic/server/:serverId/patterns
 * Get traffic patterns and AI-powered insights for a server
 */
router.get('/server/:serverId/patterns', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const days = parseInt(req.query.days) || 30; // Default 30 days

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId: workspaceId
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Get hourly traffic data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const hourlyData = await prisma.networkTrafficHourly.findMany({
      where: {
        serverId: serverId,
        hourTimestamp: {
          gte: startDate
        }
      },
      orderBy: {
        hourTimestamp: 'asc'
      }
    });

    // Analyze traffic patterns
    const analysis = trafficAnalyzer.analyzeTraffic(hourlyData, server);

    res.json(analysis);

  } catch (error) {
    console.error('Get traffic patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze traffic patterns',
      error: error.message
    });
  }
});

/**
 * GET /api/traffic/server/:serverId/hourly
 * Get raw hourly traffic data for charts
 */
router.get('/server/:serverId/hourly', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const days = parseInt(req.query.days) || 7;

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId: workspaceId
      },
      select: {
        id: true
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Get hourly data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const hourlyData = await prisma.networkTrafficHourly.findMany({
      where: {
        serverId: serverId,
        hourTimestamp: {
          gte: startDate
        }
      },
      orderBy: {
        hourTimestamp: 'asc'
      },
      select: {
        hourTimestamp: true,
        avgInMbps: true,
        avgOutMbps: true,
        maxInMbps: true,
        maxOutMbps: true,
        samplesCount: true
      }
    });

    res.json({
      success: true,
      data: hourlyData.map(h => ({
        timestamp: h.hourTimestamp,
        avgIn: parseFloat(h.avgInMbps),
        avgOut: parseFloat(h.avgOutMbps),
        maxIn: parseFloat(h.maxInMbps),
        maxOut: parseFloat(h.maxOutMbps),
        total: parseFloat(h.avgInMbps) + parseFloat(h.avgOutMbps),
        samples: h.samplesCount
      }))
    });

  } catch (error) {
    console.error('Get hourly traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hourly traffic data',
      error: error.message
    });
  }
});

/**
 * GET /api/traffic/server/:serverId/best-downtime
 * Get the best recommended time for scheduled downtime
 */
router.get('/server/:serverId/best-downtime', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId: workspaceId
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Get last 30 days of hourly data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const hourlyData = await prisma.networkTrafficHourly.findMany({
      where: {
        serverId: serverId,
        hourTimestamp: {
          gte: startDate
        }
      },
      orderBy: {
        hourTimestamp: 'asc'
      }
    });

    if (hourlyData.length < 24) {
      return res.json({
        success: true,
        available: false,
        message: 'Need at least 24 hours of data',
        recommendation: null
      });
    }

    // Analyze and get recommendations
    const analysis = trafficAnalyzer.analyzeTraffic(hourlyData, server);

    if (!analysis.success) {
      return res.json({
        success: true,
        available: false,
        message: analysis.message || 'Insufficient data',
        recommendation: null
      });
    }

    // Extract downtime window recommendation
    const downtimeRec = analysis.data.recommendations.find(r => r.type === 'downtime_window');

    if (!downtimeRec) {
      return res.json({
        success: true,
        available: false,
        message: 'No clear downtime window detected yet',
        recommendation: null
      });
    }

    res.json({
      success: true,
      available: true,
      recommendation: {
        window: downtimeRec.window,
        confidence: downtimeRec.confidence,
        reason: downtimeRec.reason,
        suggestedTime: downtimeRec.action?.time || '03:00',
        message: downtimeRec.message
      }
    });

  } catch (error) {
    console.error('Get best downtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get downtime recommendation',
      error: error.message
    });
  }
});

/**
 * DELETE /api/traffic/server/:serverId
 * Delete all traffic data for a server (for testing/cleanup)
 */
router.delete('/server/:serverId', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId: workspaceId
      },
      select: {
        id: true
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Delete all traffic records
    const result = await prisma.networkTrafficHourly.deleteMany({
      where: {
        serverId: serverId
      }
    });

    res.json({
      success: true,
      message: `Deleted ${result.count} traffic records`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Delete traffic data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete traffic data',
      error: error.message
    });
  }
});

export default router;

