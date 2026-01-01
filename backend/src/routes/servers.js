import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import crypto from 'crypto';
import { 
  EC2Client, 
  StopInstancesCommand, 
  StartInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2';
import { decryptCredentials } from './cloudAccounts.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Generate a secure API key for server agents
 */
function generateApiKey() {
  return 'ck_' + crypto.randomBytes(32).toString('hex');
}

/**
 * GET /api/servers
 * Get all servers for workspace
 */
router.get('/', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    const servers = await prisma.server.findMany({
      where: { workspaceId },
      include: {
        cloudAccount: {
          select: {
            id: true,
            accountName: true,
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate API keys for servers that don't have one
    const serversWithKeys = await Promise.all(servers.map(async (server) => {
      if (!server.apiKey) {
        const apiKey = generateApiKey();
        await prisma.server.update({
          where: { id: server.id },
          data: { apiKey }
        });
        return { ...server, apiKey };
      }
      return server;
    }));

    res.json({
      success: true,
      data: serversWithKeys
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers'
    });
  }
});

/**
 * POST /api/servers
 * Add a new server
 */
router.post(
  '/',
  [
    body('cloudAccountId')
      .isInt()
      .withMessage('Cloud account ID is required'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Server name is required and must be less than 255 characters'),
    body('ipAddress')
      .optional()
      .trim(),
    body('instanceType')
      .optional()
      .trim(),
    body('region')
      .optional()
      .trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { cloudAccountId, name, ipAddress, instanceType, region, instanceId } = req.body;
      const workspaceId = req.user.workspaceId;

      // Verify cloud account belongs to this workspace
      const cloudAccount = await prisma.cloudAccount.findFirst({
        where: {
          id: cloudAccountId,
          workspaceId
        }
      });

      if (!cloudAccount) {
        return res.status(404).json({
          success: false,
          message: 'Cloud account not found'
        });
      }

      // Check if server name already exists
      const existingServer = await prisma.server.findFirst({
        where: {
          workspaceId,
          name: name.trim()
        }
      });

      if (existingServer) {
        return res.status(409).json({
          success: false,
          message: 'A server with this name already exists'
        });
      }

      // Generate API key for monitoring agent
      const apiKey = generateApiKey();

      // Create server
      const server = await prisma.$transaction(async (tx) => {
        // Create the server
        const newServer = await tx.server.create({
          data: {
            workspaceId,
            cloudAccountId,
            name: name.trim(),
            ipAddress: ipAddress?.trim() || null,
            provider: cloudAccount.provider,
            region: region?.trim() || cloudAccount.region || null,
            instanceType: instanceType?.trim() || null,
            instanceId: instanceId?.trim() || null,
            apiKey: apiKey,
            status: 'running'
          },
          include: {
            cloudAccount: {
              select: {
                id: true,
                accountName: true,
                provider: true
              }
            }
          }
        });

        // Log the action
        await tx.auditLog.create({
          data: {
            workspaceId,
            userId: req.user.userId,
            action: 'server_added',
            resourceType: 'server',
            resourceId: newServer.id,
            details: JSON.stringify({
              name: name.trim(),
              provider: cloudAccount.provider,
              instanceId: instanceId
            })
          }
        });

        return newServer;
      });

      res.status(201).json({
        success: true,
        message: 'Server added successfully',
        data: server
      });

    } catch (error) {
      console.error('Add server error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add server. Please try again.'
      });
    }
  }
);

/**
 * POST /api/servers/create
 * Create a new server on cloud provider
 */
router.post(
  '/create',
  [
    body('cloudAccountId')
      .isInt()
      .withMessage('Cloud account ID is required'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Server name is required and must be less than 255 characters'),
    body('instanceType')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Instance type is required'),
    body('region')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Region is required'),
    body('operatingSystem')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Operating system is required'),
    body('storageSize')
      .isInt({ min: 8, max: 10000 })
      .withMessage('Storage size must be between 8 and 10000 GB')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { cloudAccountId, name, instanceType, region, operatingSystem, storageSize } = req.body;
      const workspaceId = req.user.workspaceId;

      // Verify cloud account belongs to this workspace
      const cloudAccount = await prisma.cloudAccount.findFirst({
        where: {
          id: cloudAccountId,
          workspaceId
        }
      });

      if (!cloudAccount) {
        return res.status(404).json({
          success: false,
          message: 'Cloud account not found'
        });
      }

      // Check if server name already exists
      const existingServer = await prisma.server.findFirst({
        where: {
          workspaceId,
          name: name.trim()
        }
      });

      if (existingServer) {
        return res.status(409).json({
          success: false,
          message: 'A server with this name already exists'
        });
      }

      // TODO: Implement actual cloud provider API calls to provision the server
      // For now, we'll create a placeholder server with "provisioning" status
      // In production, this would:
      // 1. Call AWS EC2 / Azure VM / GCP Compute Engine API
      // 2. Wait for provisioning to complete
      // 3. Get the actual IP address
      // 4. Update the server record

      const server = await prisma.$transaction(async (tx) => {
        // Create the server with provisioning status
        const newServer = await tx.server.create({
          data: {
            workspaceId,
            cloudAccountId,
            name: name.trim(),
            ipAddress: null, // Will be populated after provisioning
            provider: cloudAccount.provider,
            region: region.trim(),
            instanceType: instanceType.trim(),
            status: 'provisioning' // Status: provisioning -> running
          },
          include: {
            cloudAccount: {
              select: {
                id: true,
                accountName: true,
                provider: true
              }
            }
          }
        });

        // Log the action
        await tx.auditLog.create({
          data: {
            workspaceId,
            userId: req.user.userId,
            action: 'server_created',
            resourceType: 'server',
            resourceId: newServer.id,
            details: JSON.stringify({
              name: name.trim(),
              provider: cloudAccount.provider,
              instanceType: instanceType.trim(),
              region: region.trim(),
              operatingSystem,
              storageSize
            })
          }
        });

        // TODO: In a real implementation, you would:
        // 1. Queue a background job to provision the server
        // 2. Use cloud provider SDK (AWS SDK, Azure SDK, GCP SDK)
        // 3. Update server record when provisioning completes
        
        // Simulate provisioning completion (remove this in production)
        setTimeout(async () => {
          try {
            await tx.server.update({
              where: { id: newServer.id },
              data: { 
                status: 'running',
                ipAddress: generateMockIP() // Replace with actual IP from cloud provider
              }
            });
          } catch (err) {
            console.error('Failed to update server status:', err);
          }
        }, 5000);

        return newServer;
      });

      res.status(201).json({
        success: true,
        message: 'Server creation initiated. This may take a few minutes.',
        data: server
      });

    } catch (error) {
      console.error('Create server error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create server. Please try again.'
      });
    }
  }
);

/**
 * Helper function to generate mock IP (for demo purposes)
 * In production, this would come from the cloud provider
 */
function generateMockIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

/**
 * DELETE /api/servers/:id
 * Delete a server (removes from tracking only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

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

    // Delete server
    await prisma.$transaction(async (tx) => {
      await tx.server.delete({
        where: { id: serverId }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.userId,
          action: 'server_deleted',
          resourceType: 'server',
          resourceId: serverId,
          details: JSON.stringify({
            name: server.name
          })
        }
      });
    });

    res.json({
      success: true,
      message: 'Server deleted successfully'
    });

  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete server'
    });
  }
});

/**
 * Helper function to get EC2 client for a server
 */
async function getEC2Client(serverId, workspaceId) {
  // Get server with cloud account
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
    throw new Error('Server not found');
  }

  if (!server.instanceId) {
    throw new Error('Server does not have an associated cloud instance');
  }

  if (server.provider !== 'aws') {
    throw new Error(`Operation not supported for provider: ${server.provider}`);
  }

  // Decrypt credentials
  const credentials = JSON.parse(decryptCredentials(server.cloudAccount.credentials));

  // Create EC2 client
  const client = new EC2Client({
    region: server.region || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey
    }
  });

  return { client, server };
}

