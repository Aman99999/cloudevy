import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { 
  EC2Client, 
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand 
} from '@aws-sdk/client-ec2';
import { decryptCredentials } from './cloudAccounts.js';

const router = express.Router();

/**
 * Helper: Get EC2 client for a cloud account
 */
async function getEC2Client(cloudAccountId) {
  const cloudAccount = await prisma.cloudAccount.findUnique({
    where: { id: cloudAccountId }
  });

  if (!cloudAccount) {
    throw new Error('Cloud account not found');
  }

  const decryptedCreds = JSON.parse(decryptCredentials(cloudAccount.credentials));

  return new EC2Client({
    region: cloudAccount.region,
    credentials: {
      accessKeyId: decryptedCreds.accessKey,
      secretAccessKey: decryptedCreds.secretKey
    }
  });
}

/**
 * Helper: Get CloudEvy server's public IP
 */
async function getCloudEvyIP() {
  try {
    // Try AWS instance metadata first
    const awsMetadataIp = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4', { timeout: 1000 })
      .then(res => res.text())
      .catch(() => null);
    
    if (awsMetadataIp && !awsMetadataIp.startsWith('<?')) {
      return awsMetadataIp;
    }

    // Fallback to external service
    const response = await fetch('https://api.ipify.org?format=json', { timeout: 2000 });
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get CloudEvy server IP:', error);
    return null;
  }
}

/**
 * GET /api/security-groups/:serverId
 * Get security group details for a server
 */
router.get('/:serverId', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    // Get server with cloud account
    const server = await prisma.server.findFirst({
      where: { 
        id: serverId,
        workspaceId
      },
      include: {
        cloudAccount: true
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    if (!server.securityGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Server does not have a security group ID configured'
      });
    }

    // Get EC2 client
    const ec2Client = await getEC2Client(server.cloudAccountId);

    // Describe security group
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [server.securityGroupId]
    });

    const response = await ec2Client.send(command);
    const securityGroup = response.SecurityGroups[0];

    // Format inbound rules
    const inboundRules = securityGroup.IpPermissions.map((rule, index) => {
      const sources = [
        ...rule.IpRanges.map(ip => ({ type: 'cidr', value: ip.CidrIp, description: ip.Description })),
        ...rule.UserIdGroupPairs.map(sg => ({ type: 'sg', value: sg.GroupId, description: sg.Description })),
        ...rule.Ipv6Ranges.map(ip => ({ type: 'cidr', value: ip.CidrIpv6, description: ip.Description }))
      ];

      return {
        id: `inbound-${index}`,
        protocol: rule.IpProtocol === '-1' ? 'All' : rule.IpProtocol.toUpperCase(),
        fromPort: rule.FromPort || 'All',
        toPort: rule.ToPort || 'All',
        sources,
        rawRule: rule // Keep original for deletion
      };
    });

    // Format outbound rules
    const outboundRules = securityGroup.IpPermissionsEgress.map((rule, index) => {
      const destinations = [
        ...rule.IpRanges.map(ip => ({ type: 'cidr', value: ip.CidrIp, description: ip.Description })),
        ...rule.UserIdGroupPairs.map(sg => ({ type: 'sg', value: sg.GroupId, description: sg.Description })),
        ...rule.Ipv6Ranges.map(ip => ({ type: 'cidr', value: ip.CidrIpv6, description: ip.Description }))
      ];

      return {
        id: `outbound-${index}`,
        protocol: rule.IpProtocol === '-1' ? 'All' : rule.IpProtocol.toUpperCase(),
        fromPort: rule.FromPort || 'All',
        toPort: rule.ToPort || 'All',
        destinations,
        rawRule: rule
      };
    });

    res.json({
      success: true,
      data: {
        groupId: securityGroup.GroupId,
        groupName: securityGroup.GroupName,
        description: securityGroup.Description,
        vpcId: securityGroup.VpcId,
        inboundRules,
        outboundRules
      }
    });

  } catch (error) {
    console.error('Failed to get security group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch security group details'
    });
  }
});

/**
 * POST /api/security-groups/:serverId/inbound
 * Add an inbound rule to server's security group
 */
