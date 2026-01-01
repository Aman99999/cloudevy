#!/bin/bash

#
# Cloudevy Agent - Quick Install Script
# Usage: curl -sSL https://install.cloudevy.com | bash -s -- SERVER_ID API_KEY API_URL
#

set -e

echo "🚀 Cloudevy Monitoring Agent Installer"
echo "======================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script should be run as root for system service installation"
   echo "   You can still install it as a regular user, but it won't start on boot"
   echo ""
fi

# Parse arguments
SERVER_ID=${1:-$CLOUDEVY_SERVER_ID}
API_KEY=${2:-$CLOUDEVY_API_KEY}
API_URL=${3:-$CLOUDEVY_API_URL}

if [ -z "$SERVER_ID" ] || [ -z "$API_KEY" ]; then
    echo "❌ Missing required arguments!"
    echo ""
    echo "Usage:"
    echo "  $0 SERVER_ID API_KEY [API_URL]"
    echo ""
    echo "Example:"
    echo "  $0 123 your-api-key-here http://localhost:8002"
    echo ""
    echo "Or set environment variables:"
    echo "  export CLOUDEVY_SERVER_ID=123"
    echo "  export CLOUDEVY_API_KEY=your-api-key-here"
    echo "  export CLOUDEVY_API_URL=http://localhost:8002"
    echo "  $0"
    exit 1
fi

# Set default API URL if not provided
API_URL=${API_URL:-"http://localhost:8002"}

echo "📋 Configuration:"
echo "   Server ID: $SERVER_ID"
echo "   API URL: $API_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Version 18+ recommended."
fi

# Create installation directory
INSTALL_DIR="/opt/cloudevy-agent"
echo "📁 Creating installation directory: $INSTALL_DIR"

if [[ $EUID -eq 0 ]]; then
    mkdir -p "$INSTALL_DIR"
else
    INSTALL_DIR="$HOME/cloudevy-agent"
    mkdir -p "$INSTALL_DIR"
    echo "   Installing to user directory: $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Download agent files
