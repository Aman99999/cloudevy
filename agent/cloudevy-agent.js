#!/usr/bin/env node

/**
 * Cloudevy Monitoring Agent
 * 
 * This lightweight agent collects system metrics and sends them to Cloudevy.
 * Run this on your servers to get real-time monitoring data.
 * 
 * Installation:
 *   npm install os-utils axios
 *   node cloudevy-agent.js --server-id YOUR_SERVER_ID --api-url https://your-cloudevy.com --api-key YOUR_API_KEY
 */

import os from 'os';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Agent version - increment this when making changes
const AGENT_VERSION = '1.2.0';

// Configuration
const config = {
  serverId: process.env.CLOUDEVY_SERVER_ID || process.argv[2]?.split('=')[1],
  apiUrl: process.env.CLOUDEVY_API_URL || process.argv[3]?.split('=')[1] || 'http://localhost:8002',
  apiKey: process.env.CLOUDEVY_API_KEY || process.argv[4]?.split('=')[1],
  interval: 5000, // Report every 5 seconds
  verbose: process.env.VERBOSE === 'true',
  version: AGENT_VERSION
};

// Validate configuration
if (!config.serverId || !config.apiKey) {
  console.error('❌ Missing required configuration!');
  console.error('Usage: node cloudevy-agent.js --server-id=<id> --api-key=<key> [--api-url=<url>]');
  console.error('Or set environment variables: CLOUDEVY_SERVER_ID, CLOUDEVY_API_KEY, CLOUDEVY_API_URL');
  process.exit(1);
}

console.log('🚀 Cloudevy Monitoring Agent Starting...');
console.log(`📦 Version: ${AGENT_VERSION}`);
console.log(`📊 Server ID: ${config.serverId}`);
console.log(`🌐 API URL: ${config.apiUrl}`);
console.log(`⏱️  Report Interval: ${config.interval}ms`);
console.log('');

// Track previous network stats for calculating rates
let previousNetworkStats = null;
let previousTime = Date.now();

// Track previous disk I/O stats
let previousDiskIO = null;

/**
 * Get CPU usage percentage
 */
async function getCPUUsage() {
  try {
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    
    // Calculate average CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpuCount;
    const total = totalTick / cpuCount;
    const usage = 100 - ~~(100 * idle / total);
    
    return {
      usage: parseFloat(usage.toFixed(1)),
      cores: cpuCount
    };
  } catch (error) {
    console.error('Error getting CPU usage:', error.message);
    return { usage: 0, cores: os.cpus().length };
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
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
    console.error('Error getting disk usage:', error.message);
    return { total: 0, used: 0, percentage: 0 };
  }
}

/**
 * Get network usage
 */
async function getNetworkUsage() {
  try {
    const networkInterfaces = os.networkInterfaces();
    let totalRx = 0;
    let totalTx = 0;
    
    // Read network stats from /proc/net/dev (Linux)
    try {
      const { stdout } = await execAsync("cat /proc/net/dev | tail -n +3");
      const lines = stdout.trim().split('\n');
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          totalRx += parseInt(parts[1]) || 0;
          totalTx += parseInt(parts[9]) || 0;
        }
      });
    } catch (err) {
      // Fallback for non-Linux systems
      return { inbound: 0, outbound: 0 };
    }
    
    const currentTime = Date.now();
    const timeDiff = (currentTime - previousTime) / 1000; // seconds
    
    let inboundRate = 0;
    let outboundRate = 0;
    
    if (previousNetworkStats) {
      const rxDiff = totalRx - previousNetworkStats.rx;
      const txDiff = totalTx - previousNetworkStats.tx;
      
      inboundRate = (rxDiff / timeDiff) / (1024 * 1024); // MB/s
      outboundRate = (txDiff / timeDiff) / (1024 * 1024); // MB/s
    }
    
    previousNetworkStats = { rx: totalRx, tx: totalTx };
    previousTime = currentTime;
    
    return {
      inbound: parseFloat(inboundRate.toFixed(2)),
      outbound: parseFloat(outboundRate.toFixed(2))
    };
  } catch (error) {
    console.error('Error getting network usage:', error.message);
    return { inbound: 0, outbound: 0 };
  }
}

