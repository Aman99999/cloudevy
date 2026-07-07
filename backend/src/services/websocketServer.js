/**
 * WebSocket Server for Real-Time Log Streaming and Cluster Creation Progress
 * Handles WebSocket connections for SSH log streaming and cluster creation updates
 */

import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { streamManager, LOG_SOURCES } from '../services/sshLogStreamer.js';
import { getServerSSHCredentials } from '../services/sshResolver.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Store active WebSocket connections for cluster creation
const clusterProgressConnections = new Map(); // clusterId -> Set of WebSocket connections

/**
 * Send cluster creation progress to all connected clients
 */
export function sendClusterProgress(clusterId, progress) {
  const connections = clusterProgressConnections.get(clusterId);
  if (connections && connections.size > 0) {
    const message = JSON.stringify({
      type: 'cluster_progress',
      clusterId,
      progress
    });
    
    connections.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    });
  }
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/logs'
  });

  wss.on('connection', async (ws, req) => {
    let sessionId = null;
    let authenticated = false;
    let userId = null;
    let workspaceId = null;

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to CloudEvy Log Streaming Server' 
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle authentication
        if (message.type === 'auth') {
          try {
            const token = message.token;
            const decoded = jwt.verify(token, JWT_SECRET);
            
            userId = decoded.userId;
            workspaceId = decoded.workspaceId;
            authenticated = true;
            
            ws.send(JSON.stringify({ 
              type: 'auth_success', 
              message: 'Authentication successful' 
            }));
          } catch (error) {
            ws.send(JSON.stringify({ 
              type: 'auth_error', 
              message: 'Authentication failed' 
            }));
            ws.close();
          }
          return;
        }

        // All other messages require authentication
        if (!authenticated) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Not authenticated' 
          }));
          return;
        }

        // Handle start streaming
        if (message.type === 'start_stream') {
          const { serverId, logSource } = message;
          
          if (!serverId || !logSource) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'serverId and logSource are required' 
            }));
            return;
          }

          try {
            // Get server with SSH credentials using new resolver
            const sshCredentials = await getServerSSHCredentials(parseInt(serverId), workspaceId);
            
            // Create unique session ID
            sessionId = `${workspaceId}-${serverId}-${Date.now()}`;

            // Start SSH stream
            await streamManager.createStream(
              sessionId,
              {
                host: sshCredentials.host,
                port: sshCredentials.port,
                username: sshCredentials.username,
                privateKey: sshCredentials.privateKey,
                onData: (data) => {
                  // Send log data to client
                  if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                      type: 'log_data',
                      data
                    }));
                  }
                },
                onError: (error) => {
                  ws.send(JSON.stringify({
                    type: 'stream_error',
                    message: error.message
                  }));
                },
                onClose: () => {
                  ws.send(JSON.stringify({
                    type: 'stream_closed',
                    message: 'SSH connection closed'
                  }));
                }
              },
              logSource
            );

            ws.send(JSON.stringify({
              type: 'stream_started',
              message: `Streaming ${LOG_SOURCES[logSource]?.label || logSource}`,
              logSource,
              sshSource: sshCredentials.source // Tell client where SSH creds came from
            }));

          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `Failed to start stream: ${error.message}`
            }));
          }
          return;
        }

        // Handle stop streaming
        if (message.type === 'stop_stream') {
          if (sessionId) {
            streamManager.stopStream(sessionId);
            ws.send(JSON.stringify({ 
              type: 'stream_stopped', 
              message: 'Stream stopped' 
            }));
          }
          return;
        }

        // Handle get available log sources
        if (message.type === 'get_log_sources') {
          ws.send(JSON.stringify({ 
            type: 'log_sources', 
            sources: Object.entries(LOG_SOURCES).map(([key, value]) => ({
              id: key,
              label: value.label
            }))
          }));
          return;
        }

        // Handle cluster progress subscription
        if (message.type === 'subscribe_cluster') {
          const { clusterId } = message;
          
          if (!clusterId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'clusterId is required' 
            }));
            return;
          }

          // Verify cluster belongs to user's workspace
          const cluster = await prisma.cluster.findFirst({
            where: {
              id: parseInt(clusterId),
              workspaceId
            }
          });

          if (!cluster) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Cluster not found' 
            }));
            return;
          }

          // Add connection to cluster progress subscribers
          if (!clusterProgressConnections.has(clusterId)) {
            clusterProgressConnections.set(clusterId, new Set());
          }
          clusterProgressConnections.get(clusterId).add(ws);

          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            clusterId,
            message: 'Subscribed to cluster progress' 
          }));
          return;
        }

      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      // Clean up stream if any
      if (sessionId) {
        streamManager.stopStream(sessionId);
      }
      
      // Clean up cluster progress subscriptions
      clusterProgressConnections.forEach((connections, clusterId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          clusterProgressConnections.delete(clusterId);
        }
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Clean up on server shutdown
  process.on('SIGTERM', () => {
    streamManager.stopAll();
    wss.close();
  });

  return wss;
}

