/**
 * Schedule Executor
 * 
 * Executes scheduled actions (stop, start, reboot) on cloud servers
 */

import {
  EC2Client,
  StopInstancesCommand,
  StartInstancesCommand,
  RebootInstancesCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2';
import prisma from './config/prisma.js';
import crypto from 'crypto';

/**
 * Execute a scheduled action
 */
export async function executeSchedule(schedule) {
  const startTime = Date.now();
  let status = 'success';
  let errorMsg = null;

  try {
    console.log(`🎯 Executing: ${schedule.action} on server "${schedule.server.name}" (ID: ${schedule.server.id})`);

    // Validate server and cloud account
    if (!schedule.server.cloudAccount) {
      throw new Error('Cloud account not found for server');
    }

    // Execute the action based on provider
    switch (schedule.server.provider) {
      case 'aws':
        await executeAWSAction(schedule);
        break;
      case 'azure':
        throw new Error('Azure support coming soon');
      case 'gcp':
        throw new Error('GCP support coming soon');
      default:
        throw new Error(`Unsupported provider: ${schedule.server.provider}`);
    }

    // Update server status in database after successful execution
    await updateServerStatus(schedule.server.id, schedule.action);

    console.log(`✅ Success: ${schedule.action} completed in ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    status = 'failed';
    errorMsg = error.message;
  }

  // Log execution to database
  try {
    await prisma.scheduleExecution.create({
      data: {
        scheduleId: schedule.id,
        action: schedule.action,
        status,
        errorMsg,
        duration: Date.now() - startTime
      }
    });
  } catch (dbError) {
    console.error('❌ Failed to log execution:', dbError);
  }
}

/**
 * Update server status in database based on action
 */
async function updateServerStatus(serverId, action) {
  try {
    let newStatus;
    
    switch (action) {
      case 'stop':
        newStatus = 'stopping';
        break;
      case 'start':
        newStatus = 'starting';
        break;
      case 'reboot':
        newStatus = 'rebooting';
        break;
      default:
        console.warn(`   ⚠️  Unknown action "${action}", not updating status`);
        return;
    }

    await prisma.server.update({
      where: { id: serverId },
      data: { status: newStatus }
    });

    console.log(`   📊 Database status updated to: ${newStatus}`);

  } catch (error) {
    console.error('   ⚠️  Failed to update server status in DB:', error.message);
    // Don't throw - this is non-critical
  }
}

/**
 * Execute AWS EC2 action
 */
async function executeAWSAction(schedule) {
  const { server, action } = schedule;

  // Validate instanceId
  if (!server.instanceId) {
    throw new Error('Server does not have an AWS instance ID');
  }

  // Create EC2 client
  const client = await getEC2Client(server.cloudAccount);

  // Check current instance state
  const currentState = await getInstanceState(client, server.instanceId);
  console.log(`   Current state: ${currentState}`);

  // Execute action based on type
  switch (action) {
    case 'stop':
      if (currentState === 'stopped' || currentState === 'stopping') {
        console.log('   ⏭️  Instance already stopped/stopping, skipping');
        return;
      }
      await stopInstance(client, server.instanceId);
      break;

    case 'start':
      if (currentState === 'running' || currentState === 'pending') {
        console.log('   ⏭️  Instance already running/starting, skipping');
        return;
      }
      await startInstance(client, server.instanceId);
      break;

    case 'reboot':
      if (currentState !== 'running') {
        throw new Error(`Cannot reboot instance in state: ${currentState}`);
      }
      await rebootInstance(client, server.instanceId);
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Get current instance state from AWS
 */
async function getInstanceState(client, instanceId) {
  try {
    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });

    const response = await client.send(command);

    if (!response.Reservations || response.Reservations.length === 0) {
      throw new Error('Instance not found in AWS');
    }

    const instance = response.Reservations[0].Instances[0];
    return instance.State?.Name || 'unknown';

  } catch (error) {
    console.error('   ⚠️  Failed to get instance state:', error.message);
    // Return unknown instead of throwing, so we can still attempt the action
    return 'unknown';
  }
}

/**
 * Stop EC2 instance
 */
async function stopInstance(client, instanceId) {
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId]
  });

  await client.send(command);
  console.log(`   ⏹️  Stop command sent for instance ${instanceId}`);
}

/**
 * Start EC2 instance
 */
async function startInstance(client, instanceId) {
  const command = new StartInstancesCommand({
    InstanceIds: [instanceId]
  });

  await client.send(command);
  console.log(`   ▶️  Start command sent for instance ${instanceId}`);
}

/**
 * Reboot EC2 instance
 */
async function rebootInstance(client, instanceId) {
  const command = new RebootInstancesCommand({
    InstanceIds: [instanceId]
  });

  await client.send(command);
  console.log(`   🔄 Reboot command sent for instance ${instanceId}`);
}

/**
 * Create EC2 client with decrypted credentials
 */
async function getEC2Client(cloudAccount) {
  try {
    // Validate cloud account exists
    if (!cloudAccount) {
      throw new Error('Cloud account is null or undefined');
    }

    console.log(`   🔑 Decrypting credentials for cloud account ID: ${cloudAccount.id}`);

    // Validate credentials field exists
    if (!cloudAccount.credentials) {
      throw new Error('Cloud account has no credentials field');
    }

    // Decrypt credentials
    const credentials = decryptCredentials(cloudAccount.credentials);
    const creds = JSON.parse(credentials);

    // Support both field naming conventions:
    // Backend stores as: { accessKey, secretKey }
    // AWS SDK expects: { accessKeyId, secretAccessKey }
    const accessKeyId = creds.accessKeyId || creds.accessKey;
    const secretAccessKey = creds.secretAccessKey || creds.secretKey;

    // Validate credentials
    if (!accessKeyId || !secretAccessKey) {
      console.error('   ❌ Decrypted credentials:', {
        hasAccessKeyId: !!accessKeyId,
        hasSecretAccessKey: !!secretAccessKey,
        credKeys: Object.keys(creds)
      });
      throw new Error('Invalid AWS credentials: missing accessKeyId or secretAccessKey');
    }

    console.log(`   ✅ Credentials validated, region: ${cloudAccount.region || 'us-east-1'}`);

    // Create and return EC2 client
    return new EC2Client({
      region: cloudAccount.region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

  } catch (error) {
    console.error('   ❌ getEC2Client error:', error.message);
    throw error;
  }
}

/**
 * Decrypt cloud account credentials
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
 * Get encryption key from environment
 */
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  // Hash to ensure 32 bytes for AES-256
  return crypto.createHash('sha256').update(envKey).digest();
}

