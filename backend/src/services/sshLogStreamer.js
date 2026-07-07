/**
 * SSH Log Streaming Service
 * Connects to EC2 instances via SSH and streams log files in real-time
 */

import { Client } from 'ssh2';
import crypto from 'crypto';

// Encryption key for SSH private keys (same as AWS credentials)
const ALGORITHM = 'aes-256-cbc';

/**
 * Get encryption key (32 bytes required for AES-256)
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
 * Encrypt SSH private key before storing in database
 */
export function encryptSSHKey(privateKey) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    encryptedAt: new Date().toISOString()
  });
}

/**
 * Decrypt SSH private key when establishing connection
 */
export function decryptSSHKey(encryptedData) {
  try {
    const data = JSON.parse(encryptedData);
    const key = getEncryptionKey();
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt SSH key: ' + error.message);
  }
}

/**
 * Available log files that can be streamed
 */
export const LOG_SOURCES = {
  syslog: { 
    command: 'if command -v journalctl > /dev/null 2>&1; then journalctl -f -n 100 --no-pager; elif [ -f /var/log/messages ]; then tail -f -n 100 /var/log/messages; elif [ -f /var/log/syslog ]; then tail -f -n 100 /var/log/syslog; else echo "❌ No system logs found"; sleep infinity; fi', 
    label: 'System Logs (All Messages)' 
  },
  authLog: { 
    command: 'if command -v journalctl > /dev/null 2>&1; then journalctl -f -n 100 --no-pager -u ssh -u sshd -u systemd-logind -g "sudo|su\\[|authentication"; elif [ -f /var/log/secure ]; then tail -f -n 100 /var/log/secure; elif [ -f /var/log/auth.log ]; then tail -f -n 100 /var/log/auth.log; else echo "❌ No auth logs found"; sleep infinity; fi', 
    label: 'Authentication & Security Logs' 
  },
  kernLog: { 
    command: 'if command -v journalctl > /dev/null 2>&1; then journalctl -f -n 100 --no-pager -k; elif command -v dmesg > /dev/null 2>&1; then dmesg -w; elif [ -f /var/log/kern.log ]; then tail -f -n 100 /var/log/kern.log; else echo "❌ No kernel logs found"; sleep infinity; fi', 
    label: 'Kernel & Hardware Logs' 
  },
  journalctl: { 
    command: 'if command -v journalctl > /dev/null 2>&1; then journalctl -f -n 100 --no-pager; else echo "❌ Journalctl not available on this system"; echo "💡 This system uses traditional log files instead"; sleep infinity; fi', 
    label: 'System Journal (All Services)' 
  },
  nginx_error: { 
    command: 'if [ -f /var/log/nginx/error.log ]; then tail -f -n 100 /var/log/nginx/error.log; else echo "❌ Nginx not found or not logging to /var/log/nginx/error.log"; echo "💡 Install nginx: sudo yum install nginx -y"; sleep infinity; fi', 
    label: 'Nginx Error Logs' 
  },
  nginx_access: { 
    command: 'if [ -f /var/log/nginx/access.log ]; then tail -f -n 100 /var/log/nginx/access.log; else echo "❌ Nginx not found or not logging to /var/log/nginx/access.log"; echo "💡 Install nginx: sudo yum install nginx -y"; sleep infinity; fi', 
    label: 'Nginx Access Logs' 
  },
  apache_error: { 
    command: 'if [ -f /var/log/httpd/error_log ]; then tail -f -n 100 /var/log/httpd/error_log; elif [ -f /var/log/apache2/error.log ]; then tail -f -n 100 /var/log/apache2/error.log; else echo "❌ Apache not found"; echo "💡 Install apache: sudo yum install httpd -y"; sleep infinity; fi', 
    label: 'Apache Error Logs' 
  },
  apache_access: { 
    command: 'if [ -f /var/log/httpd/access_log ]; then tail -f -n 100 /var/log/httpd/access_log; elif [ -f /var/log/apache2/access.log ]; then tail -f -n 100 /var/log/apache2/access.log; else echo "❌ Apache not found"; echo "💡 Install apache: sudo yum install httpd -y"; sleep infinity; fi', 
    label: 'Apache Access Logs' 
  },
  docker: { 
    command: 'if command -v docker > /dev/null 2>&1; then CONTAINER=$(docker ps -q | head -1); if [ -n "$CONTAINER" ]; then docker logs -f --tail 100 $CONTAINER 2>&1; else echo "❌ No running Docker containers"; echo "💡 Start a container: docker ps -a"; sleep infinity; fi; else echo "❌ Docker not installed"; echo "💡 Install docker: sudo yum install docker -y"; sleep infinity; fi', 
    label: 'Docker Container Logs' 
  },
  cloud_init: {
    command: 'if [ -f /var/log/cloud-init-output.log ]; then tail -f -n 100 /var/log/cloud-init-output.log; elif [ -f /var/log/cloud-init.log ]; then tail -f -n 100 /var/log/cloud-init.log; else echo "❌ Cloud-init logs not found"; echo "💡 This is normal if instance is fully initialized"; sleep infinity; fi',
    label: 'Cloud-Init Logs (EC2 Startup)'
  },
  user_data: {
    command: 'if [ -f /var/log/cloud-init-output.log ]; then echo "=== Cloud-Init Output (EC2 User Data) ==="; tail -n 500 /var/log/cloud-init-output.log; echo ""; echo "=== Live Updates ==="; tail -f -n 0 /var/log/cloud-init-output.log; else echo "❌ User data logs not found"; sleep infinity; fi',
    label: 'EC2 User Data Script Output'
  },
  system_services: {
    command: 'if command -v journalctl > /dev/null 2>&1; then journalctl -f -n 50 --no-pager --priority=warning; else echo "❌ Journalctl not available"; sleep infinity; fi',
    label: 'Service Errors & Warnings Only'
  }
};

