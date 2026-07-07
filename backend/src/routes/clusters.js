import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { createCluster } from '../services/kubernetesProvisioner.js';
import { sendClusterProgress } from '../services/websocketServer.js';
import { getMultipleServerSSHCredentials } from '../services/sshResolver.js';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execPromise = promisify(exec);

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/clusters
 * Get all clusters for workspace
 */
router.get('/', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    const clusters = await prisma.cluster.findMany({
      where: { workspaceId },
      include: {
        nodes: {
          include: {
            server: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
                instanceType: true
              }
            }
          }
        },
        hadoopServices: true,
        hadoopNodeRoles: {
          include: {
            server: {
              select: {
                id: true,
                name: true,
                ipAddress: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add nodeCount to each cluster
    const clustersWithCount = clusters.map(cluster => ({
      ...cluster,
      nodeCount: cluster.nodes.length || cluster.hadoopNodeRoles.length
    }));

    res.json({
      success: true,
      data: clustersWithCount
    });
  } catch (error) {
    console.error('Get clusters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clusters'
    });
  }
});

/**
 * GET /api/clusters/:id
 * Get cluster by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: {
          include: {
            server: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
                instanceType: true,
                status: true
              }
            }
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

    res.json({
      success: true,
      data: {
        ...cluster,
        nodeCount: cluster.nodes.length
      }
    });
  } catch (error) {
    console.error('Get cluster error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cluster'
    });
  }
});

/**
 * GET /api/clusters/:id/nodes
 * Get nodes for a cluster
 */
router.get('/:id/nodes', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Verify cluster belongs to workspace
    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'Cluster not found'
      });
    }

    const nodes = await prisma.clusterNode.findMany({
      where: { clusterId },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            instanceType: true,
            status: true
          }
        }
      },
      orderBy: { role: 'asc' } // Master first, then workers
    });

    res.json({
      success: true,
      data: nodes.map(node => ({
        id: node.id,
        name: node.nodeName,
        role: node.role,
        status: node.status,
        cpuUsage: node.cpuUsage,
        memoryUsage: node.memoryUsage,
        podCount: node.podCount,
        server: node.server
      }))
    });
  } catch (error) {
    console.error('Get cluster nodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cluster nodes'
    });
  }
});

/**
 * GET /api/clusters/:id/nodes/live
 * Get live node metrics from K3s cluster
 */
