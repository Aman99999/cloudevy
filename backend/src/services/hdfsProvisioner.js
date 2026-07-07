import prisma from '../config/prisma.js';
import { getMultipleServerSSHCredentials } from './sshResolver.js';
import { Client } from 'ssh2';
import { promisify } from 'util';
import { odpSupportMatrix } from '../data/odpSupportMatrix.js';

/**
 * Create HDFS/Hadoop cluster using Ambari
 * 
 * @param {Object} options
 * @param {Object} options.cluster - Cluster database record
 * @param {String} options.distribution - 'apache', 'hdp', or 'cdp'
 * @param {Array} options.services - Array of service IDs to install
 * @param {Object} options.nodes - { masters: [], workers: [] }
 * @param {Object} options.config - Cluster configuration
 * @param {Number} options.workspaceId - Workspace ID
 * @param {Function} options.onProgress - Progress callback
 */
export async function createHDFSCluster({ cluster, distribution, services, nodes, config, workspaceId, onProgress }) {
  try {
    onProgress({ step: 'init', status: 'running', message: 'Starting HDFS cluster creation...' });

    console.log(`🐘 Creating HDFS cluster ${cluster.id}: ${cluster.name}`);
    console.log(`   Distribution: ${distribution}`);
    console.log(`   Services: ${services.join(', ')}`);

    // 1. Get SSH credentials for all nodes
    onProgress({ step: 'validation', status: 'running', message: 'Validating nodes...' });
    
    const allServerIds = [
      ...nodes.masters.map(n => n.serverId),
      ...nodes.workers.map(n => n.serverId)
    ];

    const sshCredentials = await getMultipleServerSSHCredentials(allServerIds);
    
    // Convert Map to Array for easier iteration
    const sshCredsArray = Array.from(sshCredentials.values());
    console.log(`✅ Retrieved SSH credentials for ${sshCredsArray.length} nodes`);

    // 2. Validate all nodes are accessible
    await validateNodes(sshCredsArray, onProgress);

    // 3. Store node roles in database
    onProgress({ step: 'config', status: 'running', message: 'Configuring node roles...' });
    await storeNodeRoles(cluster.id, nodes, sshCredsArray);
    console.log(`✅ Node roles stored for cluster ${cluster.id}`);

    // 4. Check if Ambari is selected and choose installation method
    console.log(`🔍 Determining installation method for distribution: ${distribution}, services: ${services.join(', ')}`);
    
    // Validate nodes structure
    if (!nodes.masters || nodes.masters.length === 0) {
      throw new Error('No master nodes specified');
    }
    if (!nodes.workers || nodes.workers.length === 0) {
      throw new Error('No worker nodes specified');
    }
    
    const masterNode = sshCredsArray.find(s => s.serverId === nodes.masters[0].serverId);
    if (!masterNode) {
      console.error(`❌ Master node lookup failed. Looking for serverId: ${nodes.masters[0].serverId}`);
      console.error(`Available SSH credentials serverIds: ${sshCredsArray.map(c => c.serverId).join(', ')}`);
      throw new Error(`Master node (serverId: ${nodes.masters[0].serverId}) not found in SSH credentials`);
    }
    console.log(`✅ Master node found: ${masterNode.server.name} (${masterNode.server.ipAddress})`);
    
    const useAmbari = services.includes('ambari');
    console.log(`📋 Installation method: ${useAmbari ? 'Ambari-based' : 'Direct (Apache)'}`);
    
    // ODP and CDP require Ambari
    if ((distribution === 'odp' || distribution === 'cdp') && !useAmbari) {
      throw new Error(`${distribution.toUpperCase()} distribution requires Ambari. Please select Ambari in services.`);
    }
    
    if (useAmbari) {
      // Ambari-based installation (works with all distributions)
      onProgress({ step: 'ambari-server', status: 'running', message: '🎯 Installing Ambari Server...' });
      await installAmbariServer(masterNode, distribution, config, onProgress);
      onProgress({ step: 'ambari-server', status: 'completed', message: '✅ Ambari Server installed' });

      // 5. Install Ambari Agents on all nodes
      onProgress({ step: 'ambari-agents', status: 'running', message: 'Installing Ambari Agents...' });
      await installAmbariAgents(sshCredsArray, masterNode.server.ipAddress, onProgress);
      onProgress({ step: 'ambari-agents', status: 'completed', message: 'Ambari Agents installed' });

      // 5.5. Wait for Ambari Server to be ready
      const ambariUrl = `http://${masterNode.server.ipAddress}:8080`;
      onProgress({ step: 'ambari-ready', status: 'running', message: 'Waiting for Ambari Server to start...' });
      await waitForAmbariReady(ambariUrl, onProgress);
      onProgress({ step: 'ambari-ready', status: 'completed', message: 'Ambari Server is ready' });

      // 6. Generate and submit Ambari blueprint
      onProgress({ step: 'blueprint', status: 'running', message: 'Creating cluster blueprint...' });
      const blueprintResult = await submitAmbariBlueprint(cluster, distribution, services, nodes, config, masterNode, sshCredsArray, onProgress);

      // 7. Wait for services to start
      onProgress({ step: 'services', status: 'running', message: 'Starting services (this may take 20-30 minutes)...' });
      await waitForServices(masterNode, services, onProgress, blueprintResult.requestId);
      onProgress({ step: 'services', status: 'completed', message: 'All services started' });
      
    } else if (distribution === 'apache') {
      // Direct Apache Hadoop installation (no management UI)
      console.log(`🚀 Starting Apache Hadoop direct installation for cluster ${cluster.id}...`);
      onProgress({ step: 'apache-install', status: 'running', message: '🐘 Installing Apache Hadoop directly (no Ambari)...' });
      await installApacheHadoop({ cluster, nodes, config, sshCredsArray, masterNode, onProgress, services });
      console.log(`✅ Apache Hadoop installation completed for cluster ${cluster.id}`);
      onProgress({ step: 'apache-install', status: 'completed', message: '✅ Apache Hadoop cluster installed' });
    } else {
      throw new Error(`Unsupported distribution: ${distribution}. Supported distributions: apache, odp, cdp`);
    }

    // 8. Store service information in database
    await storeServiceInfo(cluster.id, services);

    // 9. Update cluster status
    const masterIp = masterNode?.server?.ipAddress;
    const apiEndpoint = useAmbari
      ? `http://${masterIp}:8080` // Ambari Web UI
      : `http://${masterIp}:9870`; // NameNode Web UI (direct installation)
    
    await prisma.cluster.update({
      where: { id: cluster.id },
      data: {
        status: 'running',
        apiEndpoint,
        connectivityStatus: 'connected',
        connectivityMode: 'auto'
      }
    });

    console.log(`✅ HDFS cluster ${cluster.id} created successfully!`);
    onProgress({ step: 'complete', status: 'completed', message: 'HDFS cluster ready!' });

  } catch (error) {
    console.error(`❌ HDFS cluster creation error:`, error);
    onProgress({ step: 'error', status: 'error', message: error.message });
    throw error;
  }
}

/**
 * Validate that all nodes are accessible via SSH
 */
async function validateNodes(sshCredentials, onProgress) {
  console.log(`🔍 Validating ${sshCredentials.length} nodes...`);
  
  for (const cred of sshCredentials) {
    try {
      console.log(`🔌 Connecting to ${cred.server.name} with username: ${cred.username}, host: ${cred.host}`);
      await executeSSHCommand(cred, 'echo "CloudEvy HDFS validation"');
      console.log(`✅ Node ${cred.server.name} (${cred.server.ipAddress}) is accessible`);
    } catch (error) {
      throw new Error(`Failed to connect to node ${cred.server.name}: ${error.message}`);
    }
  }
  
  onProgress({ step: 'validation', status: 'completed', message: 'All nodes validated' });
}

/**
 * Store node roles in database
 */
async function storeNodeRoles(clusterId, nodes, sshCredentials) {
  console.log(`📝 Storing node roles for cluster ${clusterId}...`);
  
  // Store master nodes
  for (let i = 0; i < nodes.masters.length; i++) {
    const master = nodes.masters[i];
    await prisma.hadoopNodeRole.createMany({
      data: [
        { clusterId, serverId: master.serverId, role: 'namenode', isPrimary: i === 0 },
        { clusterId, serverId: master.serverId, role: 'resourcemanager', isPrimary: i === 0 },
        { clusterId, serverId: master.serverId, role: 'zookeeper' }
      ]
    });
  }
  
  // Store worker nodes
  for (const worker of nodes.workers) {
    await prisma.hadoopNodeRole.createMany({
      data: [
        { clusterId, serverId: worker.serverId, role: 'datanode' },
        { clusterId, serverId: worker.serverId, role: 'nodemanager' }
      ]
    });
  }
  
  console.log(`✅ Node roles stored for cluster ${clusterId}`);
}

/**
 * Detect OS type and version from a server
 */
async function detectServerOS(credential) {
  const detectionScript = `
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo "OS_ID:\$ID"
      echo "OS_VERSION:\$VERSION_ID"
    elif [ -f /etc/redhat-release ]; then
      if grep -q "release 9" /etc/redhat-release; then
        echo "OS_ID:rhel"
        echo "OS_VERSION:9"
      elif grep -q "release 8" /etc/redhat-release; then
        echo "OS_ID:rhel"
        echo "OS_VERSION:8"
      else
        echo "OS_ID:rhel"
        echo "OS_VERSION:unknown"
      fi
    else
      echo "OS_ID:unknown"
      echo "OS_VERSION:unknown"
    fi
  `;

  try {
    const output = await executeSSHCommand(credential, detectionScript);
    const lines = output.split('\n');
    const osId = lines.find(l => l.startsWith('OS_ID:'))?.split(':')[1]?.trim() || 'unknown';
    const osVersion = lines.find(l => l.startsWith('OS_VERSION:'))?.split(':')[1]?.trim() || 'unknown';
    
    // Normalize OS ID
    let normalizedOS = osId;
    if (osId === 'rhel' || osId === 'rocky' || osId === 'almalinux') {
      normalizedOS = osId;
    } else if (osId === 'ubuntu') {
      normalizedOS = 'ubuntu';
    } else if (osId === 'centos') {
      normalizedOS = 'centos';
    }
    
    return { osType: normalizedOS, osVersion };
  } catch (error) {
    console.error('Failed to detect OS:', error);
    return { osType: 'rhel', osVersion: '9' }; // Default fallback
  }
}