router.post('/:serverId/inbound', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const { protocol, fromPort, toPort, source, description } = req.body;

    // Validate input
    if (!protocol || !source) {
      return res.status(400).json({
        success: false,
        message: 'Protocol and source are required'
      });
    }

    // Get server
    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server || !server.securityGroupId) {
      return res.status(404).json({
        success: false,
        message: 'Server or security group not found'
      });
    }

    // Get EC2 client
    const ec2Client = await getEC2Client(server.cloudAccountId);

    // Build IP permission
    const ipPermission = {
      IpProtocol: protocol === 'all' ? '-1' : protocol,
    };

    // Add ports if not "all"
    if (protocol !== 'all' && fromPort) {
      ipPermission.FromPort = parseInt(fromPort);
      ipPermission.ToPort = parseInt(toPort || fromPort);
    }

    // Add source
    if (source.startsWith('sg-')) {
      ipPermission.UserIdGroupPairs = [{
        GroupId: source,
        Description: description || 'Added by CloudEvy'
      }];
    } else {
      ipPermission.IpRanges = [{
        CidrIp: source,
        Description: description || 'Added by CloudEvy'
      }];
    }

    // Authorize ingress
    const command = new AuthorizeSecurityGroupIngressCommand({
      GroupId: server.securityGroupId,
      IpPermissions: [ipPermission]
    });

    await ec2Client.send(command);

    res.json({
      success: true,
      message: 'Inbound rule added successfully'
    });

  } catch (error) {
    console.error('Failed to add inbound rule:', error);
    
    // Handle duplicate rule
    if (error.name === 'InvalidPermission.Duplicate') {
      return res.status(400).json({
        success: false,
        message: 'This rule already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add inbound rule'
    });
  }
});

/**
 * DELETE /api/security-groups/:serverId/inbound
 * Remove an inbound rule from server's security group
 */
router.delete('/:serverId/inbound', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const { protocol, fromPort, toPort, source } = req.body;

    // Get server
    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server || !server.securityGroupId) {
      return res.status(404).json({
        success: false,
        message: 'Server or security group not found'
      });
    }

    // Get EC2 client
    const ec2Client = await getEC2Client(server.cloudAccountId);

    // Build IP permission
    const ipPermission = {
      IpProtocol: protocol === 'All' ? '-1' : protocol.toLowerCase(),
    };

    // Add ports if not "all"
    if (protocol !== 'All' && fromPort !== 'All') {
      ipPermission.FromPort = parseInt(fromPort);
      ipPermission.ToPort = parseInt(toPort);
    }

    // Add source
    if (source.startsWith('sg-')) {
      ipPermission.UserIdGroupPairs = [{ GroupId: source }];
    } else {
      ipPermission.IpRanges = [{ CidrIp: source }];
    }

    // Revoke ingress
    const command = new RevokeSecurityGroupIngressCommand({
      GroupId: server.securityGroupId,
      IpPermissions: [ipPermission]
    });

    await ec2Client.send(command);

    res.json({
      success: true,
      message: 'Inbound rule removed successfully'
    });

  } catch (error) {
    console.error('Failed to remove inbound rule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove inbound rule'
    });
  }
});

/**
 * POST /api/security-groups/:serverId/quick-actions/k3s
 * Add all required rules for K3s cluster
 */
router.post('/:serverId/quick-actions/k3s', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server || !server.securityGroupId) {
      return res.status(404).json({
        success: false,
        message: 'Server or security group not found'
      });
    }

    const ec2Client = await getEC2Client(server.cloudAccountId);
    const rulesAdded = [];
    const errors = [];

    // Rule 1: Self-referencing (all traffic for internal cluster communication)
    try {
      await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: server.securityGroupId,
        IpPermissions: [{
          IpProtocol: '-1',
          UserIdGroupPairs: [{
            GroupId: server.securityGroupId,
            Description: 'Internal K3s cluster communication'
          }]
        }]
      }));
      rulesAdded.push('Self-referencing rule (all traffic)');
    } catch (error) {
      if (error.name !== 'InvalidPermission.Duplicate') {
        errors.push(`Self-referencing rule: ${error.message}`);
      } else {
        rulesAdded.push('Self-referencing rule (already exists)');
      }
    }

    // Rule 2: CloudEvy monitoring (port 6443)
    const cloudEvyIP = await getCloudEvyIP();
    if (cloudEvyIP) {
      try {
        await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
          GroupId: server.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 6443,
            ToPort: 6443,
            IpRanges: [{
              CidrIp: `${cloudEvyIP}/32`,
              Description: 'CloudEvy metrics and management access'
            }]
          }]
        }));
        rulesAdded.push(`CloudEvy monitoring (${cloudEvyIP}/32 → port 6443)`);
      } catch (error) {
        if (error.name !== 'InvalidPermission.Duplicate') {
          errors.push(`CloudEvy monitoring rule: ${error.message}`);
        } else {
          rulesAdded.push('CloudEvy monitoring rule (already exists)');
        }
      }
    }

    res.json({
      success: true,
      message: 'K3s security group configuration completed',
      rulesAdded,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Failed to configure K3s security group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to configure security group'
    });
  }
});

/**
 * POST /api/security-groups/:serverId/quick-actions/hdfs
 * Add all required rules for HDFS/Hadoop cluster
 */
