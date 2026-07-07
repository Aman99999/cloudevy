import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { createHDFSCluster } from '../services/hdfsProvisioner.js';
import { sendClusterProgress } from '../services/websocketServer.js';

const router = express.Router();

/**
 * GET /api/hdfs/services
 * Get available HDFS services organized by category
 */
router.get('/services', authenticate, async (req, res) => {
  const services = {
    core: [
      { id: 'hdfs', name: 'HDFS', description: 'Distributed File System', required: true, setupTime: 5 },
      { id: 'yarn', name: 'YARN', description: 'Resource Management', required: true, setupTime: 5 },
      { id: 'zookeeper', name: 'Zookeeper', description: 'Coordination Service', required: true, setupTime: 3 }
    ],
    processing: [
      { id: 'mapreduce', name: 'MapReduce', description: 'Batch Processing', setupTime: 5 },
      { id: 'spark', name: 'Spark', description: 'In-Memory Analytics', setupTime: 10, recommended: true },
      { id: 'tez', name: 'Tez', description: 'Fast MapReduce Engine', setupTime: 5 },
      { id: 'flink', name: 'Flink', description: 'Stream Processing', setupTime: 10 }
    ],
    sql: [
      { id: 'hive', name: 'Hive', description: 'SQL on Hadoop', setupTime: 8, recommended: true },
      { id: 'pig', name: 'Pig', description: 'Data Flow Scripting', setupTime: 5 },
      { id: 'impala', name: 'Impala', description: 'Real-time SQL', setupTime: 10 },
      { id: 'presto', name: 'Presto', description: 'Distributed SQL', setupTime: 10 }
    ],
    storage: [
      { id: 'hbase', name: 'HBase', description: 'NoSQL Database', setupTime: 12 },
      { id: 'phoenix', name: 'Phoenix', description: 'SQL on HBase', setupTime: 8, requires: ['hbase'] },
      { id: 'accumulo', name: 'Accumulo', description: 'Key-Value Store', setupTime: 15 }
    ],
    streaming: [
      { id: 'kafka', name: 'Kafka', description: 'Event Streaming', setupTime: 8, recommended: true },
      { id: 'storm', name: 'Storm', description: 'Real-time Processing', setupTime: 10 },
      { id: 'flume', name: 'Flume', description: 'Log Ingestion', setupTime: 5 },
      { id: 'nifi', name: 'NiFi', description: 'Data Flow Automation', setupTime: 12 }
    ],
    management: [
      { id: 'ambari', name: 'Ambari', description: 'Cluster Management UI', setupTime: 10, recommended: true },
      { id: 'ranger', name: 'Ranger', description: 'Security & Access Control', setupTime: 10 },
      { id: 'atlas', name: 'Atlas', description: 'Metadata & Lineage', setupTime: 12 },
      { id: 'grafana', name: 'Grafana', description: 'Metrics Dashboard', setupTime: 5 }
    ]
  };

  res.json({ success: true, data: services });
});

/**
 * GET /api/hdfs/presets
 * Get service preset templates
 */
router.get('/presets', authenticate, async (req, res) => {
  const presets = {
    'data-lake': {
      name: 'Data Lake',
      description: 'HDFS + Spark + Hive for data warehousing',
      icon: '🏞️',
      services: ['hdfs', 'yarn', 'zookeeper', 'spark', 'hive', 'ambari'],
      recommended: true,
      estimatedTime: 35
    },
    'real-time-analytics': {
      name: 'Real-time Analytics',
      description: 'Streaming with Kafka and Spark',
      icon: '⚡',
      services: ['hdfs', 'yarn', 'zookeeper', 'kafka', 'spark', 'flink', 'ambari'],
      recommended: false,
      estimatedTime: 45
    },
    'ml-pipeline': {
      name: 'ML Pipeline',
      description: 'Machine learning data processing',
      icon: '🤖',
      services: ['hdfs', 'yarn', 'zookeeper', 'spark', 'hive', 'ambari'],
      recommended: false,
      estimatedTime: 40
    },
    'minimal': {
      name: 'Minimal (No Ambari)',
      description: 'Core HDFS + YARN only - Direct installation',
      icon: '🎯',
      services: ['hdfs', 'yarn', 'zookeeper'],
      recommended: true,
      estimatedTime: 15,
      note: 'Best for Apache Hadoop. Fast & reliable.'
    },
    'minimal-with-ui': {
      name: 'Minimal (With Ambari)',
      description: 'Core services + Ambari management UI',
      icon: '🎛️',
      services: ['hdfs', 'yarn', 'zookeeper', 'ambari'],
      recommended: false,
      estimatedTime: 25,
      note: 'Requires working ODP/CDP repositories'
    }
  };

  res.json({ success: true, data: presets });
});

/**
 * GET /api/hdfs/distributions
 * Get available Hadoop distributions
 */
