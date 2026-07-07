import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { 
  EC2Client, 
  DescribeSecurityGroupsCommand 
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
 * POST /api/cluster-validator/validate-hdfs-prerequisites
 * Validate all pre-requisites for HDFS cluster creation
 */
router.post('/validate-hdfs-prerequisites', authenticate, async (req, res) => {
  try {
    const { serverIds } = req.body;
    const workspaceId = req.user.workspaceId;

    if (!serverIds || !Array.isArray(serverIds) || serverIds.length < 3) {
      return res.json({
        success: true,
        data: {
          isReady: false,
          overall: {
            status: 'error',
            message: 'At least 3 servers required (1 master + 2 workers)'
          },
          checks: [],
          recommendations: [
            'Add at least 3 servers to create an HDFS cluster',
            'Minimum configuration: 1 master node + 2 worker nodes'
          ]
        }
      });
    }

    // Fetch all servers
    const servers = await prisma.server.findMany({
      where: {
        id: { in: serverIds },
        workspaceId
      },
      include: {
        cloudAccount: true
      }
    });

    if (servers.length !== serverIds.length) {
      return res.json({
        success: true,
        data: {
          isReady: false,
          overall: {
            status: 'error',
            message: 'Some selected servers were not found'
          },
          checks: [],
          recommendations: ['Refresh the page and try again']
        }
      });
    }

    const checks = [];
    const recommendations = [];
    let criticalIssues = 0;
    let warnings = 0;

    // Check 1: Minimum server count
    checks.push({
      category: 'Server Count',
      name: 'Minimum Servers',
      status: servers.length >= 3 ? 'success' : 'error',
      message: servers.length >= 3 
        ? `✓ ${servers.length} servers selected (minimum: 3)`
        : `✗ Only ${servers.length} servers (minimum: 3)`,
      details: servers.length >= 3 
        ? '1 master + 2 workers for proper replication'
        : 'HDFS requires at least 3 nodes for high availability'
    });

    if (servers.length < 3) criticalIssues++;

    // Check 2: All servers running
    const runningServers = servers.filter(s => s.status === 'running');
    checks.push({
      category: 'Server Status',
      name: 'All Servers Running',
      status: runningServers.length === servers.length ? 'success' : 'error',
      message: runningServers.length === servers.length
        ? `✓ All ${servers.length} servers are running`
        : `✗ Only ${runningServers.length}/${servers.length} servers running`,
      details: runningServers.length === servers.length
        ? 'All servers are ready for cluster creation'
        : `Stopped servers: ${servers.filter(s => s.status !== 'running').map(s => s.name).join(', ')}`
    });

    if (runningServers.length !== servers.length) {
      criticalIssues++;
      recommendations.push('Start all stopped servers before creating the cluster');
    }

    // Check 2.5: Operating System Compatibility
    const supportedOSPatterns = [
      /RHEL.*8/i, /RHEL.*9/i, 
      /Red Hat.*8/i, /Red Hat.*9/i,
      /Rocky.*8/i, /Rocky.*9/i,
      /Ubuntu.*20\.04/i, /Ubuntu.*22\.04/i
    ];
    
    const unsupportedServers = [];
    const warningServers = [];
    
    servers.forEach(server => {
      if (server.platform) {
        const isSupported = supportedOSPatterns.some(pattern => pattern.test(server.platform));
        const isRHEL10 = /RHEL.*10/i.test(server.platform) || /Red Hat.*10/i.test(server.platform);
        
        if (isRHEL10) {
          warningServers.push({ name: server.name, os: server.platform, reason: 'RHEL 10 not officially supported' });
        } else if (!isSupported && server.platform.toLowerCase() !== 'unknown') {
          unsupportedServers.push({ name: server.name, os: server.platform });
        }
      }
    });
    
    const osStatus = unsupportedServers.length > 0 ? 'error' : 
                     warningServers.length > 0 ? 'warning' : 'success';
    
    checks.push({
      category: 'Operating System',
      name: 'OS Compatibility',
      status: osStatus,
      message: osStatus === 'success'
        ? '✓ All servers running supported OS versions'
        : osStatus === 'warning'
        ? `⚠ ${warningServers.length} server(s) on unsupported OS (may work)`
        : `✗ ${unsupportedServers.length} server(s) on unsupported OS`,
      details: osStatus === 'success'
        ? 'ODP supports: RHEL 8/9, Rocky Linux 8/9, Ubuntu 20.04/22.04'
        : unsupportedServers.length > 0
        ? 'Unsupported: ' + unsupportedServers.map(s => s.name + ' (' + s.os + ')').join(', ')
        : 'RHEL 10 detected on: ' + warningServers.map(s => s.name).join(', ') + '. Official support: RHEL 8/9'
    });
    
    if (unsupportedServers.length > 0) {
      criticalIssues++;
      recommendations.push('Use RHEL 8/9, Rocky Linux 8/9, or Ubuntu 20.04/22.04 for best compatibility');
    } else if (warningServers.length > 0) {
      warnings++;
      recommendations.push('⚠ RHEL 10 detected: Not officially supported by ODP. Recommended: Use RHEL 9 or Rocky Linux 9');
    }

    // Check 3: Same VPC
    const vpcs = [...new Set(servers.map(s => s.vpcId).filter(Boolean))];
    checks.push({
      category: 'Network',
      name: 'Same VPC',
      status: vpcs.length === 1 ? 'success' : vpcs.length === 0 ? 'warning' : 'error',
      message: vpcs.length === 1 
        ? `✓ All servers in same VPC (${vpcs[0]})`
        : vpcs.length === 0
        ? '⚠ VPC information not available'
        : `✗ Servers in ${vpcs.length} different VPCs`,
      details: vpcs.length === 1
        ? 'Optimal network configuration'
        : vpcs.length === 0
        ? 'Sync servers to update VPC information'
        : 'All servers must be in the same VPC for cluster communication'
    });

    if (vpcs.length > 1) {
      criticalIssues++;
      recommendations.push('Move all servers to the same VPC');
    } else if (vpcs.length === 0) {
      warnings++;
      recommendations.push('Sync servers from AWS to update VPC information');
    }

    // Check 4: Same security group
    const securityGroups = [...new Set(servers.map(s => s.securityGroupId).filter(Boolean))];
    checks.push({
      category: 'Security',
      name: 'Same Security Group',
      status: securityGroups.length === 1 ? 'success' : securityGroups.length === 0 ? 'error' : 'warning',
      message: securityGroups.length === 1
        ? `✓ All servers in same security group (${securityGroups[0]})`
        : securityGroups.length === 0
        ? '✗ No security group information'
        : `⚠ Servers in ${securityGroups.length} different security groups`,
      details: securityGroups.length === 1
        ? 'Recommended configuration for easy cluster communication'
        : securityGroups.length === 0
        ? 'Security group ID not captured. Add servers with instance ID to capture it.'
        : 'Using same security group is highly recommended for HDFS clusters'
    });

    if (securityGroups.length === 0) {
      criticalIssues++;
      recommendations.push('Re-add servers using instance ID to capture security group information');
    } else if (securityGroups.length > 1) {
      warnings++;
      recommendations.push('Using same security group is recommended. Ensure manual security rules allow cluster communication.');
    }

    // Check 5: Security group rules (if same SG)
    if (securityGroups.length === 1 && servers[0].cloudAccount) {
      try {
        const ec2Client = await getEC2Client(servers[0].cloudAccountId);
        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroups[0]]
        });
        const sgResponse = await ec2Client.send(sgCommand);
        const sg = sgResponse.SecurityGroups[0];

        // Check for self-referencing rule
        const hasSelfRef = sg.IpPermissions.some(rule => 
          rule.IpProtocol === '-1' && 
          rule.UserIdGroupPairs.some(pair => pair.GroupId === securityGroups[0])
        );

        checks.push({
          category: 'Security',
          name: 'Self-Referencing Rule',
          status: hasSelfRef ? 'success' : 'warning',
          message: hasSelfRef
            ? '✓ Self-referencing rule configured (all traffic)'
            : '⚠ No self-referencing rule found',
          details: hasSelfRef
            ? 'Cluster nodes can communicate on all ports'
            : 'Self-referencing rule allows internal cluster communication'
        });

        if (!hasSelfRef) {
          warnings++;
          recommendations.push('Use "Auto-Setup Security Groups" button to configure HDFS rules');
        }

        // Check for CloudEvy access (Ambari UI)
        const hasAmbariAccess = sg.IpPermissions.some(rule => 
          rule.IpProtocol === 'tcp' && 
          rule.FromPort === 8080 &&
          rule.ToPort === 8080
        );

        checks.push({
          category: 'Security',
          name: 'Ambari UI Access',
          status: hasAmbariAccess ? 'success' : 'warning',
          message: hasAmbariAccess
            ? '✓ Ambari UI accessible (port 8080)'
            : '⚠ Ambari UI not accessible',
          details: hasAmbariAccess
            ? 'CloudEvy can monitor cluster via Ambari'
            : 'CloudEvy needs access to Ambari for monitoring'
        });

        if (!hasAmbariAccess) {
          warnings++;
        }

      } catch (error) {
        console.error('Failed to check security group rules:', error);
        checks.push({
          category: 'Security',
          name: 'Security Group Rules',
          status: 'warning',
          message: '⚠ Could not verify security group rules',
          details: 'Failed to fetch security group details from AWS'
        });
        warnings++;
      }
    }

    // Check 6: SSH access
    // Check if SSH is configured (either at server level or cloud account level)
    const hasSSH = servers.every(s => {
      // Server has its own SSH key OR cloud account has SSH key
      return s.sshPrivateKey || (s.cloudAccount && s.cloudAccount.sshPrivateKey);
    });
    
    checks.push({
      category: 'SSH',
      name: 'SSH Keys Configured',
      status: hasSSH ? 'success' : 'error',
      message: hasSSH
        ? '✓ All servers have SSH keys configured'
        : '✗ Some servers missing SSH keys',
      details: hasSSH
        ? 'CloudEvy can access all servers for installation'
        : 'SSH keys are required for cluster installation. Configure SSH at server or cloud account level.'
    });

    if (!hasSSH) {
      criticalIssues++;
      recommendations.push('Configure SSH keys for all servers or their cloud accounts');
    }

    // Check 7: Resource adequacy
    const tinyServers = servers.filter(s => 
      s.instanceType && (s.instanceType.includes('nano') || s.instanceType.includes('micro'))
    );
    
    if (tinyServers.length > 0) {
      checks.push({
        category: 'Resources',
        name: 'Adequate Instance Size',
        status: 'warning',
        message: `⚠ ${tinyServers.length} server(s) with very small instance type`,
        details: `Servers: ${tinyServers.map(s => `${s.name} (${s.instanceType})`).join(', ')}. Recommended: t3.small or larger`
      });
      warnings++;
      recommendations.push('Use t3.small or larger instances for better performance');
    } else {
      checks.push({
        category: 'Resources',
        name: 'Adequate Instance Size',
        status: 'success',
        message: '✓ All servers have adequate instance sizes',
        details: 'Instance types are suitable for HDFS cluster'
      });
    }

    // Determine overall status
    let overallStatus = 'success';
    let overallMessage = '✅ All pre-requisites met! Ready to create HDFS cluster.';

    if (criticalIssues > 0) {
      overallStatus = 'error';
      overallMessage = `❌ ${criticalIssues} critical issue(s) must be fixed before creating cluster`;
    } else if (warnings > 0) {
      overallStatus = 'warning';
      overallMessage = `⚠️ ${warnings} warning(s) detected. Cluster can be created but may need manual configuration.`;
    }

    res.json({
      success: true,
      data: {
        isReady: criticalIssues === 0,
        overall: {
          status: overallStatus,
          message: overallMessage,
          criticalIssues,
          warnings
        },
        checks,
        recommendations: recommendations.length > 0 ? recommendations : ['Everything looks good! Proceed with cluster creation.'],
        serversSummary: {
          total: servers.length,
          running: runningServers.length,
          stopped: servers.length - runningServers.length,
          vpcs: vpcs.length,
          securityGroups: securityGroups.length
        }
      }
    });

  } catch (error) {
    console.error('Failed to validate HDFS prerequisites:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate prerequisites'
    });
  }
});

export default router;