router.post('/:serverId/quick-actions/hdfs', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;

    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server || !server.securityGroupId) {
      return res.status(404).json({
        success: false,
        message: 'Server or security group not found'
      });
    }

    const ec2Client = await getEC2Client(server.cloudAccountId);
    const rulesAdded = [];
    const errors = [];

    // Rule 1: Self-referencing (all traffic for internal cluster communication)
    try {
      await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: server.securityGroupId,
        IpPermissions: [{
          IpProtocol: '-1',
          UserIdGroupPairs: [{
            GroupId: server.securityGroupId,
            Description: 'Internal HDFS cluster communication'
          }]
        }]
      }));
      rulesAdded.push('Self-referencing rule (all traffic)');
    } catch (error) {
      if (error.name !== 'InvalidPermission.Duplicate') {
        errors.push(`Self-referencing rule: ${error.message}`);
      } else {
        rulesAdded.push('Self-referencing rule (already exists)');
      }
    }

    // Rule 2: Ambari UI (port 8080)
    const cloudEvyIP = await getCloudEvyIP();
    if (cloudEvyIP) {
      try {
        await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
          GroupId: server.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 8080,
            ToPort: 8080,
            IpRanges: [{
              CidrIp: `${cloudEvyIP}/32`,
              Description: 'CloudEvy access to Ambari UI'
            }]
          }]
        }));
        rulesAdded.push(`Ambari UI (${cloudEvyIP}/32 → port 8080)`);
      } catch (error) {
        if (error.name !== 'InvalidPermission.Duplicate') {
          errors.push(`Ambari UI rule: ${error.message}`);
        } else {
          rulesAdded.push('Ambari UI rule (already exists)');
        }
      }
    }

    // Rule 3: HDFS NameNode UI (port 50070)
    if (cloudEvyIP) {
      try {
        await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
          GroupId: server.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 50070,
            ToPort: 50070,
            IpRanges: [{
              CidrIp: `${cloudEvyIP}/32`,
              Description: 'CloudEvy access to HDFS NameNode UI'
            }]
          }]
        }));
        rulesAdded.push(`HDFS NameNode UI (${cloudEvyIP}/32 → port 50070)`);
      } catch (error) {
        if (error.name !== 'InvalidPermission.Duplicate') {
          errors.push(`NameNode UI rule: ${error.message}`);
        } else {
          rulesAdded.push('NameNode UI rule (already exists)');
        }
      }
    }

    // Rule 4: YARN ResourceManager UI (port 8088)
    if (cloudEvyIP) {
      try {
        await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
          GroupId: server.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 8088,
            ToPort: 8088,
            IpRanges: [{
              CidrIp: `${cloudEvyIP}/32`,
              Description: 'CloudEvy access to YARN ResourceManager UI'
            }]
          }]
        }));
        rulesAdded.push(`YARN ResourceManager UI (${cloudEvyIP}/32 → port 8088)`);
      } catch (error) {
        if (error.name !== 'InvalidPermission.Duplicate') {
          errors.push(`YARN UI rule: ${error.message}`);
        } else {
          rulesAdded.push('YARN UI rule (already exists)');
        }
      }
    }

    res.json({
      success: true,
      message: 'HDFS security group configuration completed',
      rulesAdded,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Failed to configure HDFS security group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to configure security group'
    });
  }
});

/**
 * POST /api/security-groups/:serverId/quick-actions/my-ip
 * Add rule allowing user's current IP on port 6443 (for kubectl)
 */
router.post('/:serverId/quick-actions/my-ip', authenticate, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const workspaceId = req.user.workspaceId;
    const { userIp } = req.body;

    if (!userIp) {
      return res.status(400).json({
        success: false,
        message: 'User IP is required'
      });
    }

    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server || !server.securityGroupId) {
      return res.status(404).json({
        success: false,
        message: 'Server or security group not found'
      });
    }

    const ec2Client = await getEC2Client(server.cloudAccountId);

    await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: server.securityGroupId,
      IpPermissions: [{
        IpProtocol: 'tcp',
        FromPort: 6443,
        ToPort: 6443,
        IpRanges: [{
          CidrIp: `${userIp}/32`,
          Description: 'Developer kubectl access'
        }]
      }]
    }));

    res.json({
      success: true,
      message: `Rule added: ${userIp}/32 → port 6443`
    });

  } catch (error) {
    console.error('Failed to add My IP rule:', error);
    
    if (error.name === 'InvalidPermission.Duplicate') {
      return res.json({
        success: true,
        message: 'This rule already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add rule'
    });
  }
});

/**
 * POST /api/security-groups/quick-actions/hdfs-cluster
 * Apply HDFS rules to multiple servers (entire cluster)
 */