router.get('/distributions', authenticate, async (req, res) => {
  const distributions = {
    'odp': {
      name: 'ODP (Open Data Platform)',
      version: '3.0',
      description: 'Free & open-source Hadoop distribution by Acceldata',
      cost: 'Free',
      icon: '🚀',
      recommended: true,
      features: ['Ambari web UI', 'Pre-configured', 'Production-ready', 'Actively maintained', 'HDP compatible']
    },
    'apache': {
      name: 'Apache Hadoop',
      version: '3.3.6',
      description: 'Pure open source, community-supported',
      cost: 'Free',
      icon: '🐘',
      recommended: true,
      features: ['No external dependencies', 'Direct installation', 'Works with or without Ambari', 'Best for testing', 'Repository-independent']
    },
    'cdp': {
      name: 'Cloudera CDP',
      version: '7.1',
      description: 'Commercial enterprise platform',
      cost: 'Paid (License required)',
      icon: '💼',
      recommended: false,
      features: ['Enterprise support', 'Advanced security', 'Ranger & Atlas', 'Requires subscription']
    }
  };

  res.json({ success: true, data: distributions });
});

/**
 * POST /api/hdfs/clusters
 * Create a new HDFS cluster
 */
router.post('/clusters',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Cluster name is required'),
    body('distribution').isIn(['apache', 'cdp', 'odp']).withMessage('Invalid distribution'),
    body('services').isArray({ min: 3 }).withMessage('At least 3 services required (hdfs, yarn, zookeeper)'),
    body('nodes.masters').isArray({ min: 1 }).withMessage('At least 1 master node required'),
    body('nodes.workers').isArray({ min: 2 }).withMessage('At least 2 worker nodes required'),
    body('config.hdfs.replicationFactor').isInt({ min: 1, max: 4 }).withMessage('Replication factor must be 1-4'),
    // ODP-specific fields (optional, only required when distribution is 'odp')
    body('odpVersion').optional().isString(),
    body('ambariVersion').optional().isString(),
    body('os').optional().isString(),
    body('osVersion').optional().isString(),
    body('odpJdk').optional().isString(),
    body('ambariJdk').optional().isString(),
    body('python').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, distribution, services, nodes, config } = req.body;
      const workspaceId = req.user.workspaceId;

      // Validate service requirements
      const coreServices = ['hdfs', 'yarn', 'zookeeper'];
      const hasAllCore = coreServices.every(s => services.includes(s));
      if (!hasAllCore) {
        return res.status(400).json({
          success: false,
          message: 'Core services (HDFS, YARN, Zookeeper) are required'
        });
      }

      // Create cluster record
      const cluster = await prisma.cluster.create({
        data: {
          workspaceId,
          name,
          type: 'hdfs',
          distribution,
          status: 'creating',
          nodeCount: nodes.masters.length + nodes.workers.length,
          hdfsConfig: config
        }
      });

      console.log(`📊 Creating HDFS cluster ${cluster.id}: ${name}`);
      console.log(`   Distribution: ${distribution}`);
      console.log(`   Services: ${services.join(', ')}`);
      console.log(`   Nodes: ${nodes.masters.length} masters + ${nodes.workers.length} workers`);

      // Start cluster creation in background
      createHDFSCluster({
        cluster,
        distribution,
        services,
        nodes,
        config,
        workspaceId,
        onProgress: (progress) => {
          sendClusterProgress(cluster.id, progress);
        }
      }).catch(async (error) => {
        console.error(`❌ HDFS cluster ${cluster.id} creation failed:`, error);
        try {
          // Check if cluster still exists before updating
          const existingCluster = await prisma.cluster.findUnique({
            where: { id: cluster.id }
          });
          if (existingCluster) {
            await prisma.cluster.update({
              where: { id: cluster.id },
              data: { 
                status: 'failed',
                connectivityError: error.message 
              }
            });
          } else {
            console.warn(`⚠️ Cluster ${cluster.id} not found, skipping status update`);
          }
        } catch (updateError) {
          console.error(`Failed to update cluster status:`, updateError);
        }
      });

      res.json({
        success: true,
        data: { clusterId: cluster.id },
        message: 'HDFS cluster creation started'
      });

    } catch (error) {
      console.error('Failed to create HDFS cluster:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create HDFS cluster'
      });
    }
  }
);

/**
 * GET /api/hdfs/clusters/:id
 * Get HDFS cluster details with services
 */
router.get('/clusters/:id', authenticate, async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId,
        type: 'hdfs'
      },
      include: {
        hadoopServices: true,
        hadoopNodeRoles: {
          include: {
            server: true
          }
        },
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
        message: 'HDFS cluster not found'
      });
    }

    res.json({
      success: true,
      data: cluster
    });

  } catch (error) {
    console.error('Failed to get HDFS cluster:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cluster details'
    });
  }
});

/**
 * DELETE /api/hdfs/clusters/:id
 * Delete HDFS cluster
 */
router.delete('/clusters/:id', authenticate, async (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const cluster = await prisma.cluster.findFirst({
      where: {
        id: clusterId,
        workspaceId,
        type: 'hdfs'
      }
    });

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: 'HDFS cluster not found'
      });
    }

    // Update status to deleting
    await prisma.cluster.update({
      where: { id: clusterId },
      data: { status: 'deleting' }
    });

    // TODO: Implement actual cluster deletion (uninstall services, cleanup)
    // For now, just delete from database
    await prisma.cluster.delete({
      where: { id: clusterId }
    });

    res.json({
      success: true,
      message: 'HDFS cluster deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete HDFS cluster:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete cluster'
    });
  }
});

export default router;

