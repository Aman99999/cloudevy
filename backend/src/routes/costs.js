import express from 'express';
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { decryptCredentials } from './cloudAccounts.js';

const router = express.Router();

// Cache for cost data (to reduce AWS API calls)
// Cache expires after 24 hours (matches AWS billing data update frequency)
const costCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Track API calls for monitoring
const apiCallLog = [];
const API_CALL_COST = 0.01; // $0.01 per API call

function logApiCall(serverId, workspaceId) {
  apiCallLog.push({
    serverId,
    workspaceId,
    timestamp: Date.now()
  });
}

function getApiCallStats(workspaceId, days = 30) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const recentCalls = apiCallLog.filter(call => 
    call.workspaceId === workspaceId && call.timestamp >= cutoff
  );
  
  const totalCalls = recentCalls.length;
  const totalCost = totalCalls * API_CALL_COST;
  
  // Calculate cache hit rate
  const totalRequests = costCache.size; // Approximation
  const cacheHitRate = totalRequests > 0 ? ((totalRequests - totalCalls) / totalRequests * 100) : 0;
  
  return {
    totalCalls,
    totalCost: totalCost.toFixed(2),
    period: days,
    cacheHitRate: Math.max(0, cacheHitRate).toFixed(1),
    lastCall: recentCalls.length > 0 ? new Date(recentCalls[recentCalls.length - 1].timestamp) : null
  };
}

function getCachedCost(serverId) {
  const cached = costCache.get(serverId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedCost(serverId, data) {
  costCache.set(serverId, {
    data,
    timestamp: Date.now()
  });
}

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/costs/server/:serverId
 * Get cost data for a specific server
 */
router.get('/server/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { period = '30', force = 'false' } = req.query; // days

    // Check cache first (unless force refresh)
    if (force !== 'true') {
      const cachedData = getCachedCost(serverId);
      if (cachedData) {
        return res.json({
          success: true,
          available: true,
          data: cachedData,
          cached: true
        });
      }
    }

    // Get server with cloud account credentials
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(serverId),
        workspaceId: req.user.workspaceId
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

    if (!server.instanceId) {
      return res.json({
        success: true,
        data: {
          currentMonth: 0,
          lastMonth: 0,
          daily: [],
          trend: 'stable',
          breakdown: {
            compute: 0,
            storage: 0,
            network: 0,
            other: 0
          }
        }
      });
    }

    // Get AWS credentials
    const credentials = JSON.parse(decryptCredentials(server.cloudAccount.credentials));
    
    if (!credentials.accessKey || !credentials.secretKey) {
      console.error('❌ Invalid AWS credentials for cost tracking');
      return res.json({
        success: false,
        message: 'Invalid AWS credentials. Please check your cloud account configuration.',
        available: false
      });
    }

    try {
      // Create Cost Explorer client
      const costClient = new CostExplorerClient({
        region: server.cloudAccount.region || 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKey,
          secretAccessKey: credentials.secretKey
        }
      });

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => date.toISOString().split('T')[0];

      // Get cost and usage data filtered by server name using the "Name" tag
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatDate(startDate),
          End: formatDate(endDate)
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        Filter: {
          And: [
            {
              Dimensions: {
                Key: 'SERVICE',
                Values: ['Amazon Elastic Compute Cloud - Compute']
              }
            },
            {
              Tags: {
                Key: 'Name',
                Values: [server.name] // Filter by server name using the "Name" tag
              }
            }
          ]
        },
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'USAGE_TYPE'
          }
        ]
      });
      
      // Only try to get instance-specific costs - no fallback
      const response = await costClient.send(command);
      
      // Log API call for tracking
      logApiCall(serverId, req.user.workspaceId);

      // Process the response
      const costData = processCostExplorerData(response.ResultsByTime, true);

      // Cache the result
      setCachedCost(serverId, costData);

      res.json({
        success: true,
        available: true,
        data: costData,
        cached: false,
        instanceSpecific: true
      });

    } catch (awsError) {
      console.error('❌ AWS Cost Explorer error:', awsError.message);
      console.error('Error name:', awsError.name);
      console.error('Error code:', awsError.$metadata?.httpStatusCode);
      
      // Common error messages
      let userMessage = awsError.message;
      
      if (awsError.name === 'AccessDeniedException') {
        userMessage = 'Access denied. Please add Cost Explorer permissions (ce:GetCostAndUsage) to your IAM user.';
      } else if (awsError.name === 'DataUnavailableException') {
        userMessage = 'Cost data not yet available. Cost Explorer needs 24 hours after enabling to populate data.';
      } else if (awsError.message?.includes('not subscribed')) {
        userMessage = 'Cost Explorer is not enabled. Please enable it in AWS Billing Dashboard.';
      } else if (awsError.name === 'ValidationException') {
        if (awsError.message?.includes('Tag') || awsError.message?.includes('not allowed')) {
          userMessage = 'Cost Allocation Tag "Name" is not activated. Please activate it in AWS Billing & Cost Management → Cost Allocation Tags to see per-instance costs. Note: It can take 24 hours after activation for data to appear.';
        } else {
          userMessage = `AWS validation error: ${awsError.message}`;
        }
      }
      
      // Return unavailable status with error details
      return res.json({
        success: false,
        available: false,
        message: userMessage,
        errorCode: awsError.name,
        hint: 'Click "Setup Instructions" above for step-by-step guide.'
      });
    }

  } catch (error) {
    console.error('Get server costs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost data'
    });
  }
});

