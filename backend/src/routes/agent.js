import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Latest version
const LATEST_VERSION = '1.2.0';

/**
 * GET /api/agent/install
 * Dynamic install script generator
 */
router.get('/install', (req, res) => {
  const { server, key, api } = req.query;
  
  if (!server || !key) {
    return res.status(400).send('Missing parameters: server and key required\nUsage: curl https://cloudevy.in/api/agent/install?server=ID&key=KEY | sudo bash');
  }
  
  const apiUrl = api || (req.get('host').includes('localhost') ? 'http://localhost:8002/api' : 'https://cloudevy.in/api');
  
  const installScript = `#!/bin/bash
set -e

echo "============================================"
echo "🚀 Cloudevy Agent Installation v${LATEST_VERSION}"
echo "============================================"
echo ""

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "\${RED}❌ Please run as root (use sudo)\${NC}"
  exit 1
fi

# Step 1: Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    
    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case "$ID" in
            amzn|rhel|centos)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                yum install -y nodejs
                ;;
            ubuntu|debian)
                curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                apt-get install -y nodejs
                ;;
            fedora)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                dnf install -y nodejs
                ;;
            alpine)
                apk add --no-cache nodejs npm
                ;;
            *)
                echo -e "\${RED}❌ Unsupported distribution: $ID\${NC}"
                echo "Please install Node.js 20+ manually: https://nodejs.org"
                exit 1
                ;;
        esac
    else
        echo -e "\${RED}❌ Cannot detect Linux distribution\${NC}"
        exit 1
    fi
    
    echo -e "\${GREEN}✅ Node.js installed: $(node --version)\${NC}"
else
    echo -e "\${GREEN}✅ Node.js already installed: $(node --version)\${NC}"
fi

echo ""
echo "📥 Downloading Cloudevy Agent v${LATEST_VERSION}..."

# Create directory
mkdir -p /opt/cloudevy-agent
cd /opt/cloudevy-agent

# Download agent
curl -fsSL "${apiUrl.replace('/api', '')}/api/agent/v${LATEST_VERSION}/cloudevy-agent.js" -o cloudevy-agent.js
curl -fsSL "${apiUrl.replace('/api', '')}/api/agent/v${LATEST_VERSION}/package.json" -o package.json

# Make executable
chmod +x cloudevy-agent.js

echo -e "\${GREEN}✅ Agent downloaded\${NC}"
echo ""
echo "⚙️  Creating systemd service..."

# Create systemd service
cat > /etc/systemd/system/cloudevy-agent.service << 'SERVICE_EOF'
[Unit]
Description=Cloudevy Monitoring Agent v${LATEST_VERSION}
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cloudevy-agent
Environment="CLOUDEVY_SERVER_ID=${server}"
Environment="CLOUDEVY_API_KEY=${key}"
Environment="CLOUDEVY_API_URL=${apiUrl}"
ExecStart=$(which node) /opt/cloudevy-agent/cloudevy-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Reload systemd
systemctl daemon-reload

# Enable and start
systemctl enable cloudevy-agent
systemctl restart cloudevy-agent

echo ""
echo -e "\${GREEN}============================================\${NC}"
echo -e "\${GREEN}✅ Installation Complete!\${NC}"
echo -e "\${GREEN}============================================\${NC}"
echo ""
echo "📊 Status: systemctl status cloudevy-agent"
echo "📝 Logs:   sudo journalctl -u cloudevy-agent -f"
echo "🔄 Restart: sudo systemctl restart cloudevy-agent"
echo ""

# Show status
sleep 2
systemctl status cloudevy-agent --no-pager
`;

  res.type('text/plain');
  res.send(installScript);
});

/**
 * GET /api/agent/v:version/cloudevy-agent.js
 * Serve agent file for specific version
 */
router.get('/v:version/cloudevy-agent.js', (req, res) => {
  const version = req.params.version;
  const agentPath = path.join(__dirname, '../../agent/releases', `v${version}`, 'cloudevy-agent.js');
  
  if (!existsSync(agentPath)) {
    return res.status(404).send('Agent version not found');
  }
  
  res.type('application/javascript');
  res.sendFile(agentPath);
});

/**
 * GET /api/agent/v:version/package.json
 * Serve package.json for specific version
 */
router.get('/v:version/package.json', (req, res) => {
  const version = req.params.version;
  const packagePath = path.join(__dirname, '../../agent/releases', `v${version}`, 'package.json');
  
  if (!existsSync(packagePath)) {
    return res.status(404).send('Package file not found');
  }
  
  res.type('application/json');
  res.sendFile(packagePath);
});

/**
 * GET /api/agent/latest
 * Get latest agent version info
 */
router.get('/latest', (req, res) => {
  res.json({
    version: LATEST_VERSION,
    releaseDate: '2025-12-30',
    features: [
      'Real-time CPU, Memory, Disk, Network metrics',
      'System Load Average (1, 5, 15 min)',
      'Disk I/O Speed (Read/Write)',
      'Top 5 Resource-Consuming Processes',
      'Automatic version reporting'
    ],
    downloadUrl: `/api/agent/v${LATEST_VERSION}/cloudevy-agent.js`,
    installUrl: `/api/agent/install`
  });
});

export default router;