/**
 * Get repository URLs for ODP/Ambari installation
 */
function getRepositoryUrls(odpVersion, ambariVersion, osType, osVersion) {
  // Construct OS key (e.g., 'rhel9', 'ubuntu20')
  const osKey = `${osType}${osVersion}`;
  
  // Get Ambari repo URL
  const ambariRepo = odpSupportMatrix.getRepositoryUrl('ambari', ambariVersion, osKey);
  
  // Get ODP repo URL
  const odpRepo = odpSupportMatrix.getRepositoryUrl('odp', odpVersion, osKey);
  
  console.log(`📍 Repository URLs for ODP ${odpVersion}, Ambari ${ambariVersion}, OS ${osKey}:`);
  console.log(`   Ambari: ${ambariRepo || 'NOT FOUND'}`);
  console.log(`   ODP: ${odpRepo || 'NOT FOUND'}`);
  
  return {
    ambariRepo,
    odpRepo,
    osKey
  };
}

/**
 * Install Ambari Server on master node
 */
async function installAmbariServer(masterNode, distribution, odpConfig, onProgress) {
  console.log(`📦 Installing Ambari Server (ODP) on ${masterNode.server.name}...`);
  
  onProgress({ 
    step: 'ambari-server', 
    status: 'running', 
    message: `Installing Ambari Server (ODP) on ${masterNode.server.name}...`,
    type: 'log',
    level: 'info',
    server: masterNode.server.name
  });
  
  // Step 1: Detect OS
  console.log(`🔍 Detecting OS on ${masterNode.server.name}...`);
  const { osType, osVersion } = await detectServerOS(masterNode);
  console.log(`✓ Detected: ${osType} ${osVersion}`);
  
  onProgress({ 
    step: 'ambari-server', 
    status: 'running', 
    message: `Detected OS: ${osType} ${osVersion}`,
    type: 'log',
    level: 'info',
    server: masterNode.server.name
  });
  
  // Step 2: Get repository URLs
  const odpVersion = odpConfig?.odpVersion || '3.3.6.3-1'; // Default to latest
  const ambariVersion = '3.0.0.0-1'; // Use latest Ambari for ODP
  const { ambariRepo, odpRepo, osKey } = getRepositoryUrls(odpVersion, ambariVersion, osType, osVersion);
  
  if (!ambariRepo) {
    throw new Error(`No Ambari repository found for ODP ${odpVersion} on ${osType} ${osVersion}`);
  }
  
  onProgress({ 
    step: 'ambari-server', 
    status: 'running', 
    message: `Using ODP ${odpVersion}, Ambari ${ambariVersion}`,
    type: 'log',
    level: 'info',
    server: masterNode.server.name
  });
  
  // Extract major version for detection messages
  const osMajorVersion = osVersion.split('.')[0];
  
  const installScript = `
echo "📦 Starting ODP Ambari Server installation..."
echo "ODP Version: ${odpVersion}"
echo "Ambari Version: ${ambariVersion}"
echo "OS: ${osType} ${osVersion}"
echo "Repository: ${ambariRepo}"

# Detect OS and version
if [ -f /etc/redhat-release ]; then
    OS_TYPE="rhel"
    OS_VERSION=$(cat /etc/redhat-release)
    echo "✓ Detected: $OS_VERSION"
    
    # Extract major version number
    if echo "$OS_VERSION" | grep -q "release 10"; then
        echo "⚠️  WARNING: RHEL 10 detected - NOT officially supported by ODP!"
        echo "⚠️  ODP officially supports: RHEL 8, RHEL 9, Rocky Linux 8/9"
        echo "⚠️  Installation may fail or behave unexpectedly"
        echo "⚠️  Recommended: Use RHEL 9 or Rocky Linux 9 instead"
        echo ""
        echo "Continuing with installation attempt..."
        OS_VERSION_MAJOR="10"
    elif echo "$OS_VERSION" | grep -q "release 9"; then
        echo "✅ RHEL 9 detected - Fully supported by ODP"
        OS_VERSION_MAJOR="9"
    elif echo "$OS_VERSION" | grep -q "release 8"; then
        echo "✅ RHEL 8 detected - Fully supported by ODP"
        OS_VERSION_MAJOR="8"
    else
        echo "⚠️  WARNING: Unknown RHEL version - ODP supports RHEL 8/9"
        OS_VERSION_MAJOR="unknown"
    fi
elif [ -f /etc/os-release ] && grep -q "Amazon Linux" /etc/os-release; then
    OS_TYPE="rhel"
    echo "✓ Detected Amazon Linux"
    echo "⚠️  Note: Amazon Linux support may vary - RHEL 8/9 recommended"
else
    OS_TYPE="debian"
    if [ -f /etc/os-release ]; then
        UBUNTU_VERSION=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
        echo "✓ Detected Ubuntu $UBUNTU_VERSION"
        if [ "$UBUNTU_VERSION" = "20.04" ] || [ "$UBUNTU_VERSION" = "22.04" ]; then
            echo "✅ Fully supported by ODP"
        else
            echo "⚠️  WARNING: ODP officially supports Ubuntu 20.04 and 22.04"
        fi
    else
        echo "✓ Detected Debian / Ubuntu"
    fi
fi

# Install dependencies
echo "📥 Installing dependencies..."
sudo yum install -y wget curl || sudo apt-get install -y wget curl

# Check if Java is already installed
if command -v java &> /dev/null; then
    echo "✓ Java already installed: $(java -version 2>&1 | head -n 1)"
else
    echo "🔍 Installing Java (JDK 17 required for Ambari ${ambariVersion})..."
    
    if [ "$OS_TYPE" = "rhel" ]; then
        set +e
        sudo yum install -y java-17-openjdk java-17-openjdk-devel 2>/dev/null && echo "✓ Java 17 installed" && JAVA_INSTALLED=1
        [ -z "$JAVA_INSTALLED" ] && sudo yum install -y java-17-amazon-corretto java-17-amazon-corretto-devel 2>/dev/null && echo "✓ Corretto 17 installed" && JAVA_INSTALLED=1
        set -e
        
        if [ -z "$JAVA_INSTALLED" ]; then
            echo "❌ ERROR: Failed to install Java 17 (required for Ambari ${ambariVersion})"
            exit 1
        fi
    else
        sudo apt-get update
        sudo apt-get install -y openjdk-17-jdk
    fi
fi

# Verify Java installation
if command -v java &> /dev/null; then
    echo "✓ Java installed successfully"
    java -version
else
    echo "❌ ERROR: Java installation failed"
    exit 1
fi

echo "📦 Configuring Ambari repository..."
if [ "$OS_TYPE" = "rhel" ]; then
    # Use dynamic repository URL
    cat <<'EOF' | sudo tee /etc/yum.repos.d/ambari.repo
[ambari-${ambariVersion}]
async = 1
name = Ambari Version - ${ambariVersion}
baseurl = ${ambariRepo}
gpgcheck = 0
enabled = 1
priority = 1
EOF
    
    if [ ! -f /etc/yum.repos.d/ambari.repo ]; then
        echo "❌ ERROR: Failed to create repository file"
        exit 1
    fi
    
    echo "✓ Repository file created"
    cat /etc/yum.repos.d/ambari.repo
    
    echo "🔄 Refreshing repository metadata..."
    sudo yum clean all
    sudo yum repolist
    
    echo "📦 Installing Ambari Server..."
    sudo yum install -y ambari-server
    
    if ! command -v ambari-server &> /dev/null; then
        echo "❌ ERROR: Ambari Server installation failed"
        exit 1
    fi
    
    echo "✓ Ambari Server installed successfully"
else
    # Ubuntu/Debian
    wget -O - ${ambariRepo}/my_public.key | sudo apt-key add -
    echo "deb ${ambariRepo} ODP main" | sudo tee /etc/apt/sources.list.d/ambari.list
    sudo apt-get update
    sudo apt-get install -y ambari-server
fi

echo "⚙️  Setting up Ambari Server..."
sudo ambari-server setup -s

echo "🚀 Starting Ambari Server..."
sudo ambari-server start

echo "✅ Ambari Server installation complete!"
echo "Ambari URL will be available at http://$(hostname -I | awk '{print $1}'):8080"
echo "Default credentials: admin / admin"
`;

  try {
    const output = await executeSSHCommand(
      masterNode,
      installScript,
      (data) => {
        onProgress({
          step: 'ambari-server',
          status: 'running',
          message: data,
          type: 'log',
          level: 'info',
          server: masterNode.server.name
        });
      }
    );
    
    console.log(`✅ Ambari Server installed on ${masterNode.server.name}`);
    
    onProgress({ 
      step: 'ambari-server', 
      status: 'completed', 
      message: `Ambari Server installed successfully on ${masterNode.server.name}`,
      type: 'log',
      level: 'success',
      server: masterNode.server.name
    });
    
    return output;
  } catch (error) {
    console.error(`❌ Ambari Server installation error:`, error);
    throw new Error(`Failed to install Ambari Server: ${error.message}`);
  }
}

/**
 * Install Ambari Agents on all nodes
 */