echo "⬇️  Downloading agent files..."
cat > cloudevy-agent.js << 'AGENT_EOF'
#!/usr/bin/env node
import os from 'os';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
const config = {
  serverId: process.env.CLOUDEVY_SERVER_ID || process.argv[2]?.split('=')[1],
  apiUrl: process.env.CLOUDEVY_API_URL || process.argv[3]?.split('=')[1] || 'http://localhost:8002',
  apiKey: process.env.CLOUDEVY_API_KEY || process.argv[4]?.split('=')[1],
  interval: 5000,
  verbose: process.env.VERBOSE === 'true'
};
if (!config.serverId || !config.apiKey) {
  console.error('❌ Missing required configuration!');
  process.exit(1);
}
console.log('🚀 Cloudevy Monitoring Agent Starting...');
console.log('📊 Server ID:', config.serverId);
console.log('🌐 API URL:', config.apiUrl);
console.log('⏱️  Report Interval:', config.interval + 'ms');
console.log('');
let previousNetworkStats = null;
let previousTime = Date.now();
async function getCPUUsage() {
  try {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) totalTick += cpu.times[type];
      totalIdle += cpu.times.idle;
    });
    const usage = 100 - ~~(100 * (totalIdle / cpus.length) / (totalTick / cpus.length));
    return { usage: parseFloat(usage.toFixed(1)), cores: cpus.length };
  } catch (error) {
    return { usage: 0, cores: os.cpus().length };
  }
}
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();
  return {
    used: Math.round(usedMem / 1024 / 1024),
    total: Math.round(totalMem / 1024 / 1024),
    percentage: parseFloat(((usedMem / totalMem) * 100).toFixed(1))
  };
}
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2,$3,$5}'");
    const [total, used, percentage] = stdout.trim().split(' ');
    return { total: parseFloat(total), used: parseFloat(used), percentage: parseFloat(percentage) };
  } catch (error) {
    return { total: 0, used: 0, percentage: 0 };
  }
}
async function getNetworkUsage() {
  try {
    const { stdout } = await execAsync("cat /proc/net/dev | tail -n +3");
    let totalRx = 0, totalTx = 0;
    stdout.trim().split('\n').forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10) {
        totalRx += parseInt(parts[1]) || 0;
        totalTx += parseInt(parts[9]) || 0;
      }
    });
    const currentTime = Date.now();
    const timeDiff = (currentTime - previousTime) / 1000;
    let inboundRate = 0, outboundRate = 0;
    if (previousNetworkStats) {
      inboundRate = ((totalRx - previousNetworkStats.rx) / timeDiff) / (1024 * 1024);
      outboundRate = ((totalTx - previousNetworkStats.tx) / timeDiff) / (1024 * 1024);
    }
    previousNetworkStats = { rx: totalRx, tx: totalTx };
    previousTime = currentTime;
    return { inbound: parseFloat(inboundRate.toFixed(2)), outbound: parseFloat(outboundRate.toFixed(2)) };
  } catch (error) {
    return { inbound: 0, outbound: 0 };
  }
}
async function collectMetrics() {
  const [cpu, disk, network] = await Promise.all([getCPUUsage(), getDiskUsage(), getNetworkUsage()]);
  return {
    serverId: config.serverId,
    timestamp: new Date().toISOString(),
    status: 'online',
    cpu,
    memory: getMemoryUsage(),
    disk,
    network,
    uptime: Math.floor(os.uptime()),
    loadAverage: os.loadavg().map(l => parseFloat(l.toFixed(2)))
  };
}
async function sendMetrics(metrics) {
  try {
    await axios.post(config.apiUrl + '/api/metrics/report', metrics, {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiKey, 'X-Server-ID': config.serverId },
      timeout: 5000
    });
    if (config.verbose) {
      console.log('✅ Metrics sent at', new Date().toLocaleTimeString());
      console.log('   CPU:', metrics.cpu.usage + '% | Memory:', metrics.memory.percentage + '% | Disk:', metrics.disk.percentage + '%');
    } else {
      process.stdout.write('.');
    }
  } catch (error) {
    console.error('\n❌ Failed to send metrics:', error.message);
  }
}
async function startMonitoring() {
  console.log('✅ Monitoring started. Press Ctrl+C to stop.\n');
  await sendMetrics(await collectMetrics());
  setInterval(async () => {
    try {
      await sendMetrics(await collectMetrics());
    } catch (error) {
      console.error('Error:', error.message);
    }
  }, config.interval);
}
process.on('SIGINT', () => { console.log('\n\n👋 Stopping agent...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n\n👋 Stopping agent...'); process.exit(0); });
startMonitoring().catch(error => { console.error('Fatal error:', error); process.exit(1); });
AGENT_EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "cloudevy-agent",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Create systemd service if root
if [[ $EUID -eq 0 ]]; then
    echo "🔧 Creating systemd service..."
    cat > /etc/systemd/system/cloudevy-agent.service << EOF
[Unit]
Description=Cloudevy Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="CLOUDEVY_SERVER_ID=$SERVER_ID"
Environment="CLOUDEVY_API_KEY=$API_KEY"
Environment="CLOUDEVY_API_URL=$API_URL"
ExecStart=/usr/bin/node $INSTALL_DIR/cloudevy-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable cloudevy-agent
    systemctl start cloudevy-agent
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📊 Service Status:"
    systemctl status cloudevy-agent --no-pager
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:    sudo journalctl -u cloudevy-agent -f"
    echo "   Stop agent:   sudo systemctl stop cloudevy-agent"
    echo "   Start agent:  sudo systemctl start cloudevy-agent"
    echo "   Restart:      sudo systemctl restart cloudevy-agent"
else
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "⚠️  Not running as root - service not installed"
    echo ""
    echo "To start the agent manually:"
    echo "  cd $INSTALL_DIR"
    echo "  CLOUDEVY_SERVER_ID=$SERVER_ID CLOUDEVY_API_KEY=$API_KEY CLOUDEVY_API_URL=$API_URL node cloudevy-agent.js"
    echo ""
    echo "Or install PM2 for process management:"
    echo "  npm install -g pm2"
    echo "  pm2 start cloudevy-agent.js --name cloudevy-agent"
fi

echo ""
echo "🎉 Done! Your server is now being monitored by Cloudevy!"