/**
 * POST /api/servers/:id/stop
 * Stop (pause) an EC2 instance
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Stop the instance
    const command = new StopInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    await client.send(command);

    // Update server status in database
    await prisma.$transaction(async (tx) => {
      await tx.server.update({
        where: { id: serverId },
        data: { status: 'stopping' }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.userId,
          action: 'server_stopped',
          resourceType: 'server',
          resourceId: serverId,
          details: JSON.stringify({
            name: server.name,
            instanceId: server.instanceId
          })
        }
      });
    });

    res.json({
      success: true,
      message: 'Server is stopping'
    });

  } catch (error) {
    console.error('Stop server error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop server'
    });
  }
});

/**
 * POST /api/servers/:id/start
 * Start a stopped EC2 instance
 */
router.post('/:id/start', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Start the instance
    const command = new StartInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    await client.send(command);

    // Update server status in database
    await prisma.$transaction(async (tx) => {
      await tx.server.update({
        where: { id: serverId },
        data: { status: 'starting' }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.userId,
          action: 'server_started',
          resourceType: 'server',
          resourceId: serverId,
          details: JSON.stringify({
            name: server.name,
            instanceId: server.instanceId
          })
        }
      });
    });

    res.json({
      success: true,
      message: 'Server is starting'
    });

  } catch (error) {
    console.error('Start server error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start server'
    });
  }
});

/**
 * POST /api/servers/:id/reboot
 * Reboot an EC2 instance
 */