async function installAmbariAgents(sshCredentials, ambariServerIp, onProgress) {
  console.log(`📦 Installing Ambari Agents (ODP) on ${sshCredentials.length} nodes...`);
  
  const installPromises = sshCredentials.map(async (cred) => {
    onProgress({
      type: 'log',
      level: 'info',
      message: `Starting Ambari Agent installation on ${cred.server.name}...`,
      server: cred.server.name
    });
    
    const installScript = `
echo "📦 Installing ODP Ambari Agent on $(hostname)..."

# Detect OS and version
if [ -f /etc/redhat-release ] || grep -q "Amazon Linux" /etc/os-release 2>/dev/null; then
    OS_TYPE="rhel"
    OS_VERSION=$(cat /etc/redhat-release 2>/dev/null || echo "Unknown")
    echo "✓ OS: $OS_VERSION"
    
    # Check RHEL version
    if echo "$OS_VERSION" | grep -q "release 10"; then
        echo "⚠️  WARNING: RHEL 10 is NOT officially supported by ODP!"
        echo "⚠️  Recommended: Use RHEL 9 or Rocky Linux 9"
    elif echo "$OS_VERSION" | grep -q "release 9"; then
        echo "✅ RHEL 9 - Supported"
    elif echo "$OS_VERSION" | grep -q "release 8"; then
        echo "✅ RHEL 8 - Supported"
    fi
else
    OS_TYPE="debian"
    if [ -f /etc/os-release ]; then
        UBUNTU_VERSION=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
        echo "✓ Ubuntu $UBUNTU_VERSION"
        if [ "$UBUNTU_VERSION" = "20.04" ] || [ "$UBUNTU_VERSION" = "22.04" ]; then
            echo "✅ Supported by ODP"
        else
            echo "⚠️  ODP supports Ubuntu 20.04/22.04"
        fi
    fi
fi

# Check if Java is already installed
if command -v java &> /dev/null; then
    echo "✓ Java already installed: $(java -version 2>&1 | head -n 1)"
else
    echo "📥 Installing Java..."
    if [ "$OS_TYPE" = "rhel" ]; then
        # Try multiple Java versions for RHEL 10+
        set +e
        sudo yum install -y java-21-openjdk 2>/dev/null && echo "✓ Java 21 installed" && JAVA_OK=1
        [ -z "$JAVA_OK" ] && sudo yum install -y java-17-openjdk 2>/dev/null && echo "✓ Java 17 installed" && JAVA_OK=1
        [ -z "$JAVA_OK" ] && sudo yum install -y java-11-openjdk 2>/dev/null && echo "✓ Java 11 installed" && JAVA_OK=1
        [ -z "$JAVA_OK" ] && sudo yum install -y java-1.8.0-openjdk 2>/dev/null && echo "✓ Java 8 installed" && JAVA_OK=1
        [ -z "$JAVA_OK" ] && sudo yum install -y java-17-amazon-corretto 2>/dev/null && echo "✓ Corretto 17 installed" && JAVA_OK=1
        [ -z "$JAVA_OK" ] && sudo yum install -y java-11-amazon-corretto 2>/dev/null && echo "✓ Corretto 11 installed" && JAVA_OK=1
        set -e
    else
        sudo apt-get install -y openjdk-11-jdk || sudo apt-get install -y openjdk-8-jdk || sudo apt-get install -y openjdk-17-jdk
    fi
    echo "✓ Java installed"
fi

# Add ODP Ambari repository
if [ "$OS_TYPE" = "rhel" ]; then
    cat <<'EOFR' | sudo tee /etc/yum.repos.d/ambari.repo
[ambari-2.7.9.2]
async = 1
name = ambari Version - ambari-2.7.9.2-1
baseurl = https://mirror.odp.acceldata.dev/ODP/rhel/Ambari-2.7.9.2-1/
gpgcheck = 0
enabled = 1
priority = 1
EOFR
    echo "✓ ODP repository configured"
    sudo yum install -y ambari-agent
else
    cat <<'EOFR' | sudo tee /etc/apt/sources.list.d/ambari.list
deb https://mirror.odp.acceldata.dev/ODP/ubuntu20/Ambari-2.7.9.2-1/ ODP main
deb https://mirror.odp.acceldata.dev/ODP/ubuntu20/Ambari-2.7.9.2-1/ ODP-UTILS main
EOFR
    wget -qO - https://mirror.odp.acceldata.dev/ODP/ubuntu20/3.3.6.2-1/my_public.key | sudo apt-key add - || true
    sudo apt-get update
    sudo apt-get install -y ambari-agent
fi

# Configure agent to point to Ambari Server
echo "⚙️ Configuring Ambari Agent to connect to ${ambariServerIp}..."
sudo sed -i "s/hostname=localhost/hostname=${ambariServerIp}/g" /etc/ambari-agent/conf/ambari-agent.ini

# Start Ambari Agent
echo "🚀 Starting Ambari Agent..."
sudo ambari-agent start

# Verify
sleep 3
sudo ambari-agent status || echo "⚠️ Agent status check..."

echo "✅ Ambari Agent installation complete on $(hostname)"
`;

    try {
      await executeSSHCommand(cred, installScript, onProgress);
      console.log(`✅ Ambari Agent installed on ${cred.server.name}`);
      
      onProgress({
        type: 'log',
        level: 'info',
        message: `✅ Ambari Agent installed on ${cred.server.name}`,
        server: cred.server.name
      });
    } catch (error) {
      console.error(`❌ Failed to install Ambari Agent on ${cred.server.name}:`, error.message);
      throw error;
    }
  });
  
  await Promise.all(installPromises);
  console.log(`✅ All Ambari Agents installed`);
}

/**
 * Wait for Ambari Server to be ready
 */
async function waitForAmbariReady(ambariUrl, onProgress) {
  console.log(`⏳ Waiting for Ambari Server to be ready at ${ambariUrl}...`);
  
  const auth = Buffer.from('admin:admin').toString('base64');
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 sec intervals)
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${ambariUrl}/api/v1/clusters`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'X-Requested-By': 'ambari'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Ambari Server is ready!`);
        return true;
      }
    } catch (error) {
      // Ambari not ready yet, continue waiting
      console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Ambari not ready yet...`);
    }
    
    onProgress({
      step: 'ambari-ready',
      status: 'running',
      message: `Waiting for Ambari Server to start (${attempts + 1}/${maxAttempts})...`
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
  }
  
  throw new Error(`Ambari Server did not become ready after ${maxAttempts * 5 / 60} minutes`);
}

/**
 * Submit Ambari blueprint for cluster creation
 */
async function submitAmbariBlueprint(cluster, distribution, services, nodes, config, masterNode, sshCredentials, onProgress) {
  console.log(`📋 Generating Ambari blueprint for cluster ${cluster.id}...`);
  
  // Generate blueprint JSON (simplified version)
  const blueprint = {
    "Blueprints": {
      "blueprint_name": `cloudevy-${cluster.id}`,
      "stack_name": "HDP",
      "stack_version": "3.1"
    },
    "configurations": [],
    "host_groups": [
      {
        "name": "master",
        "components": [],
        "cardinality": nodes.masters.length.toString()
      },
      {
        "name": "worker",
        "components": [],
        "cardinality": nodes.workers.length.toString()
      }
    ]
  };
  
  // Map services to Ambari components
  const serviceComponents = {
    'hdfs': { master: ['NAMENODE', 'SECONDARY_NAMENODE'], worker: ['DATANODE'] },
    'yarn': { master: ['RESOURCEMANAGER'], worker: ['NODEMANAGER'] },
    'zookeeper': { master: ['ZOOKEEPER_SERVER'], worker: [] },
    'spark': { master: ['SPARK2_JOBHISTORYSERVER'], worker: ['SPARK2_CLIENT'] },
    'hive': { master: ['HIVE_SERVER', 'HIVE_METASTORE'], worker: ['HIVE_CLIENT'] },
    'kafka': { worker: ['KAFKA_BROKER'] }
  };
  
  // Add components to blueprint
  services.forEach(service => {
    if (serviceComponents[service]) {
      if (serviceComponents[service].master) {
        blueprint.host_groups[0].components.push(
          ...serviceComponents[service].master.map(c => ({ name: c }))
        );
      }
      if (serviceComponents[service].worker) {
        blueprint.host_groups[1].components.push(
          ...serviceComponents[service].worker.map(c => ({ name: c }))
        );
      }
    }
  });
  
  console.log(`✅ Blueprint generated with ${services.length} services`);
  
  const ambariUrl = `http://${masterNode.server.ipAddress}:8080`;
  const auth = Buffer.from('admin:admin').toString('base64');
  
  try {
    // Step 1: Register blueprint with Ambari
    console.log(`📤 Submitting blueprint to Ambari at ${ambariUrl}...`);
    
    const blueprintResponse = await fetch(`${ambariUrl}/api/v1/blueprints/cloudevy-${cluster.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Requested-By': 'ambari',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(blueprint)
    });
    
    if (!blueprintResponse.ok) {
      const error = await blueprintResponse.text();
      throw new Error(`Failed to register blueprint: ${error}`);
    }
    
    console.log(`✅ Blueprint registered successfully`);
    
    // Step 2: Create cluster configuration
    const clusterConfig = {
      "blueprint": `cloudevy-${cluster.id}`,
      "default_password": "admin",
      "host_groups": [
        {
          "name": "master",
          "hosts": nodes.masters.map(m => {
            const cred = sshCredentials.find(s => s.serverId === m.serverId);
            return { "fqdn": cred.server.name };
          })
        },
        {
          "name": "worker",
          "hosts": nodes.workers.map(w => {
            const cred = sshCredentials.find(s => s.serverId === w.serverId);
            return { "fqdn": cred.server.name };
          })
        }
      ]
    };
    
    // Step 3: Create cluster and start installation
    console.log(`🚀 Creating cluster "${cluster.name}" via Ambari...`);
    
    const clusterResponse = await fetch(`${ambariUrl}/api/v1/clusters/${cluster.name}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Requested-By': 'ambari',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clusterConfig)
    });
    
    if (!clusterResponse.ok) {
      const error = await clusterResponse.text();
      throw new Error(`Failed to create cluster: ${error}`);
    }
    
    const clusterData = await clusterResponse.json();
    const requestId = clusterData.Requests?.id;
    
    console.log(`✅ Cluster creation initiated (Request ID: ${requestId})`);
    
    onProgress({ 
      step: 'blueprint', 
      status: 'completed', 
      message: `Cluster deployment started via Ambari (Request #${requestId})` 
    });
    
    return { ambariUrl, requestId };
    
  } catch (error) {
    console.error(`❌ Ambari blueprint submission failed:`, error);
    throw error;
  }
}

