import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { EC2Client, DescribeInstanceStatusCommand } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import crypto from 'crypto';

const router = express.Router();

// Store for real-time metrics (in-memory for now, should use Redis/InfluxDB in production)
const metricsCache = new Map();

/**
 * Decrypt credentials
 */
function decryptCredentials(encryptedData) {
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credentials');
  }
}

/**
 * Get encryption key
 */
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    return Buffer.from('cloudevy-dev-key-32-characters!!', 'utf8');
  }
  
  const keyBuffer = Buffer.from(envKey, 'utf8');
  if (keyBuffer.length !== 32) {
    return crypto.createHash('sha256').update(envKey).digest();
  }
  
  return keyBuffer;
}

// API Key authentication middleware for agents
async function authenticateAgent(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const serverId = req.headers['x-server-id'];
  
  if (!apiKey || !serverId) {
    return res.status(401).json({
      success: false,
      message: 'Missing API key or server ID'
    });
  }
  
  try {
    // Validate API key against database
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(serverId),
        apiKey: apiKey
      }
    });
    
    if (!server) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key or server ID'
      });
    }
    
    req.agentServerId = server.id;
    req.agentWorkspaceId = server.workspaceId;
    next();
  } catch (error) {
    console.error('Agent authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * POST /api/metrics/report
 * Receive metrics from monitoring agents
 * This endpoint does NOT require user authentication, uses API key instead
 */
router.post('/report', authenticateAgent, async (req, res) => {
  try {
    const metrics = req.body;
    const serverId = req.agentServerId;
    
    // Validate metrics data
    if (!metrics || !metrics.cpu || !metrics.memory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metrics data'
      });
    }
    
    // Store metrics in cache with timestamp
    metricsCache.set(serverId, {
      ...metrics,
      receivedAt: new Date().toISOString()
    });
    
    // Update agent version and status in database
    try {
      const updateData = {
        lastAgentContact: new Date()
      };
      
      if (metrics.version) {
        updateData.agentVersion = metrics.version;
      }
      
      // If agent is reporting, server is running
      updateData.status = 'running';
      
      await prisma.server.update({
        where: { id: serverId },
        data: updateData
      });
    } catch (dbError) {
      console.error('Failed to update agent version:', dbError);
      // Don't fail the request if DB update fails
    }
    
    // TODO: Store in InfluxDB for historical data
    // await influxDB.writePoints([{
    //   measurement: 'server_metrics',
    //   tags: { serverId },
    //   fields: metrics,
    //   timestamp: new Date()
    // }]);
    
    res.json({
      success: true,
      message: 'Metrics received',
      latestVersion: '1.2.0' // Current latest agent version
    });
    
  } catch (error) {
    console.error('Report metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process metrics'
    });
  }
});

// All other routes require user authentication
router.use(authenticate);

/**
 * GET /api/metrics/server/:serverId
 * Get current metrics for a specific server
 */
router.get('/server/:serverId', async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    // Verify server belongs to this workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId
      },
      include: {
        cloudAccount: true
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Try to get real metrics from cache first
    let metrics = metricsCache.get(serverId);
    
    if (metrics) {
      // Check if metrics are fresh (less than 30 seconds old)
      const age = Date.now() - new Date(metrics.receivedAt).getTime();
      if (age > 30000) {
        // Metrics are stale, mark as such
        metrics = {
          ...metrics,
          status: 'stale',
          message: 'Agent not reporting (last seen ' + Math.floor(age / 1000) + 's ago)'
        };
      }
    } else {
      // No real metrics available, try cloud provider or use mock
      try {
        if (server.provider === 'aws' && server.instanceId) {
          metrics = await fetchAWSMetrics(server);
        } else if (server.provider === 'azure') {
          metrics = await fetchAzureMetrics(server);
        } else if (server.provider === 'gcp') {
          metrics = await fetchGCPMetrics(server);
        } else {
          // Using mock metrics (no console.log to reduce noise)
          metrics = generateMockMetrics(server);
        }
      } catch (error) {
        console.error(`Failed to fetch cloud metrics for server ${serverId}:`, error.message);
        metrics = generateMockMetrics(server);
      }
    }

    res.json({
      success: true,
      data: {
        serverId: server.id,
        serverName: server.name,
        metrics,
        source: metrics.status === 'online' && metricsCache.has(serverId) ? 'agent' : 
                (metrics.source === 'cloudwatch' ? 'cloudwatch' : 'mock'),
        hasAgent: metricsCache.has(serverId)
      }
    });

  } catch (error) {
    console.error('Get server metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch server metrics'
    });
  }
});

/**
 * GET /api/metrics/server/:serverId/history
 * Get historical metrics for a server
 */
