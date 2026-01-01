#!/usr/bin/env node

/**
 * Cloudevy Monitoring Agent v1.2.0
 * 
 * Collects system metrics and sends them to Cloudevy backend
 */

import os from 'os';
import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const AGENT_VERSION = '1.2.0';

const config = {
  serverId: process.env.CLOUDEVY_SERVER_ID,
  apiKey: process.env.CLOUDEVY_API_KEY,
  apiUrl: process.env.CLOUDEVY_API_URL || 'https://cloudevy.in/api',
  interval: 5000,
  version: AGENT_VERSION
};

// Validate required config
if (!config.serverId || !config.apiKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDEVY_SERVER_ID and CLOUDEVY_API_KEY must be set');
  process.exit(1);
}

console.log('🚀 Cloudevy Monitoring Agent Starting...');
console.log(`📦 Version: ${AGENT_VERSION}`);
console.log(`📊 Server ID: ${config.serverId}`);
console.log(`🌐 API URL: ${config.apiUrl}`);
console.log('');

// Track previous stats for rate calculations
let previousNetworkStats = null;
let previousDiskIO = null;
let previousTime = Date.now();

/**
 * Get CPU usage percentage
 */
async function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return {
    usage: parseFloat(usage.toFixed(1)),
    cores: cpus.length
  };
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();
  
  return {
    used: Math.round(usedMem / 1024 / 1024),
    total: Math.round(totalMem / 1024 / 1024),
    percentage: parseFloat(((usedMem / totalMem) * 100).toFixed(1))
  };
}

/**
 * Get disk usage
 */
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2,$3,$5}'");
    const [total, used, percentage] = stdout.trim().split(' ');
    
    return {
      total: parseFloat(total),
      used: parseFloat(used),
      percentage: parseFloat(percentage)
    };
  } catch (error) {
    return { total: 0, used: 0, percentage: 0 };
  }
}

/**
 * Get network usage rates
 */
async function getNetworkUsage() {
  try {
    const { stdout } = await execAsync("cat /proc/net/dev | tail -n +3");
    const lines = stdout.trim().split('\n');
    let totalRx = 0, totalTx = 0;
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10) {
        totalRx += parseInt(parts[1]) || 0;
        totalTx += parseInt(parts[9]) || 0;
      }
    });
    
    const currentTime = Date.now();
    const timeDiff = (currentTime - previousTime) / 1000;
    let inboundRate = 0, outboundRate = 0;
    
    if (previousNetworkStats && timeDiff > 0) {
      const rxDiff = totalRx - previousNetworkStats.rx;
      const txDiff = totalTx - previousNetworkStats.tx;
      inboundRate = (rxDiff / timeDiff) / (1024 * 1024);
      outboundRate = (txDiff / timeDiff) / (1024 * 1024);
    }
    
    previousNetworkStats = { rx: totalRx, tx: totalTx };
    previousTime = currentTime;
    
    return {
      inbound: parseFloat(inboundRate.toFixed(2)),
      outbound: parseFloat(outboundRate.toFixed(2))
    };
  } catch (error) {
    return { inbound: 0, outbound: 0 };
  }
}

/**
 * Get disk I/O rates
 */
async function getDiskIO() {
  try {
    const { stdout } = await execAsync("cat /proc/diskstats | grep -E '(sda|xvda|nvme0n1)' | head -1");
    const parts = stdout.trim().split(/\s+/);
    
    if (parts.length >= 14) {
      const sectorsRead = parseInt(parts[5]) || 0;
      const sectorsWritten = parseInt(parts[9]) || 0;
      const currentTime = Date.now();
      const timeDiff = (currentTime - previousTime) / 1000;
      
      let readRate = 0, writeRate = 0;
      
      if (previousDiskIO && timeDiff > 0) {
        const readDiff = sectorsRead - previousDiskIO.read;
        const writeDiff = sectorsWritten - previousDiskIO.write;
        readRate = (readDiff * 512) / (1024 * 1024) / timeDiff;
        writeRate = (writeDiff * 512) / (1024 * 1024) / timeDiff;
      }
      
      previousDiskIO = { read: sectorsRead, write: sectorsWritten };
      
      return {
        read: Math.max(0, parseFloat(readRate.toFixed(2))),
        write: Math.max(0, parseFloat(writeRate.toFixed(2)))
      };
    }
  } catch (error) {}
  
  return { read: 0, write: 0 };
}