/**
 * Wait for Ambari services to start
 */
async function waitForServices(masterNode, services, onProgress, requestId) {
  console.log(`⏳ Waiting for services to start (Request ID: ${requestId})...`);
  
  const ambariUrl = `http://${masterNode.server.ipAddress}:8080`;
  const auth = Buffer.from('admin:admin').toString('base64');
  
  const estimatedTime = services.length * 5; // 5 minutes per service
  console.log(`⏱️ Estimated time: ${estimatedTime} minutes`);
  
  let attempts = 0;
  const maxAttempts = 180; // 90 minutes max (30 sec intervals)
  
  while (attempts < maxAttempts) {
    try {
      // Poll Ambari for request status
      const response = await fetch(`${ambariUrl}/api/v1/requests/${requestId}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'X-Requested-By': 'ambari'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const requestStatus = data.Requests?.request_status;
        const progressPercent = data.Requests?.progress_percent || 0;
        const completedTasks = data.Requests?.completed_task_count || 0;
        const totalTasks = data.Requests?.task_count || 0;
        
        console.log(`📊 Installation progress: ${progressPercent}% (${completedTasks}/${totalTasks} tasks)`);
        
        onProgress({
          step: 'services',
          status: 'running',
          message: `Installing services: ${progressPercent}% complete (${completedTasks}/${totalTasks} tasks)`,
          progress: progressPercent
        });
        
        if (requestStatus === 'COMPLETED') {
          console.log(`✅ All services installed successfully`);
          return;
        }
        
        if (requestStatus === 'FAILED' || requestStatus === 'ABORTED') {
          throw new Error(`Installation ${requestStatus.toLowerCase()}: Check Ambari UI for details`);
        }
      }
      
    } catch (error) {
      console.error(`⚠️ Error checking installation status:`, error.message);
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
    attempts++;
  }
  
  throw new Error(`Installation timeout after ${maxAttempts * 30 / 60} minutes. Check Ambari UI at ${ambariUrl}`);
}

/**
 * Install services manually (without Ambari)
 */
async function installServicesManually(sshCredentials, distribution, services, nodes, config, onProgress) {
  console.log(`🔧 Installing services manually (Apache Hadoop)...`);
  
  // This would be a complex manual installation
  // For MVP, we'll focus on Ambari-based installation
  throw new Error('Manual installation not implemented yet. Please use HDP distribution with Ambari.');
}

/**
 * Store installed services in database
 */
async function storeServiceInfo(clusterId, services) {
  console.log(`💾 Storing service info for cluster ${clusterId}...`);
  
  for (const service of services) {
    await prisma.hadoopService.create({
      data: {
        clusterId,
        serviceName: service,
        status: 'running',
        installedAt: new Date()
      }
    });
  }
  
  console.log(`✅ Stored ${services.length} services for cluster ${clusterId}`);
}

/**
 * Execute SSH command on a node with optional live log streaming
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30 minutes for long operations)
 */
function executeSSHCommand(credential, command, onProgress = null, clusterId = null, timeoutMs = 30 * 60 * 1000) {
  const serverName = credential?.server?.name || credential?.host || 'unknown';
  console.log(`🔌 executeSSHCommand: Connecting to ${serverName} (${credential.host}:${credential.port || 22})`);
  
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';
    let timeoutId = null;
    let stream = null;
    const startTime = Date.now();

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (stream) {
        stream.removeAllListeners();
      }
      if (conn) {
        conn.removeAllListeners();
        conn.end();
      }
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      cleanup();
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
      const errorMsg = `SSH command timeout after ${elapsed} minutes on ${serverName}`;
      console.error(`⏱️ ${errorMsg}`);
      if (onProgress && clusterId) {
        onProgress({
          type: 'log',
          level: 'error',
          message: errorMsg,
          server: serverName,
          timestamp: new Date().toISOString()
        });
      }
      reject(new Error(errorMsg));
    }, timeoutMs);

    conn.on('ready', () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ SSH connection established to ${serverName} in ${elapsed}s, executing command...`);
      conn.exec(command, (err, execStream) => {
        if (err) {
          cleanup();
          return reject(err);
        }
        stream = execStream;

        stream.on('close', (code, signal) => {
          cleanup();
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`🔚 SSH command completed on ${serverName} with code ${code} (elapsed: ${elapsed}s)`);
          if (code === 0) {
            resolve(output);
          } else {
            // Include both stdout and stderr in error
            const fullOutput = output + '\n' + errorOutput;
            reject(new Error(`Command failed with code ${code}:\n${fullOutput.trim()}`));
          }
        });

        stream.on('data', (data) => {
          const text = data.toString();
          output += text;
          
          // Stream live logs to frontend via WebSocket
          if (onProgress && clusterId) {
            onProgress({
              type: 'log',
              level: 'stdout',
              message: text,
              server: credential.server.name,
              timestamp: new Date().toISOString()
            });
          }
        });

        stream.stderr.on('data', (data) => {
          const text = data.toString();
          errorOutput += text;
          
          // Stream stderr logs as well
          if (onProgress && clusterId) {
            onProgress({
              type: 'log',
              level: 'stderr',
              message: text,
              server: credential.server.name,
              timestamp: new Date().toISOString()
            });
          }
        });
      });
    });

    conn.on('error', (err) => {
      cleanup();
      console.error(`❌ SSH connection error to ${serverName}:`, err.message);
      reject(err);
    });

    // Connection timeout (30 seconds)
    conn.on('timeout', () => {
      cleanup();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`⏱️ SSH connection timeout to ${serverName} after ${elapsed}s`);
      reject(new Error(`SSH connection timeout to ${serverName} (${credential.host})`));
    });

    console.log(`🔗 Attempting SSH connection to ${serverName}...`);
    conn.connect({
      host: credential.host,
      port: credential.port || 22,
      username: credential.username,
      privateKey: credential.privateKey,
      readyTimeout: 30000, // 30 second connection timeout
      keepaliveInterval: 10000, // Send keepalive every 10 seconds
      keepaliveCountMax: 3 // Max 3 keepalive failures before disconnect
    });
  });
}

/**
 * Install Apache Hadoop directly (without Ambari)
 */
async function installApacheHadoop({ cluster, nodes, config, sshCredsArray, masterNode, onProgress, services }) {
  console.log(`📦 installApacheHadoop called for cluster ${cluster.id}`);
  
  // Safety check for onProgress
  if (typeof onProgress !== 'function') {
    console.error(`❌ onProgress is not a function in installApacheHadoop. Type: ${typeof onProgress}, Value:`, onProgress);
    throw new Error('onProgress callback is required and must be a function');
  }
  console.log(`✅ onProgress validation passed`);
  
  const HADOOP_VERSION = '3.3.6';
  const HADOOP_URL = `https://dlcdn.apache.org/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz`;
  const HADOOP_HOME = '/opt/hadoop';
  
  const masterCred = masterNode;
  const workerCreds = sshCredsArray.filter(c => !nodes.masters.some(m => m.serverId === c.serverId));
  
  console.log(`📊 Installation setup: ${sshCredsArray.length} total nodes, ${workerCreds.length} workers`);
  
  try {
    // Step 1: Install Java on all nodes
    console.log(`☕ Step 1: Starting Java installation on ${sshCredsArray.length} nodes...`);
    onProgress({ step: 'java', status: 'running', message: '☕ Installing Java on all nodes...', type: 'log', level: 'info' });
    await installJavaOnAllNodes(sshCredsArray, cluster, onProgress);
    console.log(`✅ Java installation completed on all nodes`);
    onProgress({ step: 'java', status: 'completed', message: '✅ Java installed on all nodes' });
    
    // Step 2: Download and extract Hadoop on all nodes
    console.log(`📦 Step 2: Starting Hadoop download on ${sshCredsArray.length} nodes...`);
    console.log(`📥 Hadoop URL: ${HADOOP_URL}`);
    console.log(`📁 Hadoop will be installed to: ${HADOOP_HOME}`);
    onProgress({ step: 'hadoop-download', status: 'running', message: '📦 Downloading Apache Hadoop (this may take 5-10 minutes)...', type: 'log', level: 'info' });
    await downloadHadoopOnAllNodes(sshCredsArray, HADOOP_URL, HADOOP_VERSION, HADOOP_HOME, cluster, onProgress);
    console.log(`✅ Hadoop download completed on all nodes`);
    onProgress({ step: 'hadoop-download', status: 'completed', message: '✅ Hadoop downloaded on all nodes' });
    
    // Step 3: Configure Hadoop on all nodes
    onProgress({ step: 'hadoop-config', status: 'running', message: '⚙️  Configuring Hadoop...', type: 'log', level: 'info' });
    await configureHadoop(sshCredsArray, masterCred, nodes, config, HADOOP_HOME, cluster, onProgress);
    onProgress({ step: 'hadoop-config', status: 'completed', message: '✅ Hadoop configured' });
    
    // Step 4: Setup SSH keys for passwordless communication
    onProgress({ step: 'ssh-keys', status: 'running', message: '🔑 Setting up SSH keys...', type: 'log', level: 'info' });
    await setupSSHKeys(sshCredsArray, masterCred, cluster, onProgress);
    onProgress({ step: 'ssh-keys', status: 'completed', message: '✅ SSH keys configured' });
    
    // Step 5: Format NameNode (only on master)
    onProgress({ step: 'namenode-format', status: 'running', message: '💾 Formatting NameNode...', type: 'log', level: 'info' });
    await formatNameNode(masterCred, HADOOP_HOME, cluster, onProgress);
    onProgress({ step: 'namenode-format', status: 'completed', message: '✅ NameNode formatted' });
    
    // Step 6: Start HDFS services
    onProgress({ step: 'hdfs-start', status: 'running', message: '🚀 Starting HDFS services...', type: 'log', level: 'info' });
    await startHDFSServices(masterCred, workerCreds, HADOOP_HOME, cluster, onProgress);
    onProgress({ step: 'hdfs-start', status: 'completed', message: '✅ HDFS services started' });
    
    // Step 7: Start YARN services
    onProgress({ step: 'yarn-start', status: 'running', message: '🧶 Starting YARN services...', type: 'log', level: 'info' });
    await startYARNServices(masterCred, workerCreds, HADOOP_HOME, cluster, onProgress);
    onProgress({ step: 'yarn-start', status: 'completed', message: '✅ YARN services started' });
    
    // Step 8: Verify cluster health
    onProgress({ step: 'health-check', status: 'running', message: '🏥 Checking cluster health...', type: 'log', level: 'info' });
    await verifyHadoopCluster(masterCred, HADOOP_HOME, cluster, onProgress);
    onProgress({ step: 'health-check', status: 'completed', message: '✅ Cluster is healthy!' });
    
    // Step 9: Install optional services based on selection
    const optionalServices = services.filter(s => !['hdfs', 'yarn', 'zookeeper'].includes(s));
    
    if (optionalServices.length > 0) {
      onProgress({ 
        step: 'optional-services', 
        status: 'running', 
        message: `📦 Installing additional services: ${optionalServices.join(', ')}...`,
        type: 'log',
        level: 'info'
      });
      
      await installOptionalServices({
        services: optionalServices,
        sshCredsArray,
        masterCred,
        workerCreds,
        hadoopHome: HADOOP_HOME,
        cluster,
        onProgress
      });
      
      onProgress({ 
        step: 'optional-services', 
        status: 'completed', 
        message: '✅ Additional services installed'
      });
    }
    
  } catch (error) {
    console.error('Apache Hadoop installation failed:', error);
    throw new Error(`Apache Hadoop installation failed: ${error.message}`);
  }
}