router.get('/:id/nodes/live', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Verify cluster belongs to workspace and get kubeconfig
    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: {
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

    if (!cluster.kubeconfig) {
      return res.status(400).json({
        success: false,
        message: 'Cluster kubeconfig not available'
      });
    }

    // Use kubectl to get node metrics
    
    // Write kubeconfig to temp file
    const tmpDir = os.tmpdir();
    const kubeconfigPath = path.join(tmpDir, `kubeconfig-${cluster.id}-${Date.now()}`);
    
    // Determine best IP to use (private vs public)
    let kubeconfigToUse = cluster.kubeconfig;
    let ipUsed = 'public';
    
    if (cluster.nodes && cluster.nodes.length > 0) {
      const masterNode = cluster.nodes.find(n => n.role === 'master');
      if (masterNode && masterNode.server) {
        const masterPublicIp = masterNode.server.ipAddress;
        const masterPrivateIp = masterNode.server.privateIpAddress;
        
        // Try private IP with a quick connectivity test (5 second timeout)
        if (masterPrivateIp) {
          console.log(`Testing private IP connectivity to ${masterPrivateIp}:6443...`);
          
          const testKubeconfigPath = path.join(tmpDir, `test-kubeconfig-${cluster.id}-${Date.now()}`);
          const testKubeconfig = cluster.kubeconfig.replace(
            `https://${masterPublicIp}:6443`,
            `https://${masterPrivateIp}:6443`
          );
          fs.writeFileSync(testKubeconfigPath, testKubeconfig);
          
          try {
            // Quick test with 5 second timeout
            await execPromise(
              `kubectl --kubeconfig="${testKubeconfigPath}" --request-timeout=3s cluster-info`,
              { timeout: 5000 }
            );
            console.log(`✅ Private IP ${masterPrivateIp} is reachable, using it for better performance`);
            kubeconfigToUse = testKubeconfig;
            ipUsed = 'private';
          } catch (testError) {
            console.log(`❌ Private IP ${masterPrivateIp} not reachable, falling back to public IP ${masterPublicIp}`);
            kubeconfigToUse = cluster.kubeconfig;
            ipUsed = 'public';
          } finally {
            // Clean up test file
            try {
              fs.unlinkSync(testKubeconfigPath);
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    }
    
    console.log(`Using ${ipUsed} IP for K3s API connection`);
    fs.writeFileSync(kubeconfigPath, kubeconfigToUse);

    try {
      console.log(`Fetching nodes for cluster ${cluster.id}...`);

      // Get node status and basic info with increased timeout and request timeout
      const { stdout: nodesJson } = await execPromise(
        `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=30s get nodes -o json`,
        { timeout: 35000, maxBuffer: 10 * 1024 * 1024 } // 35 second timeout, 10MB buffer
      );

      const nodesData = JSON.parse(nodesJson);
      
      // Try to get metrics (requires metrics-server, may fail)
      let metricsData = null;
      try {
        const { stdout: metricsJson } = await execPromise(
          `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=30s top nodes --no-headers`,
          { timeout: 35000 }
        );
        metricsData = metricsJson;
      } catch (metricsError) {
        console.log('Metrics server not available:', metricsError.message);
      }

      // Parse metrics if available
      const metricsMap = {};
      if (metricsData) {
        const lines = metricsData.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const [name, cpu, cpuPercent, memory, memoryPercent] = parts;
            metricsMap[name] = {
              cpu: cpuPercent,
              memory: memoryPercent
            };
          }
        });
      }

      // Get pod count per node
      const { stdout: podsJson } = await execPromise(
        `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=30s get pods --all-namespaces -o json`,
        { timeout: 35000, maxBuffer: 10 * 1024 * 1024 }
      );
      const podsData = JSON.parse(podsJson);
      const podCountMap = {};
      podsData.items.forEach(pod => {
        const nodeName = pod.spec.nodeName;
        if (nodeName) {
          podCountMap[nodeName] = (podCountMap[nodeName] || 0) + 1;
        }
      });

      // Build response
      const nodes = nodesData.items.map(node => {
        const nodeName = node.metadata.name;
        const conditions = node.status.conditions || [];
        const readyCondition = conditions.find(c => c.type === 'Ready');
        const isReady = readyCondition?.status === 'True';

        // Determine role
        const labels = node.metadata.labels || {};
        let role = 'worker';
        if (labels['node-role.kubernetes.io/master'] === 'true' || 
            labels['node-role.kubernetes.io/control-plane'] === 'true') {
          role = 'master';
        }

        // Find matching server from database
        const dbNode = cluster.nodes.find(n => n.nodeName === nodeName);

        return {
          name: nodeName,
          role,
          status: isReady ? 'Ready' : 'NotReady',
          cpuUsage: metricsMap[nodeName]?.cpu || '0%',
          memoryUsage: metricsMap[nodeName]?.memory || '0%',
          podCount: podCountMap[nodeName] || 0,
          kubeletVersion: node.status.nodeInfo?.kubeletVersion || 'Unknown',
          osImage: node.status.nodeInfo?.osImage || 'Unknown',
          internalIP: node.status.addresses?.find(a => a.type === 'InternalIP')?.address,
          server: dbNode?.server || null
        };
      });

      res.json({
        success: true,
        data: nodes
      });

      // Clean up temp file
      fs.unlinkSync(kubeconfigPath);
    } catch (kubectlError) {
      // Clean up temp file on error
      try {
        fs.unlinkSync(kubeconfigPath);
      } catch (e) {
        // Ignore cleanup error
      }
      throw kubectlError;
    }
  } catch (error) {
    console.error('Get live cluster nodes error:', error);
    
    // Provide helpful error messages
    let message = 'Failed to fetch live cluster node metrics';
    
    if (error.killed && error.signal === 'SIGTERM') {
      message = 'Connection timeout: Unable to reach K3s API server. Please check: (1) Security group allows port 6443 from CloudEvy server, (2) K3s master is running, (3) API endpoint is correct';
    } else if (error.code === 'ENOTFOUND') {
      message = 'DNS resolution failed: Cannot resolve cluster hostname';
    } else if (error.stderr?.includes('Unable to connect')) {
      message = 'Connection refused: K3s API server is not reachable. Check security groups and firewall rules';
    } else if (error.message) {
      message = error.message;
    }
    
    res.status(500).json({
      success: false,
      message,
      hint: 'Try using the database fallback or check cluster connectivity'
    });
  }
});

/**
 * POST /api/clusters/:id/fix-metrics
 * Install/fix metrics-server in the cluster
 */