router.post('/quick-actions/hdfs-cluster', authenticate, async (req, res) => {
  try {
    const { serverIds } = req.body;
    const workspaceId = req.user.workspaceId;

    if (!serverIds || !Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'serverIds array is required'
      });
    }

    const results = [];
    let totalRulesAdded = 0;
    let totalErrors = 0;

    // Process each server
    for (const serverId of serverIds) {
      try {
        const server = await prisma.server.findFirst({
          where: { 
            id: parseInt(serverId), 
            workspaceId 
          }
        });

        if (!server || !server.securityGroupId) {
          results.push({
            serverId,
            serverName: server?.name || 'Unknown',
            success: false,
            message: 'Server or security group not found'
          });
          totalErrors++;
          continue;
        }

        const ec2Client = await getEC2Client(server.cloudAccountId);
        const rulesAdded = [];
        const errors = [];

        // Rule 1: Self-referencing (all traffic)
        try {
          await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
            GroupId: server.securityGroupId,
            IpPermissions: [{
              IpProtocol: '-1',
              UserIdGroupPairs: [{
                GroupId: server.securityGroupId,
                Description: 'Internal HDFS cluster communication'
              }]
            }]
          }));
          rulesAdded.push('Self-referencing');
        } catch (error) {
          if (error.name !== 'InvalidPermission.Duplicate') {
            errors.push('Self-referencing');
          } else {
            rulesAdded.push('Self-referencing (exists)');
          }
        }

        // Rule 2: Ambari UI (8080)
        const cloudEvyIP = await getCloudEvyIP();
        if (cloudEvyIP) {
          try {
            await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
              GroupId: server.securityGroupId,
              IpPermissions: [{
                IpProtocol: 'tcp',
                FromPort: 8080,
                ToPort: 8080,
                IpRanges: [{
                  CidrIp: `${cloudEvyIP}/32`,
                  Description: 'CloudEvy - Ambari UI'
                }]
              }]
            }));
            rulesAdded.push('Ambari UI (8080)');
          } catch (error) {
            if (error.name !== 'InvalidPermission.Duplicate') {
              errors.push('Ambari UI');
            } else {
              rulesAdded.push('Ambari UI (exists)');
            }
          }

          // Rule 3: HDFS NameNode UI (50070)
          try {
            await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
              GroupId: server.securityGroupId,
              IpPermissions: [{
                IpProtocol: 'tcp',
                FromPort: 50070,
                ToPort: 50070,
                IpRanges: [{
                  CidrIp: `${cloudEvyIP}/32`,
                  Description: 'CloudEvy - HDFS NameNode UI'
                }]
              }]
            }));
            rulesAdded.push('NameNode UI (50070)');
          } catch (error) {
            if (error.name !== 'InvalidPermission.Duplicate') {
              errors.push('NameNode UI');
            } else {
              rulesAdded.push('NameNode UI (exists)');
            }
          }

          // Rule 4: YARN ResourceManager UI (8088)
          try {
            await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
              GroupId: server.securityGroupId,
              IpPermissions: [{
                IpProtocol: 'tcp',
                FromPort: 8088,
                ToPort: 8088,
                IpRanges: [{
                  CidrIp: `${cloudEvyIP}/32`,
                  Description: 'CloudEvy - YARN ResourceManager UI'
                }]
              }]
            }));
            rulesAdded.push('YARN UI (8088)');
          } catch (error) {
            if (error.name !== 'InvalidPermission.Duplicate') {
              errors.push('YARN UI');
            } else {
              rulesAdded.push('YARN UI (exists)');
            }
          }
        }

        totalRulesAdded += rulesAdded.length;
        totalErrors += errors.length;

        results.push({
          serverId,
          serverName: server.name,
          success: true,
          rulesAdded,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (error) {
        console.error(`Failed to configure server ${serverId}:`, error);
        results.push({
          serverId,
          success: false,
          message: error.message
        });
        totalErrors++;
      }
    }

    res.json({
      success: true,
      message: `Configured ${serverIds.length} servers`,
      summary: {
        totalServers: serverIds.length,
        totalRulesAdded,
        totalErrors
      },
      results
    });

  } catch (error) {
    console.error('Failed to configure HDFS cluster security groups:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to configure cluster security groups'
    });
  }
});

/**
 * GET /api/security-groups/info/cloudevy-ip
 * Get CloudEvy server's public IP
 */
router.get('/info/cloudevy-ip', authenticate, async (req, res) => {
  try {
    const cloudEvyIP = await getCloudEvyIP();
    
    if (!cloudEvyIP) {
      return res.status(500).json({
        success: false,
        message: 'Could not determine CloudEvy server IP'
      });
    }

    res.json({
      success: true,
      data: { ip: cloudEvyIP }
    });

  } catch (error) {
    console.error('Failed to get CloudEvy IP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get CloudEvy IP'
    });
  }
});

export default router;