/**
 * Get system uptime
 */
function getUptime() {
  return Math.floor(os.uptime());
}

/**
 * Get load average
 */
function getLoadAverage() {
  const loads = os.loadavg();
  return loads.map(load => parseFloat(load.toFixed(2)));
}

/**
 * Get disk I/O statistics
 */
async function getDiskIO() {
  try {
    // Read disk stats from /proc/diskstats (Linux)
    const { stdout } = await execAsync("cat /proc/diskstats | grep -E '(sda|xvda|nvme0n1)' | head -1");
    const parts = stdout.trim().split(/\s+/);
    
    if (parts.length >= 14) {
      // Sectors read and written (512 bytes per sector)
      const sectorsRead = parseInt(parts[5]) || 0;
      const sectorsWritten = parseInt(parts[9]) || 0;
      
      const currentTime = Date.now();
      const timeDiff = (currentTime - previousTime) / 1000; // seconds
      
      let readRate = 0;
      let writeRate = 0;
      
      if (previousDiskIO && timeDiff > 0) {
        const readDiff = sectorsRead - previousDiskIO.read;
        const writeDiff = sectorsWritten - previousDiskIO.write;
        
        // Convert sectors to MB/s (512 bytes per sector)
        readRate = (readDiff * 512) / (1024 * 1024) / timeDiff;
        writeRate = (writeDiff * 512) / (1024 * 1024) / timeDiff;
      }
      
      previousDiskIO = { read: sectorsRead, write: sectorsWritten };
      
      return {
        read: Math.max(0, parseFloat(readRate.toFixed(2))),
        write: Math.max(0, parseFloat(writeRate.toFixed(2)))
      };
    }
  } catch (error) {
    // Fallback for non-Linux or if command fails
  }
  
  return { read: 0, write: 0 };
}

/**
 * Get top processes by CPU and Memory
 */
async function getTopProcesses() {
  try {
    // Get top 5 processes by CPU
    const { stdout } = await execAsync("ps aux --sort=-%cpu | head -6 | tail -5 | awk '{print $2,$11,$3,$4}'");
    const lines = stdout.trim().split('\n');
    
    const processes = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[0]) || 0,
        name: parts[1] || 'unknown',
        cpu: parseFloat(parts[2]) || 0,
        memory: parseFloat(parts[3]) || 0
      };
    }).filter(p => p.pid > 0);
    
    return processes;
  } catch (error) {
    console.error('Error getting top processes:', error.message);
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
  const uptime = getUptime();
  const loadAverage = getLoadAverage();
  
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
 * Send metrics to Cloudevy API
 */
async function sendMetrics(metrics) {
  try {
    await axios.post(
      `${config.apiUrl}/api/metrics/report`,
      metrics,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
          'X-Server-ID': config.serverId
        },
        timeout: 5000
      }
    );
    
    if (config.verbose) {
      console.log(`✅ Metrics sent successfully at ${new Date().toLocaleTimeString()}`);
      console.log(`   CPU: ${metrics.cpu.usage}% | Memory: ${metrics.memory.percentage}% | Disk: ${metrics.disk.percentage}%`);
    } else {
      process.stdout.write('.');
    }
  } catch (error) {
    console.error(`\n❌ Failed to send metrics: ${error.message}`);
  }
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log('✅ Monitoring started. Press Ctrl+C to stop.\n');
  
  // Send initial metrics immediately
  const metrics = await collectMetrics();
  await sendMetrics(metrics);
  
  // Then continue on interval
  setInterval(async () => {
    try {
      const metrics = await collectMetrics();
      await sendMetrics(metrics);
    } catch (error) {
      console.error('Error collecting metrics:', error.message);
    }
  }, config.interval);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping Cloudevy monitoring agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping Cloudevy monitoring agent...');
  process.exit(0);
});

// Start monitoring
startMonitoring().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