router.post('/:id/fix-metrics', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Find cluster
    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: {
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

    if (cluster.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cluster must be in running state to fix metrics'
      });
    }

    console.log(`🔧 Installing/fixing metrics-server for cluster ${cluster.id}...`);

    // Save kubeconfig to temp file
    const tempDir = os.tmpdir();
    const kubeconfigPath = path.join(tempDir, `kubeconfig-${cluster.id}-${Date.now()}.yaml`);
    
    try {
      fs.writeFileSync(kubeconfigPath, cluster.kubeconfig);

      // First, check if metrics-server is already deployed
      console.log('Checking for existing metrics-server...');
      let metricsServerExists = false;
      try {
        await execPromise(
          `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=10s get deployment metrics-server -n kube-system`,
          { timeout: 15000 }
        );
        metricsServerExists = true;
        console.log('✅ Metrics-server deployment found');
      } catch (error) {
        console.log('ℹ️ Metrics-server not found, will install it');
      }

      if (metricsServerExists) {
        // Restart metrics-server deployment
        console.log('🔄 Restarting metrics-server...');
        await execPromise(
          `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=20s rollout restart deployment metrics-server -n kube-system`,
          { timeout: 30000 }
        );
        console.log('✅ Metrics-server restarted');
      } else {
        // Install metrics-server
        console.log('📦 Installing metrics-server...');
        
        // K3s-specific metrics-server installation (with proper flags for K3s)
        const metricsServerYaml = `
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-view: "true"
  name: system:aggregated-metrics-reader
rules:
- apiGroups:
  - metrics.k8s.io
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
rules:
- apiGroups:
  - ""
  resources:
  - nodes/metrics
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  ports:
  - name: https
    port: 443
    protocol: TCP
    targetPort: https
  selector:
    k8s-app: metrics-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        - --kubelet-insecure-tls
        image: registry.k8s.io/metrics-server/metrics-server:v0.7.0
        imagePullPolicy: IfNotPresent
        livenessProbe:
          failureThreshold: 3
          httpGet:
            path: /livez
            port: https
            scheme: HTTPS
          periodSeconds: 10
        name: metrics-server
        ports:
        - containerPort: 4443
          name: https
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          httpGet:
            path: /readyz
            port: https
            scheme: HTTPS
          initialDelaySeconds: 20
          periodSeconds: 10
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
        volumeMounts:
        - mountPath: /tmp
          name: tmp-dir
      nodeSelector:
        kubernetes.io/os: linux
      priorityClassName: system-cluster-critical
      serviceAccountName: metrics-server
      volumes:
      - emptyDir: {}
        name: tmp-dir
---
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  labels:
    k8s-app: metrics-server
  name: v1beta1.metrics.k8s.io
spec:
  group: metrics.k8s.io
  groupPriorityMinimum: 100
  insecureSkipTLSVerify: true
  service:
    name: metrics-server
    namespace: kube-system
  version: v1beta1
  versionPriority: 100
`;

        // Write YAML to temp file
        const yamlPath = path.join(tempDir, `metrics-server-${cluster.id}.yaml`);
        fs.writeFileSync(yamlPath, metricsServerYaml);

        // Apply the manifest
        await execPromise(
          `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=30s apply -f "${yamlPath}"`,
          { timeout: 40000 }
        );

        // Clean up YAML file
        fs.unlinkSync(yamlPath);
        
        console.log('✅ Metrics-server installed successfully');
      }

      // Wait for metrics-server to be ready (give it 30 seconds)
      console.log('⏳ Waiting for metrics-server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Test metrics availability
      try {
        await execPromise(
          `kubectl --kubeconfig="${kubeconfigPath}" --request-timeout=10s top nodes`,
          { timeout: 15000 }
        );
        console.log('✅ Metrics are now available!');
      } catch (error) {
        console.log('⚠️ Metrics-server is installed but may need a few more seconds to start collecting data');
      }

      res.json({
        success: true,
        message: 'Metrics-server installed successfully. Metrics should be available in ~30 seconds.',
        action: metricsServerExists ? 'restarted' : 'installed'
      });

    } finally {
      // Clean up kubeconfig file
      if (fs.existsSync(kubeconfigPath)) {
        fs.unlinkSync(kubeconfigPath);
      }
    }

  } catch (error) {
    console.error('Failed to fix metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to install metrics-server',
      error: error.stderr || error.message
    });
  }
});