router.get('/server/:serverId/history', async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const timeRange = req.query.range || '1h'; // 1h, 6h, 24h, 7d

    // Verify server belongs to this workspace
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        workspaceId
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // TODO: Fetch from InfluxDB or time-series database
    // For now, generate mock historical data
    const history = generateMockHistory(timeRange);

    res.json({
      success: true,
      data: {
        serverId: server.id,
        serverName: server.name,
        timeRange,
        history
      }
    });

  } catch (error) {
    console.error('Get server metrics history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch server metrics history'
    });
  }
});

/**
 * GET /api/metrics/servers/summary
 * Get metrics summary for all servers in workspace (optimized)
 */
router.get('/servers/summary', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    // Set shorter timeout for this endpoint
    req.setTimeout(5000);

    const servers = await prisma.server.findMany({
      where: { 
        workspaceId,
        status: 'running'
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    // Generate summaries quickly without async operations
    const summaries = servers.map(server => {
      // Try to get real metrics from cache (synchronous)
      const cachedMetrics = metricsCache.get(server.id);
      
      let metrics;
      if (cachedMetrics) {
        const age = Date.now() - new Date(cachedMetrics.receivedAt).getTime();
        if (age < 30000) {
          // Fresh data from agent
          metrics = {
            status: 'online',
            cpu: cachedMetrics.cpu.usage,
            memory: cachedMetrics.memory.percentage,
            disk: cachedMetrics.disk.percentage
          };
        } else {
          // Stale data
          metrics = generateQuickMetrics(server);
        }
      } else {
        // No agent data, use mock (fast, deterministic)
        metrics = generateQuickMetrics(server);
      }
      
      return {
        serverId: server.id,
        serverName: server.name,
        status: server.status,
        metrics
      };
    });

    res.json({
      success: true,
      data: summaries
    });

  } catch (error) {
    console.error('Get servers metrics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers metrics summary',
      data: [] // Return empty array to prevent frontend crash
    });
  }
});

/**
 * Fetch metrics from AWS CloudWatch
 */
async function fetchAWSMetrics(server) {
  try {
    // Decrypt cloud account credentials
    const credentials = JSON.parse(decryptCredentials(server.cloudAccount.credentials));
    
    const cloudWatch = new CloudWatchClient({
      region: server.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey
      }
    });

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

    // Get EC2 instance ID from server (assumes it was stored when connecting)
    const instanceId = server.instanceId || server.name;

    // Fetch CPU Utilization
    const cpuCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Average']
    });

    const cpuData = await cloudWatch.send(cpuCommand);
    const cpuUsage = cpuData.Datapoints && cpuData.Datapoints.length > 0
      ? cpuData.Datapoints[0].Average
      : 0;

    // Fetch Network In
    const networkInCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'NetworkIn',
      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    });

    const networkInData = await cloudWatch.send(networkInCommand);
    const networkIn = networkInData.Datapoints && networkInData.Datapoints.length > 0
      ? networkInData.Datapoints[0].Average / (1024 * 1024) // Convert to MB/s
      : 0;

    // Fetch Network Out
    const networkOutCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'NetworkOut',
      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    });

    const networkOutData = await cloudWatch.send(networkOutCommand);
    const networkOut = networkOutData.Datapoints && networkOutData.Datapoints.length > 0
      ? networkOutData.Datapoints[0].Average / (1024 * 1024)
      : 0;

    return {
      status: 'online',
      cpu: {
        usage: parseFloat(cpuUsage.toFixed(1)),
        cores: 2 // CloudWatch doesn't provide this, would need EC2 API
      },
      memory: {
        used: 0, // AWS doesn't provide memory by default
        total: 8192,
        percentage: 0
      },
      disk: {
        used: 0, // AWS doesn't provide disk by default
        total: 100,
        percentage: 0
      },
      network: {
        inbound: parseFloat(networkIn.toFixed(2)),
        outbound: parseFloat(networkOut.toFixed(2))
      },
      uptime: 0, // Would need EC2 API
      loadAverage: [0, 0, 0], // Not available in CloudWatch
      timestamp: new Date().toISOString(),
      source: 'cloudwatch',
      note: 'CloudWatch provides limited metrics. Install agent for full metrics including Memory and Disk.'
    };

  } catch (error) {
    console.error('AWS CloudWatch error:', error);
    throw error;
  }
}

/**
 * Fetch metrics from Azure Monitor
 */
async function fetchAzureMetrics(server) {
  // TODO: Implement Azure Monitor integration
  return generateMockMetrics(server);
}

/**
 * Fetch metrics from GCP Cloud Monitoring
 */
async function fetchGCPMetrics(server) {
  // TODO: Implement GCP Cloud Monitoring integration
  return generateMockMetrics(server);
}

/**
 * Generate realistic mock metrics for demonstration
 * Optimized for speed
 */