/**
 * SSH Log Streamer Class
 * Manages SSH connection and log streaming
 */
export class SSHLogStreamer {
  constructor(config) {
    this.host = config.host;
    this.port = config.port || 22;
    this.username = config.username;
    this.privateKey = config.privateKey; // Already decrypted
    this.client = null;
    this.stream = null;
    this.onData = config.onData || (() => {});
    this.onError = config.onError || (() => {});
    this.onClose = config.onClose || (() => {});
  }

  /**
   * Connect to SSH server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.client = new Client();

      this.client.on('ready', () => {
        resolve();
      });

      this.client.on('error', (err) => {
        this.onError(err);
        reject(err);
      });

      this.client.on('close', () => {
        this.onClose();
      });

      try {
        this.client.connect({
          host: this.host,
          port: this.port,
          username: this.username,
          privateKey: this.privateKey,
          readyTimeout: 30000,
          keepaliveInterval: 10000
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start streaming a log file
   */
  async startStream(logSource) {
    if (!this.client) {
      throw new Error('SSH client not connected');
    }

    const source = LOG_SOURCES[logSource];
    if (!source) {
      throw new Error(`Unknown log source: ${logSource}`);
    }

    // Use command directly (all sources now use commands with fallbacks)
    const command = source.command;

    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          return reject(err);
        }

        this.stream = stream;

        stream.on('data', (data) => {
          const output = data.toString('utf8');
          this.onData(output);
        });

        stream.stderr.on('data', (data) => {
          const error = data.toString('utf8');
          this.onData(`[STDERR] ${error}`);
        });

        stream.on('close', () => {
          this.onClose();
        });

        resolve();
      });
    });
  }

  /**
   * Stop streaming and disconnect
   */
  disconnect() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.client && this.stream;
  }
}

/**
 * Stream manager to handle multiple active connections
 */
class StreamManager {
  constructor() {
    this.activeStreams = new Map(); // sessionId -> SSHLogStreamer
  }

  /**
   * Create and start a new stream
   */
  async createStream(sessionId, config, logSource) {
    // Close existing stream if any
    if (this.activeStreams.has(sessionId)) {
      this.stopStream(sessionId);
    }

    const streamer = new SSHLogStreamer(config);
    
    try {
      await streamer.connect();
      await streamer.startStream(logSource);
      this.activeStreams.set(sessionId, streamer);
      return streamer;
    } catch (error) {
      streamer.disconnect();
      throw error;
    }
  }

  /**
   * Stop a stream
   */
  stopStream(sessionId) {
    const streamer = this.activeStreams.get(sessionId);
    if (streamer) {
      streamer.disconnect();
      this.activeStreams.delete(sessionId);
    }
  }

  /**
   * Get active stream
   */
  getStream(sessionId) {
    return this.activeStreams.get(sessionId);
  }

  /**
   * Stop all streams
   */
  stopAll() {
    for (const [sessionId, streamer] of this.activeStreams) {
      streamer.disconnect();
    }
    this.activeStreams.clear();
  }
}

export const streamManager = new StreamManager();