/**
 * POST /api/clusters
 * Create a new cluster
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Cluster name is required and must be less than 255 characters'),
    body('type')
      .isIn(['kubernetes', 'k3s'])
      .withMessage('Type must be either "kubernetes" or "k3s"'),
    body('networkPlugin')
      .optional()
      .isIn(['calico', 'flannel', 'cilium'])
      .withMessage('Network plugin must be one of: calico, flannel, cilium'),
    body('existingServers')
      .optional()
      .isArray()
      .withMessage('existingServers must be an array'),
    body('provisionConfig')
      .optional({ nullable: true })
      .custom((value) => {
        if (value !== null && typeof value !== 'object') {
          throw new Error('provisionConfig must be an object or null');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        type,
        networkPlugin,
        existingServers,
        provisionConfig
      } = req.body;

      const workspaceId = req.user.workspaceId;
      const userId = req.user.userId;

      // Check if cluster name already exists
      const existingCluster = await prisma.cluster.findFirst({
        where: {
          workspaceId,
          name: name.trim()
        }
      });

      if (existingCluster) {
        return res.status(409).json({
          success: false,
          message: 'A cluster with this name already exists'
        });
      }

      // Validate that at least one node source is provided
      const hasExistingServers = existingServers && existingServers.length > 0;
      const hasProvisionConfig = provisionConfig && provisionConfig.nodeCount > 0;

      if (!hasExistingServers && !hasProvisionConfig) {
        return res.status(400).json({
          success: false,
          message: 'You must select existing servers or configure new servers to provision'
        });
      }

      // If using existing servers, verify they belong to this workspace and have SSH credentials
      if (hasExistingServers) {
        const servers = await prisma.server.findMany({
          where: {
            id: { in: existingServers },
            workspaceId
          },
          include: {
            cloudAccount: true
          }
        });

        if (servers.length !== existingServers.length) {
          return res.status(400).json({
            success: false,
            message: 'Some selected servers do not exist or do not belong to your workspace'
          });
        }

        // Check SSH credentials using the new resolver
        try {
          await getMultipleServerSSHCredentials(existingServers, workspaceId);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: error.message || 'SSH credentials not configured for one or more servers'
          });
        }
      }

      // Create cluster record
      const cluster = await prisma.cluster.create({
        data: {
          workspaceId,
          name: name.trim(),
          type,
          status: 'creating',
          networkPlugin: networkPlugin || (type === 'kubernetes' ? 'calico' : null),
          createdBy: userId
        }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          workspaceId,
          userId,
          action: 'cluster_create_started',
          resourceType: 'cluster',
          resourceId: cluster.id,
          details: JSON.stringify({
            clusterName: name,
            type,
            existingServers: existingServers || [],
            provisionConfig: provisionConfig || null
          })
        }
      });

      // Start cluster creation asynchronously
      // This will run in the background
      createCluster(cluster.id, existingServers, provisionConfig, (progress) => {
        console.log(`Cluster ${cluster.id} progress:`, progress);
        // Send progress updates via WebSocket
        sendClusterProgress(cluster.id, progress);
      }).catch(error => {
        console.error(`Cluster ${cluster.id} creation failed:`, error);
        // Send error via WebSocket
        sendClusterProgress(cluster.id, {
          step: 'error',
          status: 'error',
          message: error.message
        });
      });

      res.status(201).json({
        success: true,
        message: 'Cluster creation started',
        data: cluster
      });

    } catch (error) {
      console.error('Create cluster error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create cluster'
      });
    }
  }
);

/**
 * DELETE /api/clusters/:id
 * Delete a cluster
 */
router.delete('/:id', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const userId = req.user.userId;

    // Verify cluster belongs to workspace
    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      },
      include: {
        nodes: true
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'Cluster not found'
      });
    }

    // TODO: In production, you'd want to:
    // 1. Drain nodes
    // 2. Delete Kubernetes resources
    // 3. Optionally delete provisioned servers
    // For now, just delete the database records

    await prisma.cluster.delete({
      where: { id: clusterId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: 'cluster_deleted',
        resourceType: 'cluster',
        resourceId: clusterId,
        details: JSON.stringify({
          clusterName: cluster.name,
          nodeCount: cluster.nodes.length
        })
      }
    });

    res.json({
      success: true,
      message: 'Cluster deleted successfully'
    });

  } catch (error) {
    console.error('Delete cluster error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cluster'
    });
  }
});

/**
 * PUT /api/clusters/:id/status
 * Update cluster status (internal use)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const { status, version, apiEndpoint, kubeconfig } = req.body;
    const workspaceId = req.user.workspaceId;

    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'Cluster not found'
      });
    }

    const updatedCluster = await prisma.cluster.update({
      where: { id: clusterId },
      data: {
        status,
        version,
        apiEndpoint,
        kubeconfig
      }
    });

    res.json({
      success: true,
      data: updatedCluster
    });

  } catch (error) {
    console.error('Update cluster status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cluster status'
    });
  }
});

export default router;