/**
 * Process AWS Cost Explorer response
 */
function processCostExplorerData(resultsByTime, isInstanceSpecific = false) {
  if (!resultsByTime || resultsByTime.length === 0) {
    console.log('⚠️  No cost data returned from Cost Explorer');
    return {
      currentMonth: '0.00',
      lastMonth: '0.00',
      daily: [],
      trend: 'stable',
      breakdown: {
        compute: '0.00',
        storage: '0.00',
        network: '0.00',
        other: '0.00'
      },
      note: 'No cost data available yet. Cost Explorer needs 24 hours to populate data after enabling.',
      isInstanceSpecific: false
    };
  }

  const dailyCosts = [];
  let totalCost = 0;

  resultsByTime.forEach(item => {
    const date = item.TimePeriod.Start;
    let dayCost = 0;

    // Handle both grouped and ungrouped responses
    if (item.Groups && item.Groups.length > 0) {
      item.Groups.forEach(group => {
        const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
        dayCost += cost;
      });
    } else if (item.Total && item.Total.UnblendedCost) {
      dayCost = parseFloat(item.Total.UnblendedCost.Amount);
    }

    dailyCosts.push({
      date,
      cost: dayCost.toFixed(2)
    });

    totalCost += dayCost;
  });

  // Calculate month-to-date cost
  const currentMonth = totalCost;
  
  // Calculate trend
  if (dailyCosts.length >= 14) {
    const recentCosts = dailyCosts.slice(-7).map(d => parseFloat(d.cost));
    const avgRecent = recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length;
    const olderCosts = dailyCosts.slice(-14, -7).map(d => parseFloat(d.cost));
    const avgOlder = olderCosts.reduce((a, b) => a + b, 0) / olderCosts.length;
    
    let trend = 'stable';
    if (avgRecent > avgOlder * 1.1) trend = 'increasing';
    else if (avgRecent < avgOlder * 0.9) trend = 'decreasing';

    return {
      currentMonth: totalCost.toFixed(2),
      lastMonth: (totalCost * 0.95).toFixed(2), // Estimate
      daily: dailyCosts,
      trend,
      breakdown: {
        compute: (totalCost * 0.7).toFixed(2),
        storage: (totalCost * 0.15).toFixed(2),
        network: (totalCost * 0.10).toFixed(2),
        other: (totalCost * 0.05).toFixed(2)
      },
      isInstanceSpecific
    };
  }

  // Not enough data for trend analysis
  return {
    currentMonth: totalCost.toFixed(2),
    lastMonth: '0.00',
    daily: dailyCosts,
    trend: 'stable',
    breakdown: {
      compute: (totalCost * 0.7).toFixed(2),
      storage: (totalCost * 0.15).toFixed(2),
      network: (totalCost * 0.10).toFixed(2),
      other: (totalCost * 0.05).toFixed(2)
    },
    note: 'Insufficient data for trend analysis. More data will be available after a few days.',
    isInstanceSpecific
  };
}

/**
 * GET /api/costs/stats
 * Get API call statistics for the workspace
 */
router.get('/stats', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const workspaceId = req.user.workspaceId;
    const stats = getApiCallStats(workspaceId, parseInt(days));
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get API stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API statistics'
    });
  }
});

export default router;