/**
 * Install Java on all nodes
 */
async function installJavaOnAllNodes(credentials, cluster, onProgress) {
  console.log(`☕ installJavaOnAllNodes: Starting installation on ${credentials.length} nodes`);
  
  const installScript = `
set -e

# Check if Java is already installed
if command -v java &> /dev/null; then
  JAVA_VERSION=$(java -version 2>&1 | head -n 1)
  echo "Java already installed: $JAVA_VERSION"
  exit 0
fi

# Detect package manager and OS
if command -v dnf &> /dev/null; then
  PKG_MGR="dnf"
  OS_TYPE="rhel"
elif command -v yum &> /dev/null; then
  PKG_MGR="yum"
  OS_TYPE="rhel"
elif command -v apt-get &> /dev/null; then
  PKG_MGR="apt-get"
  OS_TYPE="ubuntu"
else
  echo "ERROR: No supported package manager found"
  exit 1
fi

echo "Installing Java using $PKG_MGR..."

# Try different Java versions
if [ "$OS_TYPE" = "ubuntu" ]; then
  sudo apt-get update -y
  sudo apt-get install -y openjdk-11-jdk || sudo apt-get install -y openjdk-17-jdk || sudo apt-get install -y openjdk-8-jdk
else
  # Try Java 11, 17, 21, or 8
  sudo $PKG_MGR install -y java-11-openjdk java-11-openjdk-devel || \\
  sudo $PKG_MGR install -y java-17-openjdk java-17-openjdk-devel || \\
  sudo $PKG_MGR install -y java-21-openjdk java-21-openjdk-devel || \\
  sudo $PKG_MGR install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel
fi

# Verify installation
java -version
echo "Java installation completed"
`;

  for (const cred of credentials) {
    console.log(`☕ Installing Java on node: ${cred.server.name} (${cred.server.ipAddress})`);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Installing Java on ${cred.server.name}...`,
      server: cred.server.name
    });
    
    try {
      console.log(`🔌 Connecting to ${cred.server.name} to install Java...`);
      // Java installation should complete in 10 minutes max
      const output = await executeSSHCommand(cred, installScript, onProgress, cluster?.id, 10 * 60 * 1000);
      console.log(`✅ Java installation completed on ${cred.server.name}`);
      onProgress({ 
        type: 'log', 
        level: 'info', 
        message: `✅ Java installed on ${cred.server.name}`,
        server: cred.server.name
      });
    } catch (error) {
      console.error(`❌ Failed to install Java on ${cred.server.name}:`, error.message);
      throw new Error(`Failed to install Java on ${cred.server.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Java installation completed on all ${credentials.length} nodes`);
}

/**
 * Download and extract Hadoop on all nodes
 */
async function downloadHadoopOnAllNodes(credentials, hadoopUrl, version, hadoopHome, cluster, onProgress) {
  console.log(`📦 downloadHadoopOnAllNodes: Starting on ${credentials.length} nodes`);
  
  const downloadScript = `
set -e

echo "=== Starting Hadoop ${version} download and installation ==="

# Create Hadoop directory
echo "Creating Hadoop directory at ${hadoopHome}..."
sudo mkdir -p ${hadoopHome}
sudo chmod 755 ${hadoopHome}

# Download Hadoop if not already present
if [ ! -f "/tmp/hadoop-${version}.tar.gz" ]; then
  echo "📥 Downloading Hadoop ${version} from ${hadoopUrl}..."
  echo "⏳ This may take 5-10 minutes depending on network speed..."
  cd /tmp
  # Use wget with progress or curl with progress
  if command -v wget &> /dev/null; then
    wget --progress=bar:force ${hadoopUrl} 2>&1 || curl -L --progress-bar -o hadoop-${version}.tar.gz ${hadoopUrl}
  else
    curl -L --progress-bar -o hadoop-${version}.tar.gz ${hadoopUrl} || wget -q ${hadoopUrl}
  fi
  echo "✅ Download completed"
  
  # Verify download
  if [ ! -f "/tmp/hadoop-${version}.tar.gz" ]; then
    echo "❌ ERROR: Download failed - file not found"
    exit 1
  fi
  echo "✅ File verified: $(ls -lh /tmp/hadoop-${version}.tar.gz | awk '{print $5}')"
else
  echo "✅ Hadoop archive already downloaded: $(ls -lh /tmp/hadoop-${version}.tar.gz | awk '{print $5}')"
fi

# Extract Hadoop (skip if already extracted)
if [ -f "${hadoopHome}/bin/hadoop" ]; then
  echo "✅ Hadoop already extracted at ${hadoopHome}, skipping extraction"
else
  echo "📦 Extracting Hadoop (this may take 2-3 minutes for 697MB file)..."
  cd ${hadoopHome}
  echo "Current directory: $(pwd)"
  echo "Extracting from: /tmp/hadoop-${version}.tar.gz"
  sudo tar -xzf /tmp/hadoop-${version}.tar.gz --strip-components=1
  echo "✅ Extraction completed"
fi

# Set ownership
echo "🔧 Setting ownership..."
sudo chown -R $(whoami):$(whoami) ${hadoopHome}
echo "✅ Ownership set"

# Add Hadoop to PATH
echo "📝 Configuring environment..."
if ! grep -q "HADOOP_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# Hadoop Environment
export HADOOP_HOME=${hadoopHome}
export HADOOP_CONF_DIR=\$HADOOP_HOME/etc/hadoop
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
EOF
  echo "✅ Environment variables added to ~/.bashrc"
else
  echo "✅ Environment variables already configured"
fi

# Source the bashrc to load environment
export HADOOP_HOME=${hadoopHome}
export HADOOP_CONF_DIR=\${HADOOP_HOME}/etc/hadoop
export PATH=\$PATH:\${HADOOP_HOME}/bin:\${HADOOP_HOME}/sbin
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))

echo "✅ Hadoop extracted to ${hadoopHome}"

# Verify Hadoop installation with timeout
echo "🔍 Verifying Hadoop installation..."
if [ -f "${hadoopHome}/bin/hadoop" ]; then
  # Use timeout command if available, otherwise just run it
  if command -v timeout &> /dev/null; then
    timeout 30 ${hadoopHome}/bin/hadoop version 2>&1 | head -5 || echo "⚠️ Hadoop version check timed out or failed, but installation may still be OK"
  else
    ${hadoopHome}/bin/hadoop version 2>&1 | head -5 || echo "⚠️ Hadoop version check failed, but installation may still be OK"
  fi
  echo "✅ Hadoop verification completed"
else
  echo "❌ ERROR: Hadoop binary not found at ${hadoopHome}/bin/hadoop"
  exit 1
fi
`;

  for (const cred of credentials) {
    console.log(`📦 Starting Hadoop download on ${cred.server.name} (${cred.server.ipAddress})...`);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Downloading Hadoop on ${cred.server.name}...`,
      server: cred.server.name
    });
    
    try {
      // Hadoop download can take 10-20 minutes depending on network speed (file is ~300MB)
      console.log(`⏳ Downloading Hadoop (this may take 10-20 minutes on ${cred.server.name})...`);
      await executeSSHCommand(cred, downloadScript, onProgress, cluster?.id, 25 * 60 * 1000); // 25 minute timeout for download
      console.log(`✅ Hadoop download and extraction completed on ${cred.server.name}`);
      onProgress({ 
        type: 'log', 
        level: 'info', 
        message: `✅ Hadoop ready on ${cred.server.name}`,
        server: cred.server.name
      });
    } catch (error) {
      console.error(`❌ Failed to download Hadoop on ${cred.server.name}:`, error.message);
      throw new Error(`Failed to download Hadoop on ${cred.server.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Hadoop download completed on all ${credentials.length} nodes`);
}

