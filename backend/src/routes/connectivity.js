import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execPromise = promisify(exec);

// All routes require authentication
router.use(authenticate);

// Get CloudEvy server IP (cached)
let cachedCloudEvyIP = null;

async function getCloudEvyServerIP() {
  if (cachedCloudEvyIP) {
    return cachedCloudEvyIP;
  }

  try {
    // Try AWS metadata first
    const response = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4', {
      timeout: 2000
    });
    if (response.ok) {
      cachedCloudEvyIP = await response.text();
      return cachedCloudEvyIP;
    }
  } catch (error) {
    // Fallback to external service
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      timeout: 5000
    });
    const data = await response.json();
    cachedCloudEvyIP = data.ip;
    return cachedCloudEvyIP;
  } catch (error) {
    console.error('Failed to get CloudEvy IP:', error);
    return null;
  }
}

/**
 * GET /api/connectivity/info
 * Get CloudEvy connectivity information
 */
router.get('/info', async (req, res) => {
  try {
    const cloudEvyIP = await getCloudEvyServerIP();
    
    res.json({
      success: true,
      data: {
        cloudEvyIP,
        requiredPort: 6443,
        protocol: 'TCP'
      }
    });
  } catch (error) {
    console.error('Get connectivity info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connectivity information'
    });
  }
});

/**
 * POST /api/connectivity/test/:clusterId
 * Test connectivity to a cluster
 */
router.post('/test/:clusterId', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.clusterId);
    const workspaceId = req.user.workspaceId;

    // Get cluster with master node info
    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: {
          where: { role: 'master' },
          include: {
            server: true
          }
        }
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'Cluster not found'
      });
    }

    const masterNode = cluster.nodes.find(n => n.role === 'master');
    if (!masterNode || !masterNode.server) {
      return res.status(400).json({
        success: false,
        message: 'Master node not found'
      });
    }

    const masterIP = masterNode.server.ipAddress;
    
    // Test connectivity using curl
    try {
      await execPromise(
        `curl -k --max-time 5 --connect-timeout 5 https://${masterIP}:6443/`,
        { timeout: 10000 }
      );
      
      // Success!
      await prisma.cluster.update({
        where: { id: clusterId },
        data: {
          connectivityStatus: 'connected',
          lastConnectivityCheck: new Date(),
          connectivityError: null
        }
      });

      res.json({
        success: true,
        message: 'Connectivity test successful',
        status: 'connected'
      });

    } catch (error) {
      // Failed
      const errorMessage = error.message || 'Connection timeout';
      
      await prisma.cluster.update({
        where: { id: clusterId },
        data: {
          connectivityStatus: 'unreachable',
          lastConnectivityCheck: new Date(),
          connectivityError: errorMessage
        }
      });

      res.json({
        success: false,
        message: 'Cannot reach cluster on port 6443',
        status: 'unreachable',
        error: errorMessage,
        masterIP
      });
    }

  } catch (error) {
    console.error('Test connectivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connectivity'
    });
  }
});

/**
 * GET /api/connectivity/instructions/:clusterId
 * Get setup instructions for a cluster
 */
router.get('/instructions/:clusterId', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.clusterId);
    const workspaceId = req.user.workspaceId;
    const platform = req.query.platform || 'aws'; // aws, azure, gcp, generic

    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: {
          where: { role: 'master' },
          include: {
            server: true
          }
        }
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'Cluster not found'
      });
    }

    const masterNode = cluster.nodes.find(n => n.role === 'master');
    const masterIP = masterNode?.server?.ipAddress || 'MASTER_IP';
    const cloudEvyIP = await getCloudEvyServerIP();

    // Generate platform-specific instructions
    const instructions = generateInstructions(platform, masterIP, cloudEvyIP);

    res.json({
      success: true,
      data: {
        platform,
        masterIP,
        cloudEvyIP,
        requiredPort: 6443,
        instructions
      }
    });

  } catch (error) {
    console.error('Get instructions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setup instructions'
    });
  }
});

