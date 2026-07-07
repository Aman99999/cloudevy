import { Client } from 'ssh2';
import { decryptSSHKey } from './sshLogStreamer.js';
import { CloudProvisionerService } from './cloudProvisionerService.js';
import { getMultipleServerSSHCredentials } from './sshResolver.js';
import prisma from '../config/prisma.js';
import { EC2Client, AuthorizeSecurityGroupIngressCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

// Cache CloudEvy server's public IP (fetch once per process lifetime)
let cachedCloudEvyIP = null;

export class KubernetesProvisioner {
  constructor(cluster, servers, sshCredentials) {
    this.cluster = cluster;
    this.servers = servers;
    this.sshCredentials = sshCredentials;
    this.masterNode = servers[0];
    this.workerNodes = servers.slice(1);
  }

  /**
   * Get CloudEvy server's public IP
   */
  async getCloudEvyServerIP() {
    if (cachedCloudEvyIP) {
      console.log(`📍 Using cached CloudEvy IP: ${cachedCloudEvyIP}`);
      return cachedCloudEvyIP;
    }

    try {
      // Try to get IP from AWS metadata (if running on EC2)
      const response = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4', {
        timeout: 2000
      });
      
      if (response.ok) {
        cachedCloudEvyIP = await response.text();
        console.log(`📍 Detected CloudEvy IP from AWS metadata: ${cachedCloudEvyIP}`);
        return cachedCloudEvyIP;
      }
    } catch (error) {
      // Not running on EC2 or metadata service unavailable
    }

    try {
      // Fallback: Use external IP detection service
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 5000
      });
      const data = await response.json();
      cachedCloudEvyIP = data.ip;
      console.log(`📍 Detected CloudEvy IP from ipify: ${cachedCloudEvyIP}`);
      return cachedCloudEvyIP;
    } catch (error) {
      console.error('❌ Failed to detect CloudEvy server IP:', error.message);
      return null;
    }
  }

  /**
   * Add security group rule to allow CloudEvy access to K3s API
   */
  async addCloudEvySecurityGroupRule(instanceId, cloudAccountId) {
    try {
      console.log(`🔐 Configuring security group for K3s master ${instanceId}...`);

      // Get CloudEvy server IP
      const cloudEvyIP = await this.getCloudEvyServerIP();
      if (!cloudEvyIP) {
        console.warn('⚠️ Could not detect CloudEvy IP, skipping auto-fix');
        return false;
      }

      // Get cloud account credentials
      const cloudAccount = await prisma.cloudAccount.findUnique({
        where: { id: cloudAccountId }
      });

      if (!cloudAccount) {
        console.warn('⚠️ Cloud account not found, skipping auto-fix');
        return false;
      }

      // Decrypt credentials
      const { decryptCredentials } = await import('../routes/cloudAccounts.js');
      const decryptedCreds = JSON.parse(decryptCredentials(cloudAccount.credentials));

      // Initialize EC2 client
      const ec2Client = new EC2Client({
        region: cloudAccount.region,
        credentials: {
          accessKeyId: decryptedCreds.accessKey,
          secretAccessKey: decryptedCreds.secretKey
        }
      });

      // Get instance security groups
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const describeResult = await ec2Client.send(describeCommand);
      
      const instance = describeResult.Reservations?.[0]?.Instances?.[0];
      if (!instance || !instance.SecurityGroups || instance.SecurityGroups.length === 0) {
        console.warn('⚠️ No security groups found for instance');
        return false;
      }

      const securityGroupId = instance.SecurityGroups[0].GroupId;
      console.log(`🔒 Found security group: ${securityGroupId}`);

      // Add inbound rule for CloudEvy IP on port 6443
      const authorizeCommand = new AuthorizeSecurityGroupIngressCommand({
        GroupId: securityGroupId,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: 6443,
            ToPort: 6443,
            IpRanges: [
              {
                CidrIp: `${cloudEvyIP}/32`,
                Description: 'CloudEvy metrics and management access'
              }
            ]
          }
        ]
      });

      await ec2Client.send(authorizeCommand);
      console.log(`✅ Security group rule added: ${cloudEvyIP}/32 → port 6443`);
      return true;

    } catch (error) {
      // Rule might already exist
      if (error.name === 'InvalidPermission.Duplicate') {
        console.log(`ℹ️ Security group rule already exists for CloudEvy IP`);
        return true;
      }
      
      console.error('❌ Failed to add security group rule:', error.message);
      return false;
    }
  }

  /**
   * Create a K3s cluster (lightweight Kubernetes)
   */
  async createK3sCluster(onProgress) {
    try {
      onProgress({ step: 'init', status: 'running', message: 'Starting K3s cluster creation...' });

      // Step 1: Install K3s on master node
      onProgress({ step: 'master', status: 'running', message: 'Installing K3s on master node...' });
      
      const masterCreds = this.sshCredentials[this.masterNode.id];
      const masterPublicIp = this.masterNode.ipAddress;
      const masterPrivateIp = this.masterNode.privateIpAddress || this.masterNode.ipAddress;
      
      // Track security configuration status
      let securityRuleAdded = false;
      
      // Install K3s with both public and private IPs in the TLS certificate
      // This allows external kubectl access using public IP without certificate errors
      const masterScript = `
        # Install K3s server (master) with TLS SAN for both public and private IPs
        curl -sfL https://get.k3s.io | sh -s - --tls-san=${masterPublicIp} --tls-san=${masterPrivateIp}
      `;

      await this.executeSSH(this.masterNode, masterCreds, masterScript, onProgress);
      
      onProgress({ step: 'master', status: 'running', message: 'Waiting for K3s API server to be ready...' });
      
      // Wait for K3s API server to be ready with retries
      const maxRetries = 30; // 30 attempts * 10 seconds = 5 minutes max wait
      let apiServerReady = false;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const checkScript = 'sudo /usr/local/bin/k3s kubectl get nodes';
          const result = await this.executeSSH(this.masterNode, masterCreds, checkScript, onProgress);
          
          if (result && !result.includes('error') && !result.includes('ERROR') && !result.includes('connection refused')) {
            console.log(`✅ K3s API server is ready (attempt ${i + 1}/${maxRetries})`);
            apiServerReady = true;
            break;
          }
        } catch (error) {
          console.log(`⏳ Waiting for K3s API server... (attempt ${i + 1}/${maxRetries})`);
        }
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between attempts
        }
      }
      
      if (!apiServerReady) {
        throw new Error(`K3s master failed to start after ${maxRetries * 10} seconds. The API server is not responding. Please check the master node logs with: sudo journalctl -u k3s -n 100`);
      }
      
      // Auto-configure security group to allow CloudEvy access
      onProgress({ step: 'security', status: 'running', message: 'Configuring security group for CloudEvy access...' });
      
      if (this.masterNode.cloudAccountId && this.masterNode.instanceId) {
        securityRuleAdded = await this.addCloudEvySecurityGroupRule(
          this.masterNode.instanceId,
          this.masterNode.cloudAccountId
        );
        
        if (securityRuleAdded) {
          onProgress({ step: 'security', status: 'completed', message: 'Security group configured successfully' });
        } else {
          console.warn('⚠️ Could not auto-configure security group. Manual configuration may be needed.');
          onProgress({ step: 'security', status: 'warning', message: 'Auto-configuration failed - manual setup required' });
        }
      } else {
        console.log('ℹ️ Skipping security group auto-configuration (missing instanceId or cloudAccountId)');
        onProgress({ step: 'security', status: 'skipped', message: 'Manual network configuration required' });
      }
      
      // Get node token for workers
      const tokenScript = 'sudo cat /var/lib/rancher/k3s/server/node-token';
      let nodeToken = await this.executeSSH(this.masterNode, masterCreds, tokenScript, onProgress);
      
      // IMPORTANT: Trim the token to remove trailing newline
      nodeToken = nodeToken.trim();
      
      console.log(`🔑 K3s node token retrieved: ${nodeToken.substring(0, 20)}...`);

      if (!nodeToken || nodeToken.includes('error') || nodeToken.includes('ERROR')) {
        throw new Error('Failed to retrieve K3s node token from master');
      }

      // Get kubeconfig
      const kubeconfigScript = 'sudo cat /etc/rancher/k3s/k3s.yaml';
      let kubeconfig = await this.executeSSH(this.masterNode, masterCreds, kubeconfigScript, onProgress);
      
      // Replace localhost with public IP for external kubectl access
      // Since we added public IP to TLS certificate, users can connect directly without certificate errors
      kubeconfig = kubeconfig.replace('https://127.0.0.1:6443', `https://${masterPublicIp}:6443`);

      // Update cluster with kubeconfig
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: {
          kubeconfig,
          apiEndpoint: `https://${masterPublicIp}:6443`,
          version: 'k3s-latest'
        }
      });

      // Create master node record
      await prisma.clusterNode.create({
        data: {
          clusterId: this.cluster.id,
          serverId: this.masterNode.id,
          nodeName: this.masterNode.name,
          role: 'master',
          status: 'ready',
          joinedAt: new Date()
        }
      });

      onProgress({ step: 'master', status: 'completed', message: 'Master node ready' });

      // Step 2: Join worker nodes
      if (this.workerNodes.length > 0) {
        onProgress({ step: 'workers', status: 'running', message: `Joining ${this.workerNodes.length} worker nodes...` });

        for (const worker of this.workerNodes) {
          const workerCreds = this.sshCredentials[worker.id];
          
          // Use private IP for internal cluster communication
          const masterPrivateIp = this.masterNode.privateIpAddress || this.masterNode.ipAddress;
          
          // Use single quotes around token to avoid shell interpretation issues
          const workerScript = `
            # Install K3s agent (worker)
            export K3S_URL="https://${masterPrivateIp}:6443"
            export K3S_TOKEN="${nodeToken}"
            curl -sfL https://get.k3s.io | sh -
          `;

          console.log(`🔗 Joining worker ${worker.name} to master ${masterPrivateIp}...`);
          await this.executeSSH(worker, workerCreds, workerScript, onProgress);

          // Create worker node record
          await prisma.clusterNode.create({
            data: {
              clusterId: this.cluster.id,
              serverId: worker.id,
              nodeName: worker.name,
              role: 'worker',
              status: 'ready',
              joinedAt: new Date()
            }
          });
          
          console.log(`✅ Worker ${worker.name} joined successfully`);
        }

        onProgress({ step: 'workers', status: 'completed', message: 'All workers joined' });
      }

      // Step 3: Verify cluster health
      onProgress({ step: 'verify', status: 'running', message: 'Verifying cluster health...' });
      
      const verifyScript = 'sudo /usr/local/bin/k3s kubectl get nodes';
      await this.executeSSH(this.masterNode, masterCreds, verifyScript, onProgress);

      // Determine connectivity mode
      const connectivityMode = (this.masterNode.cloudAccountId && this.masterNode.instanceId && securityRuleAdded) 
        ? 'auto' 
        : 'manual';

      // Update cluster status
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: {
          status: 'running',
          nodeCount: this.servers.length,
          connectivityMode,
          connectivityStatus: securityRuleAdded ? 'connected' : 'unknown'
        }
      });

      onProgress({ step: 'complete', status: 'completed', message: 'K3s cluster created successfully!' });

      return {
        success: true,
        kubeconfig,
        apiEndpoint: `https://${this.masterNode.ipAddress}:6443`,
        connectivityMode,
        securityConfigured: securityRuleAdded
      };

    } catch (error) {
      console.error('K3s cluster creation error:', error);
      
      // Update cluster status to error
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: { status: 'error' }
      });

      onProgress({ step: 'error', status: 'error', message: error.message });
      throw error;
    }
  }

  /**
   * Create a full Kubernetes cluster (using kubeadm)
   */
  async createKubernetesCluster(networkPlugin, onProgress) {
    try {
      onProgress({ step: 'init', status: 'running', message: 'Starting Kubernetes cluster creation...' });

      // Step 1: Install prerequisites on all nodes
      onProgress({ step: 'prerequisites', status: 'running', message: 'Installing prerequisites on all nodes...' });
      
      await Promise.all(this.servers.map(server => {
        const creds = this.sshCredentials[server.id];
        return this.installKubePrerequisites(server, creds, onProgress);
      }));

      onProgress({ step: 'prerequisites', status: 'completed', message: 'Prerequisites installed' });

      // Step 2: Initialize master node
      onProgress({ step: 'master', status: 'running', message: 'Initializing Kubernetes master...' });
      
      const masterCreds = this.sshCredentials[this.masterNode.id];
      const joinCommand = await this.initKubernetesMaster(this.masterNode, masterCreds, onProgress);

      // Get kubeconfig
      const kubeconfigScript = 'cat $HOME/.kube/config';
      let kubeconfig = await this.executeSSH(this.masterNode, masterCreds, kubeconfigScript, onProgress);
      
      // Replace internal IP with external IP
      kubeconfig = kubeconfig.replace(/server: https:\/\/[^:]+:6443/, `server: https://${this.masterNode.ipAddress}:6443`);

      // Update cluster with kubeconfig
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: {
          kubeconfig,
          apiEndpoint: `https://${this.masterNode.ipAddress}:6443`,
          version: 'v1.28.0' // TODO: Get actual version
        }
      });

      // Create master node record
      await prisma.clusterNode.create({
        data: {
          clusterId: this.cluster.id,
          serverId: this.masterNode.id,
          nodeName: this.masterNode.name,
          role: 'master',
          status: 'ready',
          joinedAt: new Date()
        }
      });

      onProgress({ step: 'master', status: 'completed', message: 'Master node initialized' });

      // Step 3: Install CNI plugin
      onProgress({ step: 'cni', status: 'running', message: `Installing ${networkPlugin} network plugin...` });
      
      await this.installCNI(this.masterNode, masterCreds, networkPlugin, onProgress);
      
      onProgress({ step: 'cni', status: 'completed', message: 'Network plugin installed' });

      // Step 4: Join worker nodes
      if (this.workerNodes.length > 0) {
        onProgress({ step: 'workers', status: 'running', message: `Joining ${this.workerNodes.length} worker nodes...` });

        for (const worker of this.workerNodes) {
          const workerCreds = this.sshCredentials[worker.id];
          await this.executeSSH(worker, workerCreds, `sudo ${joinCommand}`, onProgress);

          // Create worker node record
          await prisma.clusterNode.create({
            data: {
              clusterId: this.cluster.id,
              serverId: worker.id,
              nodeName: worker.name,
              role: 'worker',
              status: 'ready',
              joinedAt: new Date()
            }
          });
        }

        onProgress({ step: 'workers', status: 'completed', message: 'All workers joined' });
      }

      // Step 5: Verify cluster
      onProgress({ step: 'verify', status: 'running', message: 'Verifying cluster health...' });
      
      const verifyScript = 'kubectl get nodes';
      await this.executeSSH(this.masterNode, masterCreds, verifyScript, onProgress);

      // Update cluster status
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: {
          status: 'running',
          nodeCount: this.servers.length
        }
      });

      onProgress({ step: 'complete', status: 'completed', message: 'Kubernetes cluster created successfully!' });

      return {
        success: true,
        kubeconfig,
        apiEndpoint: `https://${this.masterNode.ipAddress}:6443`
      };

    } catch (error) {
      console.error('Kubernetes cluster creation error:', error);
      
      // Update cluster status to error
      await prisma.cluster.update({
        where: { id: this.cluster.id },
        data: { status: 'error' }
      });

      onProgress({ step: 'error', status: 'error', message: error.message });
      throw error;
    }
  }

  /**
   * Install Kubernetes prerequisites (Docker, kubeadm, kubelet, kubectl)
   */
  async installKubePrerequisites(server, creds, onProgress) {
    const script = `
      # Disable swap
      sudo swapoff -a
      sudo sed -i '/ swap / s/^/#/' /etc/fstab

      # Install Docker (if not already installed)
      if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker $USER
      fi

      # Install kubeadm, kubelet, kubectl
      sudo apt-get update
      sudo apt-get install -y apt-transport-https ca-certificates curl
      sudo mkdir -p /etc/apt/keyrings
      curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
      echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
      sudo apt-get update
      sudo apt-get install -y kubelet kubeadm kubectl
      sudo apt-mark hold kubelet kubeadm kubectl
    `;

    return await this.executeSSH(server, creds, script, onProgress);
  }

  /**
   * Initialize Kubernetes master node
   */
  async initKubernetesMaster(server, creds, onProgress) {
    const initScript = `
      sudo kubeadm init --pod-network-cidr=192.168.0.0/16
      
      # Configure kubectl for current user
      mkdir -p $HOME/.kube
      sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
      sudo chown $(id -u):$(id -g) $HOME/.kube/config
      
      # Get join command
      sudo kubeadm token create --print-join-command
    `;

    const output = await this.executeSSH(server, creds, initScript, onProgress);
    
    // Extract join command
    const joinCommand = output.split('\n').find(line => line.includes('kubeadm join'));
    return joinCommand;
  }

  /**
   * Install CNI plugin
   */
  async installCNI(server, creds, plugin, onProgress) {
    const cniScripts = {
      calico: 'kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml',
      flannel: 'kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml',
      cilium: 'kubectl create -f https://raw.githubusercontent.com/cilium/cilium/v1.14.0/install/kubernetes/quick-install.yaml'
    };

    const script = cniScripts[plugin] || cniScripts.calico;
    return await this.executeSSH(server, creds, script, onProgress);
  }

  /**
   * Execute SSH command
   */
  async executeSSH(server, credentials, command, onProgress) {
    const conn = new Client();

    console.log(`🔌 Attempting SSH to ${credentials.host}:${credentials.port} as ${credentials.username}`);
    console.log(`   Private key length: ${credentials.privateKey?.length || 0} bytes`);

    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log(`✅ SSH connected successfully to ${credentials.host}`);
        conn.exec(command, (err, stream) => {
          if (err) {
            console.error(`❌ SSH exec error:`, err);
            conn.end();
            return reject(err);
          }

          let output = '';

          stream.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (onProgress) {
              onProgress({ type: 'stdout', data: text });
            }
          });

          stream.stderr.on('data', (data) => {
            const text = data.toString();
            if (onProgress) {
              onProgress({ type: 'stderr', data: text });
            }
          });

          stream.on('close', (code) => {
            conn.end();
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(`Command failed with exit code ${code}`));
            }
          });
        });
      });

      conn.on('error', (err) => {
        console.error(`❌ SSH connection error to ${credentials.host}:${credentials.port}`);
        console.error(`   Level: ${err.level}`);
        console.error(`   Message: ${err.message}`);
        reject(err);
      });

      console.log(`🔑 Connecting with config:`, {
        host: credentials.host,
        port: credentials.port,
        username: credentials.username,
        hasPrivateKey: !!credentials.privateKey,
        privateKeyStart: credentials.privateKey?.substring(0, 50) + '...'
      });

      conn.connect(credentials);
    });
  }
}