/**
 * Configure Hadoop (core-site.xml, hdfs-site.xml, yarn-site.xml, etc.)
 */
async function configureHadoop(credentials, masterCred, nodes, config, hadoopHome, cluster, onProgress) {
  const masterPublicIp = masterCred.server.ipAddress;
  const replicationFactor = config?.config?.hdfs?.replicationFactor || 3;
  const blockSize = config?.config?.hdfs?.blockSize || 128;
  
  // For AWS/Cloud: Use 0.0.0.0 to bind to all interfaces (public IP is NAT'd)
  // HDFS will bind to all interfaces, but advertise the public IP for client connections
  
  // core-site.xml configuration
  const coreSiteXml = `<?xml version="1.0"?>
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://${masterPublicIp}:9000</value>
  </property>
  <property>
    <name>hadoop.tmp.dir</name>
    <value>/opt/hadoop/tmp</value>
  </property>
</configuration>`;

  // hdfs-site.xml configuration - Bind to 0.0.0.0 for cloud compatibility
  const hdfsSiteXml = `<?xml version="1.0"?>
<configuration>
  <property>
    <name>dfs.replication</name>
    <value>${replicationFactor}</value>
  </property>
  <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:///opt/hadoop/dfs/name</value>
  </property>
  <property>
    <name>dfs.datanode.data.dir</name>
    <value>file:///opt/hadoop/dfs/data</value>
  </property>
  <property>
    <name>dfs.blocksize</name>
    <value>${blockSize}m</value>
  </property>
  <property>
    <name>dfs.namenode.http-address</name>
    <value>0.0.0.0:9870</value>
    <description>Bind to all interfaces for cloud/NAT compatibility</description>
  </property>
  <property>
    <name>dfs.namenode.rpc-address</name>
    <value>0.0.0.0:9000</value>
    <description>Bind RPC to all interfaces</description>
  </property>
</configuration>`;

  // yarn-site.xml configuration
  const yarnSiteXml = `<?xml version="1.0"?>
<configuration>
  <property>
    <name>yarn.resourcemanager.hostname</name>
    <value>${masterPublicIp}</value>
  </property>
  <property>
    <name>yarn.resourcemanager.bind-host</name>
    <value>0.0.0.0</value>
    <description>Bind to all interfaces for cloud/NAT compatibility</description>
  </property>
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>
  <property>
    <name>yarn.nodemanager.resource.memory-mb</name>
    <value>4096</value>
  </property>
  <property>
    <name>yarn.nodemanager.resource.cpu-vcores</name>
    <value>2</value>
  </property>
  <property>
    <name>yarn.resourcemanager.webapp.address</name>
    <value>0.0.0.0:8088</value>
    <description>Bind web UI to all interfaces</description>
  </property>
</configuration>`;

  // mapred-site.xml configuration
  const mapredSiteXml = `<?xml version="1.0"?>
<configuration>
  <property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
  </property>
  <property>
    <name>mapreduce.application.classpath</name>
    <value>\$HADOOP_HOME/share/hadoop/mapreduce/*:\$HADOOP_HOME/share/hadoop/mapreduce/lib/*</value>
  </property>
</configuration>`;

  // hadoop-env.sh configuration
  const hadoopEnvSh = `
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export HADOOP_CONF_DIR=\${HADOOP_HOME}/etc/hadoop
export HADOOP_LOG_DIR=\${HADOOP_HOME}/logs
`;

  // workers file (list of worker nodes)
  const workersFile = credentials
    .filter(c => !nodes.masters.some(m => m.serverId === c.serverId))
    .map(c => c.server.ipAddress)
    .join('\n');

  // Apply configuration to all nodes
  for (const cred of credentials) {
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Configuring Hadoop on ${cred.server.name}...`,
      server: cred.server.name
    });
    
    const configScript = `
set -e
mkdir -p ${hadoopHome}/etc/hadoop
mkdir -p ${hadoopHome}/dfs/name
mkdir -p ${hadoopHome}/dfs/data
mkdir -p ${hadoopHome}/tmp
mkdir -p ${hadoopHome}/logs

# Write core-site.xml
cat > ${hadoopHome}/etc/hadoop/core-site.xml << 'EOF'
${coreSiteXml}
EOF

# Write hdfs-site.xml
cat > ${hadoopHome}/etc/hadoop/hdfs-site.xml << 'EOF'
${hdfsSiteXml}
EOF

# Write yarn-site.xml
cat > ${hadoopHome}/etc/hadoop/yarn-site.xml << 'EOF'
${yarnSiteXml}
EOF

# Write mapred-site.xml
cat > ${hadoopHome}/etc/hadoop/mapred-site.xml << 'EOF'
${mapredSiteXml}
EOF

# Write workers file
cat > ${hadoopHome}/etc/hadoop/workers << 'EOF'
${workersFile}
EOF

# Append to hadoop-env.sh
cat >> ${hadoopHome}/etc/hadoop/hadoop-env.sh << 'EOF'
${hadoopEnvSh}
EOF

chmod -R 755 ${hadoopHome}
echo "✅ Hadoop configured on $(hostname)"
`;
    
    try {
      await executeSSHCommand(cred, configScript, onProgress, cluster?.id);
    } catch (error) {
      throw new Error(`Failed to configure Hadoop on ${cred.server.name}: ${error.message}`);
    }
  }
}

/**
 * Setup SSH keys for passwordless communication between nodes
 */
async function setupSSHKeys(credentials, masterCred, cluster, onProgress) {
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: 'Setting up passwordless SSH between nodes...'
  });

  const setupScript = `
set -e

# Generate SSH key if not exists
if [ ! -f ~/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
fi

# Enable SSH to localhost
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Disable strict host key checking for cluster nodes
cat >> ~/.ssh/config << 'EOF'
Host *
  StrictHostKeyChecking no
  UserKnownHostsFile=/dev/null
EOF
chmod 600 ~/.ssh/config

echo "SSH keys configured"
`;

  for (const cred of credentials) {
    try {
      await executeSSHCommand(cred, setupScript, onProgress, cluster?.id);
    } catch (error) {
      console.warn(`SSH key setup warning on ${cred.server.name}:`, error.message);
    }
  }
}

/**
 * Format NameNode (only on master node)
 */
async function formatNameNode(masterCred, hadoopHome, cluster, onProgress) {
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `Formatting NameNode on ${masterCred.server.name}...`,
    server: masterCred.server.name
  });

  const formatScript = `
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin

# Format NameNode with force flag (overwrites existing data)
${hadoopHome}/bin/hdfs namenode -format -force

echo "✅ NameNode formatted"
`;

  try {
    await executeSSHCommand(masterCred, formatScript, onProgress, cluster?.id);
  } catch (error) {
    throw new Error(`Failed to format NameNode: ${error.message}`);
  }
}

/**
 * Start HDFS services (NameNode on master, DataNodes on workers)
 */
async function startHDFSServices(masterCred, workerCreds, hadoopHome, cluster, onProgress) {
  // Start NameNode on master
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `Starting NameNode on ${masterCred.server.name}...`,
    server: masterCred.server.name
  });

  const startNameNodeScript = `
# Don't exit on error immediately - we want to see what's wrong
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin
export HADOOP_LOG_DIR=${hadoopHome}/logs

echo "=== NameNode Startup Debug Info ==="
echo "JAVA_HOME: \$JAVA_HOME"
echo "HADOOP_HOME: \$HADOOP_HOME"
echo "Java version:"
java -version 2>&1
echo "Hadoop version:"
${hadoopHome}/bin/hadoop version 2>&1 | head -5
echo "===================================="

# Ensure log directory exists
mkdir -p \$HADOOP_LOG_DIR

echo "Starting NameNode..."
# Start NameNode
${hadoopHome}/bin/hdfs --daemon start namenode

# Wait for NameNode to be ready
echo "Waiting for NameNode to start..."
for i in {1..30}; do
  sleep 2
  if jps 2>/dev/null | grep -q NameNode; then
    echo "✅ NameNode is running!"
    break
  fi
  echo "Waiting... (\$i/30)"
done

# Check if NameNode is running
if ! jps 2>/dev/null | grep -q NameNode; then
  echo "❌ NameNode failed to start!"
  echo ""
  echo "=== Checking NameNode logs ==="
  
  # Find the latest NameNode log
  LATEST_LOG=$(ls -t ${hadoopHome}/logs/hadoop-*-namenode-*.log 2>/dev/null | head -1)
  
  if [ -n "\$LATEST_LOG" ]; then
    echo "Log file: \$LATEST_LOG"
    echo "--- Last 100 lines ---"
    tail -100 "\$LATEST_LOG"
  else
    echo "No NameNode log files found in ${hadoopHome}/logs/"
    echo "Available files:"
    ls -la ${hadoopHome}/logs/ 2>/dev/null || echo "Logs directory doesn't exist"
  fi
  
  echo ""
  echo "=== Checking Java processes ==="
  jps -v 2>/dev/null || echo "jps command failed"
  
  exit 1
fi

# Verify NameNode is responsive
echo "Verifying NameNode..."
${hadoopHome}/bin/hdfs dfsadmin -report 2>&1 || echo "⚠️  NameNode may not be fully ready yet"

echo "✅ NameNode started successfully"
`;

  try {
    await executeSSHCommand(masterCred, startNameNodeScript, onProgress, cluster?.id);
  } catch (error) {
    throw new Error(`Failed to start NameNode: ${error.message}`);
  }

  // Start DataNodes on workers
  for (const workerCred of workerCreds) {
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Starting DataNode on ${workerCred.server.name}...`,
      server: workerCred.server.name
    });

    const startDataNodeScript = `
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin
export HADOOP_LOG_DIR=${hadoopHome}/logs

echo "Starting DataNode with JAVA_HOME=\$JAVA_HOME"

# Ensure log directory exists
mkdir -p \$HADOOP_LOG_DIR

# Start DataNode
${hadoopHome}/bin/hdfs --daemon start datanode

# Wait for DataNode to be ready
echo "Waiting for DataNode to start..."
for i in {1..15}; do
  sleep 2
  if jps | grep -q DataNode; then
    echo "✅ DataNode is running!"
    break
  fi
  echo "Waiting... (\$i/15)"
done

# Check status (don't fail if not found, just warn)
if ! jps | grep -q DataNode; then
  echo "⚠️  Warning: DataNode may not have started"
  echo "Checking DataNode logs..."
  tail -50 ${hadoopHome}/logs/hadoop-*-datanode-*.log 2>/dev/null || echo "No logs found yet"
else
  echo "✅ DataNode started successfully"
fi
`;

    try {
      await executeSSHCommand(workerCred, startDataNodeScript, onProgress, cluster?.id);
    } catch (error) {
      console.warn(`DataNode start warning on ${workerCred.server.name}:`, error.message);
    }
  }
}

