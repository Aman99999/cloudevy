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
  DescribeInstancesCommand,
  ModifyInstanceAttributeCommand,
  DescribeVolumesCommand,
  ModifyVolumeCommand
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
    await updateServerStatus(schedule.server.id, schedule.action, schedule.targetInstanceType);

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
async function updateServerStatus(serverId, action, targetInstanceType = null) {
  try {
    let newStatus;
    const updateData = {};
    
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
      case 'scale_down':
      case 'scale_up':
        newStatus = 'scaling';
        // Update instance type in database if provided
        if (targetInstanceType) {
          updateData.instanceType = targetInstanceType;
        }
        break;
      default:
        console.warn(`   ⚠️  Unknown action "${action}", not updating status`);
        return;
    }

    updateData.status = newStatus;

    await prisma.server.update({
      where: { id: serverId },
      data: updateData
    });

    console.log(`   📊 Database status updated to: ${newStatus}${targetInstanceType ? ` with instance type: ${targetInstanceType}` : ''}`);

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

    case 'scale_down':
    case 'scale_up':
      // Handle instance type modification if specified
      if (schedule.targetInstanceType) {
        await modifyInstanceType(client, server.instanceId, schedule.targetInstanceType, currentState);
      }
      
      // Handle EBS volume modification if specified
      if (schedule.targetVolumeSize || schedule.targetVolumeType || schedule.targetVolumeIops || schedule.targetVolumeThroughput) {
        await modifyEBSVolume(client, server.instanceId, {
          size: schedule.targetVolumeSize,
          volumeType: schedule.targetVolumeType,
          iops: schedule.targetVolumeIops,
          throughput: schedule.targetVolumeThroughput
        });
      }
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
 * Modify EC2 instance type (scale up/down)
 * NOTE: Instance must be stopped before modifying instance type
 */
async function modifyInstanceType(client, instanceId, targetInstanceType, currentState) {
  if (!targetInstanceType) {
    throw new Error('Target instance type not specified');
  }

  console.log(`   🔧 Modifying instance type to: ${targetInstanceType}`);
  
  // Step 1: Stop the instance if it's running
  const needsStop = currentState === 'running' || currentState === 'pending';
  if (needsStop) {
    console.log(`   ⏹️  Stopping instance before modification...`);
    await stopInstance(client, instanceId);
    
    // Wait for instance to stop (AWS requires stopped state)
    await waitForInstanceState(client, instanceId, 'stopped', 180000); // 3 minutes timeout
  }

  // Step 2: Modify the instance type
  const modifyCommand = new ModifyInstanceAttributeCommand({
    InstanceId: instanceId,
    InstanceType: {
      Value: targetInstanceType
    }
  });

  await client.send(modifyCommand);
  console.log(`   ✅ Instance type modified to: ${targetInstanceType}`);

  // Step 3: Start the instance again if it was running
  if (needsStop) {
    console.log(`   ▶️  Starting instance after modification...`);
    await startInstance(client, instanceId);
  }
}

/**
 * Wait for instance to reach desired state
 */
async function waitForInstanceState(client, instanceId, desiredState, timeout = 180000) {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < timeout) {
    const currentState = await getInstanceState(client, instanceId);
    
    if (currentState === desiredState) {
      console.log(`   ✅ Instance reached state: ${desiredState}`);
      return;
    }

    console.log(`   ⏳ Waiting for state "${desiredState}"... Current: ${currentState}`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for instance to reach state: ${desiredState}`);
}

/**
 * Modify EBS Volume (can be done while instance is running!)
 * Supports: Size, Type, IOPS, Throughput
 */
async function modifyEBSVolume(client, instanceId, options) {
  const { size, volumeType, iops, throughput } = options;
  
  console.log(`   💾 Modifying EBS volume...`);
  
  try {
    // Step 1: Get the root volume ID from the instance
    const volumeId = await getRootVolumeId(client, instanceId);
    
    if (!volumeId) {
      throw new Error('Could not find root volume for instance');
    }
    
    console.log(`   📀 Root volume ID: ${volumeId}`);
    
    // Step 2: Get current volume details
    const currentVolume = await getVolumeDetails(client, volumeId);
    console.log(`   📊 Current volume: ${currentVolume.VolumeType}, ${currentVolume.Size}GB`);
    
    // Step 3: Build modification request
    const modifyParams = {
      VolumeId: volumeId
    };
    
    if (size && size !== currentVolume.Size) {
      if (size < currentVolume.Size) {
        console.warn(`   ⚠️  Cannot shrink volume from ${currentVolume.Size}GB to ${size}GB. Skipping size modification.`);
      } else {
        modifyParams.Size = size;
        console.log(`   📈 Changing size: ${currentVolume.Size}GB → ${size}GB`);
      }
    }
    
    if (volumeType && volumeType !== currentVolume.VolumeType) {
      modifyParams.VolumeType = volumeType;
      console.log(`   🔄 Changing type: ${currentVolume.VolumeType} → ${volumeType}`);
    }
    
    if (iops !== undefined && iops !== currentVolume.Iops) {
      modifyParams.Iops = iops;
      console.log(`   ⚡ Changing IOPS: ${currentVolume.Iops} → ${iops}`);
    }
    
    if (throughput !== undefined && throughput !== currentVolume.Throughput) {
      modifyParams.Throughput = throughput;
      console.log(`   🚀 Changing throughput: ${currentVolume.Throughput} → ${throughput} MB/s`);
    }
    
    // Check if there are any actual changes
    if (Object.keys(modifyParams).length === 1) {
      console.log(`   ⏭️  No volume modifications needed`);
      return;
    }
    
    // Step 4: Modify the volume
    const modifyCommand = new ModifyVolumeCommand(modifyParams);
    const result = await client.send(modifyCommand);
    
    console.log(`   ✅ EBS volume modification initiated`);
    console.log(`   ℹ️  Modification state: ${result.VolumeModification?.ModificationState}`);
    console.log(`   ℹ️  Volume will optimize in the background (no downtime)`);
    
  } catch (error) {
    console.error(`   ❌ Failed to modify EBS volume:`, error.message);
    throw error;
  }
}

/**
 * Get root volume ID for an instance
 */
async function getRootVolumeId(client, instanceId) {
  try {
    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });
    
    const response = await client.send(command);
    
    if (!response.Reservations || response.Reservations.length === 0) {
      throw new Error('Instance not found');
    }
    
    const instance = response.Reservations[0].Instances[0];
    const rootDevice = instance.RootDeviceName;
    
    // Find the root volume
    const rootVolume = instance.BlockDeviceMappings?.find(
      mapping => mapping.DeviceName === rootDevice
    );
    
    return rootVolume?.Ebs?.VolumeId;
    
  } catch (error) {
    console.error('   ⚠️  Failed to get root volume ID:', error.message);
    throw error;
  }
}

/**
 * Get volume details
 */
async function getVolumeDetails(client, volumeId) {
  try {
    const command = new DescribeVolumesCommand({
      VolumeIds: [volumeId]
    });
    
    const response = await client.send(command);
    
    if (!response.Volumes || response.Volumes.length === 0) {
      throw new Error('Volume not found');
    }
    
    return response.Volumes[0];
    
  } catch (error) {
    console.error('   ⚠️  Failed to get volume details:', error.message);
    throw error;
  }
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

