/**
 * SSH Resolution Helper
 * Resolves SSH credentials with priority: Server-level → Cloud Account-level
 */

import prisma from '../config/prisma.js';
import { decryptSSHKey } from './sshLogStreamer.js';

/**
 * Detect default SSH username based on platform/OS
 */
function detectDefaultUsername(platform) {
  if (!platform) return 'ec2-user';
  
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('ubuntu')) return 'ubuntu';
  if (platformLower.includes('debian')) return 'admin';
  if (platformLower.includes('centos')) return 'centos';
  if (platformLower.includes('rhel') || platformLower.includes('red hat')) return 'ec2-user';
  if (platformLower.includes('fedora')) return 'fedora';
  if (platformLower.includes('amazon') || platformLower.includes('linux')) return 'ec2-user';
  if (platformLower.includes('suse')) return 'ec2-user';
  
  return 'ec2-user'; // Default fallback
}

/**
 * Get SSH credentials for a server
 * Priority: Server-level SSH > Cloud Account-level SSH
 * 
 * @param {number} serverId - The server ID
 * @param {number} workspaceId - The workspace ID (for security)
 * @returns {Promise<{host: string, port: number, username: string, privateKey: string, source: string}>}
 */
export async function getServerSSHCredentials(serverId, workspaceId) {
  const server = await prisma.server.findFirst({
    where: {
      id: serverId,
      workspaceId
    },
    include: {
      cloudAccount: {
        select: {
          sshPrivateKey: true,
          sshUsername: true,
          sshPort: true
        }
      }
    }
  });

  if (!server) {
    throw new Error(`Server ${serverId} not found`);
  }

  if (!server.ipAddress) {
    throw new Error(`Server ${server.name} has no IP address`);
  }

  // Priority 1: Check server-level SSH credentials
  if (server.sshPrivateKey) {
    console.log(`✅ Using server-level SSH credentials for ${server.name} (ID: ${serverId})`);
    
    const defaultUsername = detectDefaultUsername(server.platform);
    
    return {
      serverId: server.id,
      host: server.ipAddress,
      port: server.sshPort || 22,
      username: server.sshUsername || defaultUsername,
      privateKey: decryptSSHKey(server.sshPrivateKey),
      source: 'server',
      server: {
        id: server.id,
        name: server.name,
        ipAddress: server.ipAddress,
        privateIpAddress: server.privateIpAddress,
        platform: server.platform
      }
    };
  }

  // Priority 2: Fall back to cloud account-level SSH credentials
  if (server.cloudAccount?.sshPrivateKey) {
    console.log(`ℹ️  Using cloud-account-level SSH credentials for ${server.name} (ID: ${serverId})`);
    
    const defaultUsername = detectDefaultUsername(server.platform);
    
    return {
      serverId: server.id,
      host: server.ipAddress,
      port: server.cloudAccount.sshPort || 22,
      username: server.cloudAccount.sshUsername || defaultUsername,
      privateKey: decryptSSHKey(server.cloudAccount.sshPrivateKey),
      source: 'cloud-account',
      server: {
        id: server.id,
        name: server.name,
        ipAddress: server.ipAddress,
        privateIpAddress: server.privateIpAddress,
        platform: server.platform
      }
    };
  }

  // No SSH credentials configured
  throw new Error(`No SSH credentials configured for server ${server.name} (ID: ${serverId}). Please configure SSH at server-level or cloud account-level.`);
}

/**
 * Get SSH credentials for multiple servers (used in cluster creation)
 * 
 * @param {number[]} serverIds - Array of server IDs
 * @param {number} workspaceId - The workspace ID
 * @returns {Promise<Map<number, {host, port, username, privateKey, source}>>}
 */
export async function getMultipleServerSSHCredentials(serverIds, workspaceId) {
  const credentialsMap = new Map();
  
  for (const serverId of serverIds) {
    try {
      const credentials = await getServerSSHCredentials(serverId, workspaceId);
      credentialsMap.set(serverId, credentials);
    } catch (error) {
      console.error(`Failed to get SSH credentials for server ${serverId}:`, error.message);
      throw error;
    }
  }
  
  return credentialsMap;
}