/**
 * Helper function to start cluster creation
 */
export async function createCluster(clusterId, existingServers, provisionConfig, onProgress) {
  try {
    // Get cluster details
    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId }
    });

    if (!cluster) {
      throw new Error('Cluster not found');
    }

    let allServers = [];
    let sshCredentials = {};

    // Handle AWS provisioning if configured
    if (provisionConfig && provisionConfig.nodeCount > 0) {
      onProgress({ 
        step: 'provision', 
        status: 'running', 
        message: 'Provisioning AWS EC2 instances...' 
      });

      const provisioner = new CloudProvisionerService(provisionConfig.cloudAccountId);
      
      const { instances } = await provisioner.provisionInstances({
        nodeCount: provisionConfig.nodeCount,
        instanceType: provisionConfig.instanceType,
        region: provisionConfig.region,
        clusterName: cluster.name
      }, onProgress);

      // Create server records in database
      const provisionedServers = await provisioner.createServersFromInstances(
        instances,
        cluster.workspaceId,
        provisionConfig.cloudAccountId
      );

      allServers = [...provisionedServers];

      // Wait a bit for SSH to be ready on new instances
      onProgress({ 
        step: 'provision', 
        status: 'running', 
        message: 'Waiting for SSH to be ready on new instances...' 
      });
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      // Get SSH credentials for provisioned servers
      const cloudAccount = await prisma.cloudAccount.findUnique({
        where: { id: provisionConfig.cloudAccountId }
      });

      if (!cloudAccount.sshPrivateKey) {
        throw new Error('SSH credentials not configured for cloud account');
      }

      const privateKey = decryptSSHKey(cloudAccount.sshPrivateKey);
      for (const server of provisionedServers) {
        sshCredentials[server.id] = {
          host: server.ipAddress,
          port: cloudAccount.sshPort || 22,
          username: cloudAccount.sshUsername || 'ec2-user',
          privateKey
        };
      }
    }

    // Handle existing servers
    if (existingServers && existingServers.length > 0) {
      console.log(`📡 Getting SSH credentials for ${existingServers.length} existing servers...`);
      
      // Use new SSH resolver - automatically checks server-level then cloud account-level
      const sshCredentialsMap = await getMultipleServerSSHCredentials(existingServers, cluster.workspaceId);
      
      // Get server details
      const servers = await prisma.server.findMany({
        where: {
          id: { in: existingServers }
        }
      });

      allServers = [...allServers, ...servers];

      // Convert map to object for provisioner
      for (const [serverId, credentials] of sshCredentialsMap.entries()) {
        console.log(`  ✓ Server ${serverId}: SSH credentials from ${credentials.source}`);
        sshCredentials[serverId] = credentials;
      }
    }

    if (allServers.length === 0) {
      throw new Error('No servers available for cluster creation');
    }

    // Create provisioner
    const provisioner = new KubernetesProvisioner(cluster, allServers, sshCredentials);

    // Create cluster based on type
    if (cluster.type === 'k3s') {
      return await provisioner.createK3sCluster(onProgress);
    } else {
      return await provisioner.createKubernetesCluster(cluster.networkPlugin || 'calico', onProgress);
    }

  } catch (error) {
    console.error('Create cluster error:', error);
    throw error;
  }
}