/**
 * Get top processes by CPU usage
 */
async function getTopProcesses() {
  try {
    const { stdout } = await execAsync("ps aux --sort=-%cpu | head -6 | tail -5 | awk '{print $2,$11,$3,$4}'");
    const lines = stdout.trim().split('\n');
    
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[0]) || 0,
        name: parts[1] || 'unknown',
        cpu: parseFloat(parts[2]) || 0,
        memory: parseFloat(parts[3]) || 0
      };
    }).filter(p => p.pid > 0);
  } catch (error) {
    return [];
  }
}

/**
 * Collect all metrics
 */
async function collectMetrics() {
  const [cpu, disk, network, diskIO, topProcesses] = await Promise.all([
    getCPUUsage(),
    getDiskUsage(),
    getNetworkUsage(),
    getDiskIO(),
    getTopProcesses()
  ]);
  
  const memory = getMemoryUsage();
  const uptime = Math.floor(os.uptime());
  const loadAverage = os.loadavg().map(l => parseFloat(l.toFixed(2)));
  
  return {
    serverId: config.serverId,
    timestamp: new Date().toISOString(),
    status: 'online',
    version: AGENT_VERSION,
    cpu,
    memory,
    disk,
    network,
    uptime,
    loadAverage,
    diskIO,
    topProcesses
  };
}

/**
 * Send metrics to backend
 */
function sendMetrics(metrics) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiUrl + '/metrics/report');
    const protocol = url.protocol === 'https:' ? https : http;
    const data = JSON.stringify(metrics);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-API-Key': config.apiKey,
        'X-Server-ID': config.serverId
      },
      timeout: 5000
    };
    
    const req = protocol.request(options, (res) => {
      if (res.statusCode === 200) {
        process.stdout.write('.');
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Timeout')));
    req.write(data);
    req.end();
  });
}

/**
 * Check for pending commands from backend
 */
async function checkCommands() {
  try {
    const url = new URL(config.apiUrl + '/metrics/agent/commands');
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'X-Server-ID': config.serverId
      },
      timeout: 5000
    };
    
    return new Promise((resolve) => {
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.command) {
              handleCommand(response.command);
            }
          } catch (e) {}
          resolve();
        });
      });
      
      req.on('error', () => resolve());
      req.on('timeout', () => resolve());
      req.end();
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Handle commands from backend
 */
function handleCommand(command) {
  console.log(`\n📩 Received command: ${command}`);
  
  switch (command) {
    case 'restart':
      console.log('🔄 Restarting agent...');
      process.exit(0); // Docker will auto-restart with --restart unless-stopped
      break;
      
    case 'stop':
      console.log('⏹️  Stopping agent...');
      process.exit(0);
      break;
      
    case 'uninstall':
      console.log('🗑️  Uninstalling agent...');
      // Execute self-removal
      exec('sleep 2 && docker stop cloudevy-agent && docker rm cloudevy-agent', (error) => {
        if (error) {
          console.error('Failed to uninstall:', error.message);
        }
      });
      process.exit(0);
      break;
      
    default:
      console.log(`⚠️  Unknown command: ${command}`);
  }
}

/**
 * Start monitoring loop
 */
async function startMonitoring() {
  console.log('✅ Monitoring started\n');
  
  // Send initial metrics
  try {
    const metrics = await collectMetrics();
    await sendMetrics(metrics);
  } catch (error) {
    console.error('❌ Initial send failed:', error.message);
  }
  
  // Continue on interval
  setInterval(async () => {
    try {
      const metrics = await collectMetrics();
      await sendMetrics(metrics);
    } catch (error) {
      console.error('\n❌ Error:', error.message);
    }
  }, config.interval);
  
  // Check for commands every 30 seconds
  setInterval(async () => {
    try {
      await checkCommands();
    } catch (error) {
      // Silent fail
    }
  }, 30000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping agent...');
  process.exit(0);
});

// Start
startMonitoring().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

