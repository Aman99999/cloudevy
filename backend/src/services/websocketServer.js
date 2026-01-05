/**
 * WebSocket Server for Real-Time Log Streaming
 * Handles WebSocket connections and SSH log streaming
 */

import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { streamManager, decryptSSHKey, LOG_SOURCES } from '../services/sshLogStreamer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
            // Get server details
            const server = await prisma.server.findFirst({
              where: {
                id: parseInt(serverId),
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
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Server not found' 
              }));
              return;
            }

            if (!server.cloudAccount?.sshPrivateKey) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'SSH credentials not configured for this cloud account' 
              }));
              return;
            }

            if (!server.ipAddress && !server.instanceId) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Server has no IP address' 
              }));
              return;
            }

            // Decrypt SSH key
            const privateKey = decryptSSHKey(server.cloudAccount.sshPrivateKey);
            
            // Create unique session ID
            sessionId = `${workspaceId}-${serverId}-${Date.now()}`;

            // Start SSH stream
            await streamManager.createStream(
              sessionId,
              {
                host: server.ipAddress,
                port: server.cloudAccount.sshPort || 22,
                username: server.cloudAccount.sshUsername || 'ec2-user',
                privateKey: privateKey,
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
              logSource 
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

