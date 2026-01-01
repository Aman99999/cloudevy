import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import crypto from 'crypto';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get encryption key (32 bytes required for AES-256)
 * In production, use a secure key management service (AWS KMS, Azure Key Vault, etc.)
 */
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    console.warn('⚠️  ENCRYPTION_KEY not set! Using default key (NOT SECURE FOR PRODUCTION)');
    // Default key - MUST be changed in production
    return Buffer.from('cloudevy-dev-key-32-characters!!', 'utf8');
  }
  
  // Ensure key is exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(envKey, 'utf8');
  if (keyBuffer.length !== 32) {
    // Hash the key to get exactly 32 bytes
    return crypto.createHash('sha256').update(envKey).digest();
  }
  
  return keyBuffer;
}

/**
 * Encrypt credentials using AES-256-CBC
 * Format: iv:encrypted_data (both hex encoded)
 */
function encryptCredentials(secret) {
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // Initialization vector
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv:encrypted_data format
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt credentials (for use when making API calls)
 * Format: iv:encrypted_data (both hex encoded)
 */
function decryptCredentials(encryptedData) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = getEncryptionKey();
    
    // Split iv and encrypted data
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
 * POST /api/cloud-accounts/connect
 * Connect a new cloud account
 */
router.post(
  '/connect',
  [
    body('provider')
      .isIn(['aws', 'azure', 'gcp'])
      .withMessage('Provider must be aws, azure, or gcp'),
    body('accountName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Account name must be between 2 and 100 characters'),
    body('accessKey')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Access key is required'),
    body('secretKey')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Secret key is required'),
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

      const { provider, accountName, accessKey, secretKey, region } = req.body;
      const workspaceId = req.user.workspaceId;

      // Check if account name already exists for this workspace
      const existingAccount = await prisma.cloudAccount.findFirst({
        where: {
          workspaceId,
          accountName: accountName.trim()
        }
      });

      if (existingAccount) {
        return res.status(409).json({
          success: false,
          message: 'An account with this name already exists'
        });
      }

      // Encrypt credentials before storing
      // Credentials are encrypted using AES-256-CBC before being saved to database
      const credentialsToEncrypt = JSON.stringify({
        accessKey,
        secretKey,
        encryptedAt: new Date().toISOString()
      });
      const encryptedCredentials = encryptCredentials(credentialsToEncrypt);

      // Create cloud account
      const cloudAccount = await prisma.$transaction(async (tx) => {
        // Create the account
        const account = await tx.cloudAccount.create({
          data: {
            workspaceId,
            provider,
            accountName: accountName.trim(),
            credentials: encryptedCredentials,
            region: region || null,
            isActive: true
          }
        });

        // Log the action
        await tx.auditLog.create({
          data: {
            workspaceId,
            userId: req.user.userId,
            action: 'cloud_account_connected',
            resourceType: 'cloud_account',
            resourceId: account.id,
            details: JSON.stringify({
              provider,
              accountName: accountName.trim()
            })
          }
        });

        return account;
      });

      res.status(201).json({
        success: true,
        message: 'Cloud account connected successfully',
        data: {
          id: cloudAccount.id,
          provider: cloudAccount.provider,
          accountName: cloudAccount.accountName,
          region: cloudAccount.region,
          isActive: cloudAccount.isActive
        }
      });

    } catch (error) {
      console.error('Connect cloud account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect cloud account. Please try again.'
      });
    }
  }
);

/**
 * GET /api/cloud-accounts
 * Get all cloud accounts for workspace
 */
router.get('/', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    const accounts = await prisma.cloudAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        accountName: true,
        region: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Get cloud accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cloud accounts'
    });
  }
});

// Export decrypt function for use in other modules (e.g., AWS SDK integration)
export { decryptCredentials };

/**
 * GET /api/cloud-accounts/:id/servers
 * Fetch available servers from cloud provider
 */
router.get('/:id/servers', async (req, res) => {
  try {
    const cloudAccountId = parseInt(req.params.id);
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

    // Decrypt credentials
    const credentials = JSON.parse(decryptCredentials(cloudAccount.credentials));

    // Fetch servers based on provider
    let servers = [];
    
    try {
      if (cloudAccount.provider === 'aws') {
        servers = await fetchAWSServers(credentials, cloudAccount.region);
      } else if (cloudAccount.provider === 'azure') {
        servers = await fetchAzureServers(credentials);
      } else if (cloudAccount.provider === 'gcp') {
        servers = await fetchGCPServers(credentials);
      }
    } catch (error) {
      console.error(`Failed to fetch servers from ${cloudAccount.provider}:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch servers from ${cloudAccount.provider}. Please check your credentials.`,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: servers
    });

  } catch (error) {
    console.error('Fetch cloud servers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers from cloud provider'
    });
  }
});

/**
 * Fetch servers from AWS EC2
 */
async function fetchAWSServers(credentials, region) {
  try {
    const client = new EC2Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey
      }
    });

    const command = new DescribeInstancesCommand({});
    const response = await client.send(command);

    // Parse EC2 instances
    const servers = [];
    
    if (response.Reservations) {
      for (const reservation of response.Reservations) {
        for (const instance of reservation.Instances || []) {
          // Find Name tag
          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          const name = nameTag?.Value || instance.InstanceId;
          
          servers.push({
            id: instance.InstanceId,
            name: name,
            instanceType: instance.InstanceType,
            state: instance.State?.Name || 'unknown',
            publicIp: instance.PublicIpAddress || null,
            privateIp: instance.PrivateIpAddress || null,
            region: region || 'us-east-1',
            availabilityZone: instance.Placement?.AvailabilityZone || null,
            launchTime: instance.LaunchTime?.toISOString() || null
          });
        }
      }
    }

    return servers;
  } catch (error) {
    console.error('AWS API Error:', error);
    throw new Error(`Failed to fetch AWS servers: ${error.message}`);
  }
}

/**
 * Fetch servers from Azure
 */
async function fetchAzureServers(credentials) {
  // TODO: Implement actual Azure SDK integration
  // For now, return empty array - implement when Azure is needed
  
  console.log('Azure server fetching not yet implemented');
  return [];
  
  // In production, use Azure SDK:
  // import { ComputeManagementClient } from "@azure/arm-compute"
  // import { ClientSecretCredential } from "@azure/identity"
  // 
  // const credential = new ClientSecretCredential(
  //   credentials.tenantId,
  //   credentials.clientId,
  //   credentials.clientSecret
  // );
  // const client = new ComputeManagementClient(credential, credentials.subscriptionId);
  // const vms = await client.virtualMachines.listAll();
}

/**
 * Fetch servers from GCP
 */
async function fetchGCPServers(credentials) {
  // TODO: Implement actual GCP SDK integration
  // For now, return empty array - implement when GCP is needed
  
  console.log('GCP server fetching not yet implemented');
  return [];
  
  // In production, use GCP SDK:
  // import { InstancesClient } from '@google-cloud/compute'
  // const client = new InstancesClient({ 
  //   credentials: JSON.parse(credentials.privateKey)
  // });
  // const [instances] = await client.aggregatedList({ project: projectId });
}

export default router;