function generateInstructions(platform, masterIP, cloudEvyIP) {
  const instructions = {
    aws: {
      title: 'AWS Security Group Setup',
      steps: [
        {
          number: 1,
          title: 'Open AWS Console',
          description: 'Go to AWS Console → EC2 → Instances',
          link: 'https://console.aws.amazon.com/ec2/v2/home#Instances'
        },
        {
          number: 2,
          title: 'Find Your Master Instance',
          description: `Look for the instance with IP: ${masterIP}`,
          command: null
        },
        {
          number: 3,
          title: 'Open Security Group',
          description: 'Click on the instance → Security tab → Click the security group link',
          command: null
        },
        {
          number: 4,
          title: 'Edit Inbound Rules',
          description: 'Click "Edit inbound rules" button',
          command: null
        },
        {
          number: 5,
          title: 'Add Rule',
          description: 'Click "Add rule" and enter:',
          rule: {
            type: 'Custom TCP',
            port: 6443,
            source: `${cloudEvyIP}/32`,
            description: 'CloudEvy monitoring access'
          }
        },
        {
          number: 6,
          title: 'Save Rules',
          description: 'Click "Save rules" button',
          command: null
        }
      ],
      awsCLI: `aws ec2 authorize-security-group-ingress \\
  --group-id YOUR_SECURITY_GROUP_ID \\
  --protocol tcp \\
  --port 6443 \\
  --cidr ${cloudEvyIP}/32 \\
  --description "CloudEvy monitoring access"`,
      terraform: `resource "aws_security_group_rule" "cloudevy_access" {
  type              = "ingress"
  from_port         = 6443
  to_port           = 6443
  protocol          = "tcp"
  cidr_blocks       = ["${cloudEvyIP}/32"]
  description       = "CloudEvy monitoring access"
  security_group_id = "YOUR_SECURITY_GROUP_ID"
}`,
      requiredIAMPolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeSecurityGroups',
              'ec2:AuthorizeSecurityGroupIngress'
            ],
            Resource: '*'
          }
        ]
      }
    },
    azure: {
      title: 'Azure Network Security Group Setup',
      steps: [
        {
          number: 1,
          title: 'Open Azure Portal',
          description: 'Go to Azure Portal → Virtual Machines',
          link: 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Compute%2FVirtualMachines'
        },
        {
          number: 2,
          title: 'Find Your Master VM',
          description: `Look for the VM with IP: ${masterIP}`,
          command: null
        },
        {
          number: 3,
          title: 'Open Network Security Group',
          description: 'Click on the VM → Networking → Network Security Group',
          command: null
        },
        {
          number: 4,
          title: 'Add Inbound Rule',
          description: 'Click "Add inbound port rule"',
          rule: {
            source: 'IP Addresses',
            sourceIP: cloudEvyIP,
            destinationPort: 6443,
            protocol: 'TCP',
            name: 'CloudEvy-Access'
          }
        }
      ],
      azureCLI: `az network nsg rule create \\
  --resource-group YOUR_RESOURCE_GROUP \\
  --nsg-name YOUR_NSG_NAME \\
  --name CloudEvy-Access \\
  --priority 1000 \\
  --source-address-prefixes ${cloudEvyIP}/32 \\
  --destination-port-ranges 6443 \\
  --protocol Tcp \\
  --description "CloudEvy monitoring access"`
    },
    gcp: {
      title: 'GCP Firewall Rules Setup',
      steps: [
        {
          number: 1,
          title: 'Open GCP Console',
          description: 'Go to GCP Console → VPC Network → Firewall',
          link: 'https://console.cloud.google.com/networking/firewalls/list'
        },
        {
          number: 2,
          title: 'Create Firewall Rule',
          description: 'Click "Create Firewall Rule"',
          rule: {
            name: 'cloudevy-access',
            targets: 'Specified target tags',
            targetTags: 'k3s-master',
            sourceIPRanges: cloudEvyIP,
            protocols: 'tcp:6443'
          }
        }
      ],
      gcloudCLI: `gcloud compute firewall-rules create cloudevy-access \\
  --direction=INGRESS \\
  --action=ALLOW \\
  --rules=tcp:6443 \\
  --source-ranges=${cloudEvyIP}/32 \\
  --target-tags=k3s-master \\
  --description="CloudEvy monitoring access"`
    },
    generic: {
      title: 'Firewall Configuration',
      steps: [
        {
          number: 1,
          title: 'Open Firewall Settings',
          description: 'Access your firewall or security configuration',
          command: null
        },
        {
          number: 2,
          title: 'Allow Inbound Traffic',
          description: 'Add rule to allow:',
          rule: {
            protocol: 'TCP',
            port: 6443,
            source: `${cloudEvyIP}/32`,
            destination: masterIP
          }
        }
      ],
      iptables: `# On your master node, run:
sudo iptables -A INPUT -p tcp -s ${cloudEvyIP} --dport 6443 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4`,
      ufw: `# On your master node with UFW:
sudo ufw allow from ${cloudEvyIP} to any port 6443 proto tcp`
    }
  };

  return instructions[platform] || instructions.generic;
}

export default router;

