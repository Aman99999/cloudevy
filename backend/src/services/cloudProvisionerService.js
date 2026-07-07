import { 
  EC2Client, 
  RunInstancesCommand, 
  DescribeInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  CreateKeyPairCommand,
  TerminateInstancesCommand
} from '@aws-sdk/client-ec2';
import prisma from '../config/prisma.js';
import { decryptCredentials } from '../routes/cloudAccounts.js';
import crypto from 'crypto';

export class CloudProvisionerService {
  constructor(cloudAccountId) {
    this.cloudAccountId = cloudAccountId;
    this.client = null;
  }

  /**
   * Initialize AWS EC2 client
   */
  async initialize() {
    const cloudAccount = await prisma.cloudAccount.findUnique({
      where: { id: this.cloudAccountId }
    });

    if (!cloudAccount) {
      throw new Error('Cloud account not found');
    }

    const credentials = JSON.parse(decryptCredentials(cloudAccount.credentials));

    this.client = new EC2Client({
      region: cloudAccount.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey
      }
    });

    this.region = cloudAccount.region || 'us-east-1';
  }

  /**
   * Provision EC2 instances for Kubernetes cluster
   */
  async provisionInstances(config, onProgress) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const { nodeCount, instanceType, clusterName } = config;

      onProgress({ 
        step: 'provision-init', 
        status: 'running', 
        message: `Provisioning ${nodeCount} EC2 instances...` 
      });

      // Step 1: Get default VPC and subnet
      onProgress({ 
        step: 'vpc', 
        status: 'running', 
        message: 'Finding VPC and subnet...' 
      });

      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'isDefault', Values: ['true'] }]
      });
      const vpcResponse = await this.client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs[0]?.VpcId;

      if (!vpcId) {
        throw new Error('No default VPC found. Please create a VPC first.');
      }

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const subnetResponse = await this.client.send(subnetCommand);
      const subnetId = subnetResponse.Subnets[0]?.SubnetId;

      // Step 2: Create security group
      onProgress({ 
        step: 'security-group', 
        status: 'running', 
        message: 'Creating security group...' 
      });

      const sgName = `cloudevy-k8s-${clusterName}-${Date.now()}`;
      const sgCommand = new CreateSecurityGroupCommand({
        GroupName: sgName,
        Description: `Security group for CloudEvy Kubernetes cluster: ${clusterName}`,
        VpcId: vpcId
      });

      const sgResponse = await this.client.send(sgCommand);
      const securityGroupId = sgResponse.GroupId;

      // Add inbound rules for Kubernetes
      const ingressRules = [
        // SSH
        { IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: '0.0.0.0/0' },
        // Kubernetes API
        { IpProtocol: 'tcp', FromPort: 6443, ToPort: 6443, CidrIp: '0.0.0.0/0' },
        // Kubelet API
        { IpProtocol: 'tcp', FromPort: 10250, ToPort: 10250, CidrIp: '0.0.0.0/0' },
        // NodePort Services
        { IpProtocol: 'tcp', FromPort: 30000, ToPort: 32767, CidrIp: '0.0.0.0/0' },
        // All internal traffic
        { IpProtocol: '-1', CidrIp: '10.0.0.0/8' }
      ];

      for (const rule of ingressRules) {
        const authCommand = new AuthorizeSecurityGroupIngressCommand({
          GroupId: securityGroupId,
          IpPermissions: [{
            IpProtocol: rule.IpProtocol,
            FromPort: rule.FromPort,
            ToPort: rule.ToPort,
            IpRanges: [{ CidrIp: rule.CidrIp }]
          }]
        });
        await this.client.send(authCommand);
      }

      // Step 3: Launch instances
      onProgress({ 
        step: 'instances', 
        status: 'running', 
        message: `Launching ${nodeCount} EC2 instances...` 
      });

      // Use Amazon Linux 2023 AMI (region-specific)
      const amiIds = {
        'us-east-1': 'ami-0230bd60aa48260c6',
        'us-east-2': 'ami-0c9978668f8d55984',
        'us-west-1': 'ami-04fdea8e25817cd69',
        'us-west-2': 'ami-0e8c04af2729ff1bb',
        'ap-south-1': 'ami-0f58b397bc5c1f2e8',
        'eu-west-1': 'ami-0d71ea30463e0ff8d'
      };

      const imageId = amiIds[this.region] || amiIds['us-east-1'];

      const runCommand = new RunInstancesCommand({
        ImageId: imageId,
        InstanceType: instanceType,
        MinCount: nodeCount,
        MaxCount: nodeCount,
        SecurityGroupIds: [securityGroupId],
        SubnetId: subnetId,
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: `${clusterName}-node` },
            { Key: 'CloudEvy-Cluster', Value: clusterName },
            { Key: 'ManagedBy', Value: 'CloudEvy' }
          ]
        }],
        UserData: Buffer.from(`#!/bin/bash
# CloudEvy cluster node initialization
echo "CloudEvy K8s node initializing..."
`).toString('base64')
      });

      const runResponse = await this.client.send(runCommand);
      const instanceIds = runResponse.Instances.map(i => i.InstanceId);

      onProgress({ 
        step: 'instances', 
        status: 'completed', 
        message: `Launched ${instanceIds.length} instances` 
      });

      // Step 4: Wait for instances to be running
      onProgress({ 
        step: 'waiting', 
        status: 'running', 
        message: 'Waiting for instances to start...' 
      });

      await this.waitForInstancesRunning(instanceIds, onProgress);

      // Step 5: Get instance details
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });
      const describeResponse = await this.client.send(describeCommand);

      const instances = [];
      for (const reservation of describeResponse.Reservations) {
        for (const instance of reservation.Instances) {
          instances.push({
            instanceId: instance.InstanceId,
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress,
            instanceType: instance.InstanceType,
            state: instance.State.Name
          });
        }
      }

      onProgress({ 
        step: 'provision-complete', 
        status: 'completed', 
        message: `Provisioned ${instances.length} EC2 instances successfully` 
      });

      return {
        instances,
        securityGroupId
      };

    } catch (error) {
      console.error('EC2 provisioning error:', error);
      onProgress({ 
        step: 'provision-error', 
        status: 'error', 
        message: `Provisioning failed: ${error.message}` 
      });
      throw error;
    }
  }

  /**
   * Wait for instances to be in running state
   */
  async waitForInstancesRunning(instanceIds, onProgress, maxWaitTime = 300000) {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });

      const response = await this.client.send(command);
      const instances = response.Reservations.flatMap(r => r.Instances);
      
      const runningCount = instances.filter(i => i.State.Name === 'running').length;
      const pendingCount = instances.filter(i => i.State.Name === 'pending').length;

      if (runningCount === instanceIds.length) {
        onProgress({ 
          step: 'waiting', 
          status: 'completed', 
          message: 'All instances are running' 
        });
        return;
      }

      onProgress({ 
        step: 'waiting', 
        status: 'running', 
        message: `Running: ${runningCount}/${instanceIds.length}, Pending: ${pendingCount}` 
      });

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error('Timeout waiting for instances to start');
  }

  /**
   * Terminate instances (cleanup)
   */
  async terminateInstances(instanceIds) {
    if (!this.client) {
      await this.initialize();
    }

    const command = new TerminateInstancesCommand({
      InstanceIds: instanceIds
    });

    await this.client.send(command);
  }

  /**
   * Create servers in CloudEvy database from provisioned instances
   */
  async createServersFromInstances(instances, workspaceId, cloudAccountId) {
    const servers = [];

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      
      // Generate API key
      const apiKey = 'ck_' + crypto.randomBytes(32).toString('hex');

      const server = await prisma.server.create({
        data: {
          workspaceId,
          cloudAccountId,
          name: `k8s-node-${i + 1}`,
          ipAddress: instance.publicIp,
          provider: 'aws',
          region: this.region,
          instanceType: instance.instanceType,
          instanceId: instance.instanceId,
          platform: 'Linux',
          apiKey,
          status: 'running'
        }
      });

      servers.push(server);
    }

    return servers;
  }
}