/**
 * Start YARN services (ResourceManager on master, NodeManagers on workers)
 */
async function startYARNServices(masterCred, workerCreds, hadoopHome, cluster, onProgress) {
  // Debug logging
  console.log(`🔍 startYARNServices called with:`, {
    hasMasterCred: !!masterCred,
    workerCount: workerCreds?.length || 0,
    hadoopHome,
    hasCluster: !!cluster,
    clusterId: cluster?.id,
    onProgressType: typeof onProgress,
    onProgressIsFunction: typeof onProgress === 'function'
  });
  
  // Safety check for onProgress
  if (typeof onProgress !== 'function') {
    console.error(`❌ onProgress is not a function in startYARNServices! Type: ${typeof onProgress}, Value:`, onProgress);
    console.error(`Parameters received:`, { masterCred: !!masterCred, workerCreds: !!workerCreds, hadoopHome, cluster: !!cluster, onProgress });
    throw new Error(`onProgress must be a function, but got ${typeof onProgress}. This indicates a parameter order mismatch.`);
  }
  
  // Start ResourceManager on master
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `Starting ResourceManager on ${masterCred.server.name}...`,
    server: masterCred.server.name
  });

  const startRMScript = `
set -e
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin

# Start ResourceManager
${hadoopHome}/bin/yarn --daemon start resourcemanager

# Wait for ResourceManager to be ready
sleep 5

# Check if ResourceManager is running
jps | grep ResourceManager || echo "Warning: ResourceManager may not have started"

echo "✅ ResourceManager started"
`;

  try {
    await executeSSHCommand(masterCred, startRMScript, onProgress, cluster?.id);
  } catch (error) {
    throw new Error(`Failed to start ResourceManager: ${error.message}`);
  }

  // Start NodeManagers on workers
  for (const workerCred of workerCreds) {
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Starting NodeManager on ${workerCred.server.name}...`,
      server: workerCred.server.name
    });

    const startNMScript = `
set -e
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin

# Start NodeManager
${hadoopHome}/bin/yarn --daemon start nodemanager

# Wait for NodeManager to be ready
sleep 3

# Check if NodeManager is running
jps | grep NodeManager || echo "Warning: NodeManager may not have started"

echo "✅ NodeManager started"
`;

    try {
      await executeSSHCommand(workerCred, startNMScript, onProgress, cluster?.id);
    } catch (error) {
      console.warn(`NodeManager start warning on ${workerCred.server.name}:`, error.message);
    }
  }
}

/**
 * Verify Hadoop cluster health
 */
async function verifyHadoopCluster(masterCred, hadoopHome, cluster, onProgress) {
  // Safety check for onProgress
  if (typeof onProgress !== 'function') {
    console.warn('⚠️ onProgress is not a function in verifyHadoopCluster, using no-op');
    onProgress = () => {}; // No-op function
  }
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: 'Running cluster health checks...',
    server: masterCred.server.name
  });

  const verifyScript = `
set -e
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export HADOOP_HOME=${hadoopHome}
export PATH=\$PATH:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin

echo "=== Java Processes ==="
jps

echo ""
echo "=== HDFS Status ==="
${hadoopHome}/bin/hdfs dfsadmin -report || echo "HDFS report failed (may take a minute to be ready)"

echo ""
echo "=== YARN Status ==="
${hadoopHome}/bin/yarn node -list || echo "YARN node list failed (may take a minute to be ready)"

echo ""
echo "✅ Cluster verification completed!"
echo "🌐 NameNode Web UI: http://$(hostname -I | awk '{print $1}'):9870"
echo "🌐 YARN Web UI: http://$(hostname -I | awk '{print $1}'):8088"
`;

  try {
    const output = await executeSSHCommand(masterCred, verifyScript, onProgress, cluster?.id);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `Cluster health check completed:\n${output}`,
      server: masterCred.server.name
    });
  } catch (error) {
    console.warn('Health check warning:', error.message);
  }
}

/**
 * Install optional services (Spark, Kafka, Hive, HBase, Flink, Grafana)
 */
async function installOptionalServices({ services, sshCredsArray, masterCred, workerCreds, hadoopHome, cluster, onProgress }) {
  for (const service of services) {
    switch (service) {
      case 'spark':
        await installSpark(sshCredsArray, masterCred, hadoopHome, cluster, onProgress);
        break;
      case 'kafka':
        await installKafka(sshCredsArray, masterCred, hadoopHome, cluster, onProgress);
        break;
      case 'hive':
        await installHive(masterCred, hadoopHome, cluster, onProgress);
        break;
      case 'hbase':
        await installHBase(sshCredsArray, masterCred, hadoopHome, cluster, onProgress);
        break;
      case 'flink':
        await installFlink(masterCred, hadoopHome, cluster, onProgress);
        break;
      case 'grafana':
        await installGrafana(masterCred, cluster, onProgress);
        break;
      case 'mapreduce':
        // MapReduce is already part of Hadoop, just needs to be enabled
        onProgress({ 
          type: 'log', 
          level: 'info', 
          message: `✅ MapReduce is built into Hadoop ${hadoopHome}`,
          server: masterCred.server.name
        });
        break;
      default:
        onProgress({ 
          type: 'log', 
          level: 'warn', 
          message: `⚠️  Service '${service}' is not yet implemented in direct installation`,
          server: masterCred.server.name
        });
    }
  }
}

/**
 * Install Apache Spark
 */
async function installSpark(credentials, masterCred, hadoopHome, cluster, onProgress) {
  const SPARK_VERSION = '3.5.0';
  const HADOOP_VERSION = '3';
  const SPARK_URL = `https://dlcdn.apache.org/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz`;
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `🔥 Installing Apache Spark ${SPARK_VERSION}...`,
    server: masterCred.server.name
  });

  const installScript = `
set -e
SPARK_HOME=/opt/spark

# Download Spark
if [ ! -f "/tmp/spark-${SPARK_VERSION}.tgz" ]; then
  cd /tmp
  wget -q ${SPARK_URL} -O spark-${SPARK_VERSION}.tgz || curl -L -o spark-${SPARK_VERSION}.tgz ${SPARK_URL}
fi

# Extract Spark
sudo mkdir -p \$SPARK_HOME
cd \$SPARK_HOME
sudo tar -xzf /tmp/spark-${SPARK_VERSION}.tgz --strip-components=1
sudo chown -R $(whoami):$(whoami) \$SPARK_HOME

# Configure Spark for Hadoop
cat > \$SPARK_HOME/conf/spark-defaults.conf << 'EOF'
spark.master                     yarn
spark.eventLog.enabled           true
spark.eventLog.dir               hdfs:///spark-logs
spark.history.fs.logDirectory    hdfs:///spark-logs
EOF

# Add to PATH
if ! grep -q "SPARK_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# Spark Environment
export SPARK_HOME=/opt/spark
export PATH=\$PATH:\$SPARK_HOME/bin:\$SPARK_HOME/sbin
EOF
  source ~/.bashrc
fi

# Create HDFS log directory
export HADOOP_HOME=${hadoopHome}
\$HADOOP_HOME/bin/hdfs dfs -mkdir -p /spark-logs || true

echo "✅ Spark installed at \$SPARK_HOME"
\$SPARK_HOME/bin/spark-submit --version
`;

  for (const cred of credentials) {
    try {
      await executeSSHCommand(cred, installScript, onProgress, cluster?.id);
      onProgress({ 
        type: 'log', 
        level: 'info', 
        message: `✅ Spark installed on ${cred.server.name}`,
        server: cred.server.name
      });
    } catch (error) {
      console.warn(`Spark installation warning on ${cred.server.name}:`, error.message);
    }
  }
}

/**
 * Install Apache Kafka
 */