function generateMockMetrics(server) {
  // Use server ID as seed for consistent but varied data
  const seed = server.id || 1;
  const variance = (seed * 7) % 30; // 0-30 based on server ID
  
  // ALWAYS show realistic data, even if server status is not 'running'
  // This is for demonstration purposes - in production with agent/CloudWatch, 
  // offline servers would show zeros
  
  const status = server.status === 'running' ? 'online' : 'offline';
  
  // Show reasonable metrics even for "offline" servers in demo mode
  return {
    status,
    cpu: {
      usage: 15 + variance,
      cores: 2
    },
    memory: {
      used: 3000 + (variance * 100),
      total: 8192,
      percentage: 37 + variance
    },
    disk: {
      used: 25 + (variance * 2),
      total: 100,
      percentage: 25 + (variance * 2)
    },
    network: {
      inbound: 1.5 + (variance * 0.1),
      outbound: 0.8 + (variance * 0.05)
    },
    uptime: 86400 * (5 + (seed % 10)),
    loadAverage: [
      parseFloat((1.2 + (variance * 0.05)).toFixed(2)),
      parseFloat((1.5 + (variance * 0.04)).toFixed(2)),
      parseFloat((1.8 + (variance * 0.03)).toFixed(2))
    ],
    diskIO: {
      read: parseFloat((Math.random() * 10).toFixed(2)),
      write: parseFloat((Math.random() * 15).toFixed(2))
    },
    topProcesses: [
      { pid: 1234, name: 'node', cpu: 15.5 + variance, memory: 8.2 },
      { pid: 5678, name: 'postgres', cpu: 12.3 + (variance * 0.5), memory: 12.5 },
      { pid: 9101, name: 'nginx', cpu: 8.7 + (variance * 0.3), memory: 3.8 },
      { pid: 1121, name: 'redis', cpu: 5.2 + (variance * 0.2), memory: 5.1 },
      { pid: 3141, name: 'docker', cpu: 3.8 + (variance * 0.1), memory: 2.9 }
    ],
    timestamp: new Date().toISOString(),
    note: 'Mock data - Install agent or configure CloudWatch for real metrics'
  };
}

/**
 * Generate quick metrics for server cards (optimized)
 */
function generateQuickMetrics(server) {
  const seed = server.id || 1;
  const variance = (seed * 7) % 30;
  
  // Always show reasonable data for demonstration
  return {
    status: server.status || 'running',
    cpu: 15 + variance,
    memory: 37 + variance,
    disk: 25 + (variance * 2)
  };
}

/**
 * Generate mock historical data
 */
function generateMockHistory(timeRange) {
  const ranges = {
    '1h': { points: 60, interval: 60 },      // 60 points, 1 minute apart
    '6h': { points: 72, interval: 300 },     // 72 points, 5 minutes apart
    '24h': { points: 96, interval: 900 },    // 96 points, 15 minutes apart
    '7d': { points: 168, interval: 3600 }    // 168 points, 1 hour apart
  };

  const config = ranges[timeRange] || ranges['1h'];
  const now = Date.now();
  const data = [];

  for (let i = config.points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * config.interval * 1000));
    data.push({
      timestamp: timestamp.toISOString(),
      cpu: parseFloat((Math.random() * 60 + 10).toFixed(1)),
      memory: parseFloat((Math.random() * 60 + 20).toFixed(1)),
      disk: parseFloat((Math.random() * 40 + 30).toFixed(1)),
      networkIn: parseFloat((Math.random() * 10).toFixed(2)),
      networkOut: parseFloat((Math.random() * 5).toFixed(2)),
      load1: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      load5: parseFloat((Math.random() * 2.5 + 0.8).toFixed(2)),
      load15: parseFloat((Math.random() * 2 + 1).toFixed(2)),
      diskRead: parseFloat((Math.random() * 20).toFixed(2)),
      diskWrite: parseFloat((Math.random() * 30).toFixed(2))
    });
  }

  return data;
}

/**
 * Helper: Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * GET /api/metrics/agent/commands
 * Agent polls this endpoint to check for pending commands
 */
router.get('/agent/commands', authenticateAgent, async (req, res) => {
  try {
    const serverId = req.agentServerId;
    
    // Import agentCommands from servers route
    const { agentCommands } = await import('./servers.js');
    
    const stored = agentCommands.get(serverId);
    
    if (stored && Date.now() - stored.timestamp < 120000) {
      // Command exists and not expired, send it and delete
      const { command } = stored;
      agentCommands.delete(serverId);
      
      return res.json({
        success: true,
        command
      });
    }
    
    // No pending command
    res.json({
      success: true,
      command: null
    });
    
  } catch (error) {
    console.error('Get agent command error:', error);
    res.json({
      success: true,
      command: null
    });
  }
});

export default router;