router.post('/:id/reboot', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Reboot the instance
    const command = new RebootInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    await client.send(command);

    // Update server status in database
    await prisma.$transaction(async (tx) => {
      await tx.server.update({
        where: { id: serverId },
        data: { status: 'rebooting' }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.userId,
          action: 'server_rebooted',
          resourceType: 'server',
          resourceId: serverId,
          details: JSON.stringify({
            name: server.name,
            instanceId: server.instanceId
          })
        }
      });
    });

    res.json({
      success: true,
      message: 'Server is rebooting'
    });

  } catch (error) {
    console.error('Reboot server error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reboot server'
    });
  }
});

/**
 * DELETE /api/servers/:id/terminate
 * Terminate (permanently delete) an EC2 instance from AWS
 */
router.delete('/:id/terminate', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Terminate the instance
    const command = new TerminateInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    await client.send(command);

    // Update server status in database (mark as terminating, will be removed later)
    await prisma.$transaction(async (tx) => {
      await tx.server.update({
        where: { id: serverId },
        data: { status: 'terminating' }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.userId,
          action: 'server_terminated',
          resourceType: 'server',
          resourceId: serverId,
          details: JSON.stringify({
            name: server.name,
            instanceId: server.instanceId
          })
        }
      });
    });

    res.json({
      success: true,
      message: 'Server is being terminated. This action cannot be undone.'
    });

  } catch (error) {
    console.error('Terminate server error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to terminate server'
    });
  }
});

/**
 * GET /api/servers/:id/status
 * Get current status from AWS
 */
router.get('/:id/status', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Get instance status from AWS
    const command = new DescribeInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    const response = await client.send(command);
    
    if (!response.Reservations || response.Reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found in AWS'
      });
    }

    const instance = response.Reservations[0].Instances[0];
    const status = instance.State?.Name || 'unknown';

    // Update in database
    await prisma.server.update({
      where: { id: serverId },
      data: { status }
    });

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get server status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get server status'
    });
  }
});

/**
 * DELETE /api/servers/:id/agent
 * Remove/revoke monitoring agent
 */
router.delete('/:id/agent', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

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

    // Generate new API key (invalidates the old one)
    const newApiKey = crypto.randomBytes(32).toString('hex');

    // Update server - new API key and clear agent data
    await prisma.server.update({
      where: { id: serverId },
      data: {
        apiKey: 'ck_' + newApiKey,
        agentVersion: null,
        lastAgentContact: null
      }
    });

    res.json({
      success: true,
      message: 'Agent removed successfully. The agent will stop reporting within 30 seconds.'
    });

  } catch (error) {
    console.error('Remove agent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove agent'
    });
  }
});

// In-memory command storage (use Redis in production)
const agentCommands = new Map(); // serverId -> { command, timestamp }

/**
 * POST /api/servers/:id/agent/command
 * Send command to agent (restart, stop, uninstall)
 */
router.post('/:id/agent/command', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const { action } = req.body;

    // Validate action
    const validActions = ['restart', 'stop', 'uninstall'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

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

    // Store command (expires after 2 minutes)
    agentCommands.set(serverId, {
      command: action,
      timestamp: Date.now()
    });

    // Clean up old commands after 2 minutes
    setTimeout(() => {
      const stored = agentCommands.get(serverId);
      if (stored && stored.timestamp < Date.now() - 120000) {
        agentCommands.delete(serverId);
      }
    }, 120000);

    const messages = {
      restart: 'Restart command sent. Agent will restart in ~30 seconds.',
      stop: 'Stop command sent. Agent will stop monitoring in ~30 seconds.',
      uninstall: 'Uninstall command sent. Agent will remove itself in ~30 seconds.'
    };

    res.json({
      success: true,
      message: messages[action]
    });

  } catch (error) {
    console.error('Send agent command error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send command'
    });
  }
});

/**
 * GET /api/servers/:id/status
 * Get current status from AWS
 */
router.get('/:id/status', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const { client, server } = await getEC2Client(serverId, workspaceId);

    // Get instance status from AWS
    const command = new DescribeInstancesCommand({
      InstanceIds: [server.instanceId]
    });

    const response = await client.send(command);
    
    if (!response.Reservations || response.Reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found in AWS'
      });
    }

    const instance = response.Reservations[0].Instances[0];
    const status = instance.State?.Name || 'unknown';

    // Update local database if status changed
    if (server.status !== status) {
      await prisma.server.update({
        where: { id: serverId },
        data: { 
          status: status,
          ipAddress: instance.PublicIpAddress || server.ipAddress
        }
      });
    }

    res.json({
      success: true,
      data: {
        status: status,
        ipAddress: instance.PublicIpAddress,
        privateIpAddress: instance.PrivateIpAddress,
        stateTransitionReason: instance.StateTransitionReason
      }
    });

  } catch (error) {
    console.error('Get server status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get server status'
    });
  }
});

export { agentCommands };
export default router;