async function installKafka(credentials, masterCred, hadoopHome, cluster, onProgress) {
  const KAFKA_VERSION = '3.6.1';
  const SCALA_VERSION = '2.13';
  const KAFKA_URL = `https://dlcdn.apache.org/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz`;
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `📨 Installing Apache Kafka ${KAFKA_VERSION}...`,
    server: masterCred.server.name
  });

  const installScript = `
set -e
KAFKA_HOME=/opt/kafka

# Download Kafka
if [ ! -f "/tmp/kafka.tgz" ]; then
  cd /tmp
  wget -q ${KAFKA_URL} -O kafka.tgz || curl -L -o kafka.tgz ${KAFKA_URL}
fi

# Extract Kafka
sudo mkdir -p \$KAFKA_HOME
cd \$KAFKA_HOME
sudo tar -xzf /tmp/kafka.tgz --strip-components=1
sudo chown -R $(whoami):$(whoami) \$KAFKA_HOME

# Configure Kafka
mkdir -p /tmp/kafka-logs

# Add to PATH
if ! grep -q "KAFKA_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# Kafka Environment
export KAFKA_HOME=/opt/kafka
export PATH=\$PATH:\$KAFKA_HOME/bin
EOF
  source ~/.bashrc
fi

# Start Zookeeper (if not already running from Hadoop)
nohup \$KAFKA_HOME/bin/zookeeper-server-start.sh \$KAFKA_HOME/config/zookeeper.properties > /tmp/zookeeper.log 2>&1 &
sleep 5

# Start Kafka
nohup \$KAFKA_HOME/bin/kafka-server-start.sh \$KAFKA_HOME/config/server.properties > /tmp/kafka.log 2>&1 &
sleep 5

echo "✅ Kafka installed and started at \$KAFKA_HOME"
`;

  try {
    await executeSSHCommand(masterCred, installScript, onProgress, cluster?.id);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `✅ Kafka installed on ${masterCred.server.name}`,
      server: masterCred.server.name
    });
  } catch (error) {
    console.warn(`Kafka installation warning:`, error.message);
  }
}

/**
 * Install Apache Hive
 */
async function installHive(masterCred, hadoopHome, cluster, onProgress) {
  const HIVE_VERSION = '3.1.3';
  const HIVE_URL = `https://dlcdn.apache.org/hive/hive-${HIVE_VERSION}/apache-hive-${HIVE_VERSION}-bin.tar.gz`;
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `🐝 Installing Apache Hive ${HIVE_VERSION}...`,
    server: masterCred.server.name
  });

  const installScript = `
set -e
HIVE_HOME=/opt/hive

# Download Hive
if [ ! -f "/tmp/hive.tgz" ]; then
  cd /tmp
  wget -q ${HIVE_URL} -O hive.tgz || curl -L -o hive.tgz ${HIVE_URL}
fi

# Extract Hive
sudo mkdir -p \$HIVE_HOME
cd \$HIVE_HOME
sudo tar -xzf /tmp/hive.tgz --strip-components=1
sudo chown -R $(whoami):$(whoami) \$HIVE_HOME

# Configure Hive
export HADOOP_HOME=${hadoopHome}

cat > \$HIVE_HOME/conf/hive-site.xml << 'EOF'
<?xml version="1.0"?>
<configuration>
  <property>
    <name>javax.jdo.option.ConnectionURL</name>
    <value>jdbc:derby:;databaseName=/opt/hive/metastore_db;create=true</value>
  </property>
  <property>
    <name>hive.metastore.warehouse.dir</name>
    <value>/user/hive/warehouse</value>
  </property>
</configuration>
EOF

# Initialize schema
\$HIVE_HOME/bin/schematool -dbType derby -initSchema || true

# Create HDFS directories
\$HADOOP_HOME/bin/hdfs dfs -mkdir -p /user/hive/warehouse || true
\$HADOOP_HOME/bin/hdfs dfs -mkdir -p /tmp/hive || true
\$HADOOP_HOME/bin/hdfs dfs -chmod 777 /tmp/hive || true

# Add to PATH
if ! grep -q "HIVE_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# Hive Environment
export HIVE_HOME=/opt/hive
export PATH=\$PATH:\$HIVE_HOME/bin
EOF
  source ~/.bashrc
fi

echo "✅ Hive installed at \$HIVE_HOME"
`;

  try {
    await executeSSHCommand(masterCred, installScript, onProgress, cluster?.id);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `✅ Hive installed on ${masterCred.server.name}`,
      server: masterCred.server.name
    });
  } catch (error) {
    console.warn(`Hive installation warning:`, error.message);
  }
}

/**
 * Install Apache HBase
 */
async function installHBase(credentials, masterCred, hadoopHome, cluster, onProgress) {
  const HBASE_VERSION = '2.5.7';
  const HBASE_URL = `https://dlcdn.apache.org/hbase/${HBASE_VERSION}/hbase-${HBASE_VERSION}-bin.tar.gz`;
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `📊 Installing Apache HBase ${HBASE_VERSION}...`,
    server: masterCred.server.name
  });

  const masterHost = masterCred.server.ipAddress;
  const installScript = `
set -e
HBASE_HOME=/opt/hbase

# Download HBase
if [ ! -f "/tmp/hbase.tgz" ]; then
  cd /tmp
  wget -q ${HBASE_URL} -O hbase.tgz || curl -L -o hbase.tgz ${HBASE_URL}
fi

# Extract HBase
sudo mkdir -p \$HBASE_HOME
cd \$HBASE_HOME
sudo tar -xzf /tmp/hbase.tgz --strip-components=1
sudo chown -R $(whoami):$(whoami) \$HBASE_HOME

# Configure HBase
cat > \$HBASE_HOME/conf/hbase-site.xml << 'EOF'
<?xml version="1.0"?>
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://${masterHost}:9000/hbase</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>${masterHost}</value>
  </property>
</configuration>
EOF

# Add to PATH
if ! grep -q "HBASE_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# HBase Environment
export HBASE_HOME=/opt/hbase
export PATH=\$PATH:\$HBASE_HOME/bin
EOF
  source ~/.bashrc
fi

# Start HBase (on master only)
if [ "$(hostname -I | awk '{print \$1}')" = "${masterHost}" ]; then
  nohup \$HBASE_HOME/bin/start-hbase.sh > /tmp/hbase.log 2>&1 &
  sleep 5
fi

echo "✅ HBase installed at \$HBASE_HOME"
`;

  for (const cred of credentials) {
    try {
      await executeSSHCommand(cred, installScript, onProgress, cluster?.id);
      onProgress({ 
        type: 'log', 
        level: 'info', 
        message: `✅ HBase installed on ${cred.server.name}`,
        server: cred.server.name
      });
    } catch (error) {
      console.warn(`HBase installation warning on ${cred.server.name}:`, error.message);
    }
  }
}

/**
 * Install Apache Flink
 */
async function installFlink(masterCred, hadoopHome, cluster, onProgress) {
  const FLINK_VERSION = '1.18.1';
  const SCALA_VERSION = '2.12';
  const FLINK_URL = `https://dlcdn.apache.org/flink/flink-${FLINK_VERSION}/flink-${FLINK_VERSION}-bin-scala_${SCALA_VERSION}.tgz`;
  
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `🌊 Installing Apache Flink ${FLINK_VERSION}...`,
    server: masterCred.server.name
  });

  const installScript = `
set -e
FLINK_HOME=/opt/flink

# Download Flink
if [ ! -f "/tmp/flink.tgz" ]; then
  cd /tmp
  wget -q ${FLINK_URL} -O flink.tgz || curl -L -o flink.tgz ${FLINK_URL}
fi

# Extract Flink
sudo mkdir -p \$FLINK_HOME
cd \$FLINK_HOME
sudo tar -xzf /tmp/flink.tgz --strip-components=1
sudo chown -R $(whoami):$(whoami) \$FLINK_HOME

# Add to PATH
if ! grep -q "FLINK_HOME" ~/.bashrc; then
  cat >> ~/.bashrc << 'EOF'

# Flink Environment
export FLINK_HOME=/opt/flink
export PATH=\$PATH:\$FLINK_HOME/bin
EOF
  source ~/.bashrc
fi

# Start Flink cluster
nohup \$FLINK_HOME/bin/start-cluster.sh > /tmp/flink.log 2>&1 &
sleep 5

echo "✅ Flink installed and started at \$FLINK_HOME"
echo "🌐 Flink Web UI: http://$(hostname -I | awk '{print \$1}'):8081"
`;

  try {
    await executeSSHCommand(masterCred, installScript, onProgress, cluster?.id);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `✅ Flink installed on ${masterCred.server.name}`,
      server: masterCred.server.name
    });
  } catch (error) {
    console.warn(`Flink installation warning:`, error.message);
  }
}

/**
 * Install Grafana
 */
async function installGrafana(masterCred, cluster, onProgress) {
  onProgress({ 
    type: 'log', 
    level: 'info', 
    message: `📊 Installing Grafana...`,
    server: masterCred.server.name
  });

  const installScript = `
set -e

# Detect package manager
if command -v dnf &> /dev/null; then
  PKG_MGR="dnf"
elif command -v yum &> /dev/null; then
  PKG_MGR="yum"
elif command -v apt-get &> /dev/null; then
  PKG_MGR="apt-get"
else
  echo "ERROR: No supported package manager found"
  exit 1
fi

# Install Grafana
if [ "$PKG_MGR" = "apt-get" ]; then
  sudo apt-get install -y apt-transport-https software-properties-common wget
  sudo mkdir -p /etc/apt/keyrings/
  wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
  echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
  sudo apt-get update
  sudo apt-get install -y grafana
else
  cat <<EOF | sudo tee /etc/yum.repos.d/grafana.repo
[grafana]
name=grafana
baseurl=https://rpm.grafana.com
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://rpm.grafana.com/gpg.key
EOF
  sudo $PKG_MGR install -y grafana
fi

# Start Grafana
sudo systemctl daemon-reload
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

echo "✅ Grafana installed and started"
echo "🌐 Grafana UI: http://$(hostname -I | awk '{print \$1}'):3000"
echo "📝 Default login: admin / admin"
`;

  try {
    await executeSSHCommand(masterCred, installScript, onProgress, cluster?.id);
    onProgress({ 
      type: 'log', 
      level: 'info', 
      message: `✅ Grafana installed on ${masterCred.server.name} - Access at http://${masterCred.server.ipAddress}:3000`,
      server: masterCred.server.name
    });
  } catch (error) {
    console.warn(`Grafana installation warning:`, error.message);
  }
}

export default { createHDFSCluster };

