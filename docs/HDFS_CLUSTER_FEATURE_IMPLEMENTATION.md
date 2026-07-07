# 🐘 HDFS/Hadoop Cluster Feature - Complete Implementation Guide

**Created:** January 9, 2026  
**Feature:** Add HDFS/Hadoop cluster creation to CloudEvy  
**Estimated Time:** 3-4 weeks for full implementation

---

## 🎯 **Feature Overview**

Add support for creating and managing Hadoop/HDFS clusters alongside Kubernetes clusters in CloudEvy. Users will be able to select services, configure topology, and deploy production-ready big data clusters.

---

## 📊 **Phase 1: Foundation (Week 1) - MVP**

### **Goal:** Basic HDFS cluster creation with core services

### **1.1 Database Schema Updates**

**Files to modify:**
- `backend/prisma/schema.prisma`

**Changes needed:**

```prisma
// Add new cluster type
enum ClusterType {
  k3s
  kubernetes
  hdfs          // NEW
}

// Add new model for Hadoop services
model HadoopService {
  id              Int       @id @default(autoincrement())
  clusterId       Int       @map("cluster_id")
  cluster         Cluster   @relation(fields: [clusterId], references: [id], onDelete: Cascade)
  serviceName     String    @map("service_name") @db.VarChar(50)
  serviceVersion  String?   @map("service_version") @db.VarChar(20)
  status          String    @map("status") @db.VarChar(50) // 'installing', 'running', 'stopped', 'failed'
  config          Json?     @map("config")
  installedAt     DateTime? @map("installed_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("hadoop_services")
}

// Add new model for node roles in HDFS cluster
model HadoopNodeRole {
  id         Int      @id @default(autoincrement())
  clusterId  Int      @map("cluster_id")
  cluster    Cluster  @relation(fields: [clusterId], references: [id], onDelete: Cascade)
  serverId   Int      @map("server_id")
  server     Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  role       String   @map("role") @db.VarChar(50) // 'namenode', 'datanode', 'resourcemanager', etc.
  isPrimary  Boolean  @default(false) @map("is_primary") // For active/standby
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("hadoop_node_roles")
}

// Update Cluster model to add HDFS-specific fields
model Cluster {
  // ... existing fields ...
  
  // HDFS-specific configuration
  hdfsConfig      Json?              @map("hdfs_config")
  distribution    String?            @map("distribution") @db.VarChar(50) // 'apache', 'hdp', 'cdp'
  
  // Relations
  hadoopServices  HadoopService[]
  hadoopNodeRoles HadoopNodeRole[]
}

// Update Server model to support HDFS
model Server {
  // ... existing fields ...
  
  hadoopNodeRoles HadoopNodeRole[]
}
```

**Migration command:**
```bash
cd backend
npx prisma migrate dev --name add_hdfs_cluster_support
npx prisma generate
```

---

### **1.2 Backend API Endpoints**

**New file:** `backend/src/routes/hdfs.js`

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { createHDFSCluster } from '../services/hdfsProvisioner.js';
import { sendClusterProgress } from '../services/websocketServer.js';

const router = express.Router();

/**
 * POST /api/hdfs/clusters
 * Create a new HDFS cluster
 */
router.post('/clusters',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Cluster name is required'),
    body('distribution').isIn(['apache', 'hdp', 'cdp']).withMessage('Invalid distribution'),
    body('services').isArray().withMessage('Services must be an array'),
    body('nodes.masters').isArray().withMessage('Master nodes required'),
    body('nodes.workers').isArray().withMessage('Worker nodes required'),
    body('config.hdfs.replicationFactor').isInt({ min: 1, max: 4 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, distribution, services, nodes, config } = req.body;
      const workspaceId = req.user.workspaceId;

      // Validate minimum requirements
      if (nodes.masters.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'At least 1 master node is required'
        });
      }

      if (nodes.workers.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 worker nodes are required for HDFS replication'
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

      // Start cluster creation in background
      createHDFSCluster({
        cluster,
        distribution,
        services,
        nodes,
        config,
        onProgress: (progress) => {
          sendClusterProgress(cluster.id, progress);
        }
      }).catch(async (error) => {
        console.error('HDFS cluster creation failed:', error);
        await prisma.cluster.update({
          where: { id: cluster.id },
          data: { status: 'failed' }
        });
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
 * GET /api/hdfs/presets
 * Get service preset configurations
 */
router.get('/presets', authenticate, async (req, res) => {
  const presets = {
    'data-lake': {
      name: 'Data Lake',
      description: 'HDFS + Spark + Hive for data warehousing',
      services: ['hdfs', 'yarn', 'zookeeper', 'spark', 'hive'],
      recommended: true
    },
    'real-time-analytics': {
      name: 'Real-time Analytics',
      description: 'Streaming with Kafka and Spark',
      services: ['hdfs', 'yarn', 'zookeeper', 'kafka', 'spark', 'flink'],
      recommended: false
    },
    'ml-pipeline': {
      name: 'ML Pipeline',
      description: 'Machine learning data processing',
      services: ['hdfs', 'yarn', 'zookeeper', 'spark', 'hive', 'jupyter'],
      recommended: false
    }
  };

  res.json({ success: true, data: presets });
});

/**
 * GET /api/hdfs/services
 * Get available HDFS services
 */
router.get('/services', authenticate, async (req, res) => {
  const services = {
    core: [
      { id: 'hdfs', name: 'HDFS', required: true, setupTime: 5 },
      { id: 'yarn', name: 'YARN', required: true, setupTime: 5 },
      { id: 'zookeeper', name: 'Zookeeper', required: true, setupTime: 3 }
    ],
    processing: [
      { id: 'mapreduce', name: 'MapReduce', setupTime: 5 },
      { id: 'spark', name: 'Spark', setupTime: 10, recommended: true },
      { id: 'tez', name: 'Tez', setupTime: 5 },
      { id: 'flink', name: 'Flink', setupTime: 10 }
    ],
    sql: [
      { id: 'hive', name: 'Hive', setupTime: 8, recommended: true },
      { id: 'pig', name: 'Pig', setupTime: 5 },
      { id: 'impala', name: 'Impala', setupTime: 10 },
      { id: 'presto', name: 'Presto', setupTime: 10 }
    ],
    storage: [
      { id: 'hbase', name: 'HBase', setupTime: 12 },
      { id: 'phoenix', name: 'Phoenix', setupTime: 8 },
      { id: 'accumulo', name: 'Accumulo', setupTime: 15 }
    ],
    streaming: [
      { id: 'kafka', name: 'Kafka', setupTime: 8, recommended: true },
      { id: 'storm', name: 'Storm', setupTime: 10 },
      { id: 'flume', name: 'Flume', setupTime: 5 },
      { id: 'nifi', name: 'NiFi', setupTime: 12 }
    ],
    management: [
      { id: 'ambari', name: 'Ambari', setupTime: 10, recommended: true },
      { id: 'ranger', name: 'Ranger', setupTime: 10 },
      { id: 'atlas', name: 'Atlas', setupTime: 12 },
      { id: 'grafana', name: 'Grafana', setupTime: 5 }
    ]
  };

  res.json({ success: true, data: services });
});

export default router;
```

---

### **1.3 HDFS Provisioner Service**

**New file:** `backend/src/services/hdfsProvisioner.js`

```javascript
import prisma from '../config/prisma.js';
import { getMultipleServerSSHCredentials } from './sshResolver.js';
import { Client } from 'ssh2';

/**
 * Create HDFS cluster using Ambari
 */
export async function createHDFSCluster({ cluster, distribution, services, nodes, config, onProgress }) {
  try {
    onProgress({ step: 'init', status: 'running', message: 'Starting HDFS cluster creation...' });

    // 1. Get SSH credentials for all nodes
    const allServerIds = [...nodes.masters, ...nodes.workers].map(n => n.serverId);
    const sshCredentials = await getMultipleServerSSHCredentials(allServerIds);

    // 2. Validate all nodes are accessible
    onProgress({ step: 'validation', status: 'running', message: 'Validating nodes...' });
    await validateNodes(sshCredentials, onProgress);

    // 3. Install Ambari Server on first master
    onProgress({ step: 'ambari', status: 'running', message: 'Installing Ambari Server...' });
    const masterNode = sshCredentials.find(s => s.serverId === nodes.masters[0].serverId);
    await installAmbariServer(masterNode, onProgress);

    // 4. Install Ambari Agents on all nodes
    onProgress({ step: 'agents', status: 'running', message: 'Installing Ambari Agents...' });
    await installAmbariAgents(sshCredentials, masterNode.server.ipAddress, onProgress);

    // 5. Generate and submit Ambari blueprint
    onProgress({ step: 'blueprint', status: 'running', message: 'Creating cluster blueprint...' });
    await submitAmbariBlueprint(cluster, distribution, services, nodes, config, masterNode, onProgress);

    // 6. Wait for services to start
    onProgress({ step: 'services', status: 'running', message: 'Starting services...' });
    await waitForServices(masterNode, services, onProgress);

    // 7. Store service information in database
    await storeServiceInfo(cluster.id, services);

    // 8. Update cluster status
    await prisma.cluster.update({
      where: { id: cluster.id },
      data: {
        status: 'running',
        apiEndpoint: `http://${masterNode.server.ipAddress}:8080` // Ambari URL
      }
    });

    onProgress({ step: 'complete', status: 'completed', message: 'HDFS cluster ready!' });

  } catch (error) {
    console.error('HDFS cluster creation error:', error);
    onProgress({ step: 'error', status: 'error', message: error.message });
    throw error;
  }
}

// Helper functions...
async function validateNodes(sshCredentials, onProgress) {
  // Implementation for node validation
}

async function installAmbariServer(masterNode, onProgress) {
  // Implementation for Ambari server installation
}

async function installAmbariAgents(sshCredentials, ambariServerIp, onProgress) {
  // Implementation for Ambari agent installation
}

async function submitAmbariBlueprint(cluster, distribution, services, nodes, config, masterNode, onProgress) {
  // Implementation for Ambari blueprint submission
}

async function waitForServices(masterNode, services, onProgress) {
  // Implementation for waiting for services to start
}

async function storeServiceInfo(clusterId, services) {
  // Store services in database
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
}
```

---

### **1.4 Frontend Components**

**New file:** `frontend/src/components/HDFSClusterWizard.vue`

```vue
<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-gray-700 overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-orange-900/20 to-yellow-900/20">
        <h2 class="text-2xl font-bold text-white flex items-center">
          🐘 Create HDFS Cluster
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
        <div class="flex items-center justify-between max-w-4xl mx-auto">
          <div v-for="(step, index) in steps" :key="index" class="flex items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold',
              currentStep > index + 1 ? 'bg-green-500 text-white' :
              currentStep === index + 1 ? 'bg-blue-500 text-white' :
              'bg-gray-700 text-gray-400'
            ]">
              <svg v-if="currentStep > index + 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span :class="[
              'ml-3 text-sm font-medium',
              currentStep >= index + 1 ? 'text-white' : 'text-gray-500'
            ]">
              {{ step }}
            </span>
            <div v-if="index < steps.length - 1" :class="[
              'w-16 h-0.5 mx-4',
              currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-700'
            ]"></div>
          </div>
        </div>
      </div>

      <!-- Content (scrollable) -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- Step 1: Distribution Selection -->
        <div v-if="currentStep === 1" class="space-y-6">
          <!-- Distribution selection UI -->
        </div>

        <!-- Step 2: Service Selection -->
        <div v-else-if="currentStep === 2" class="space-y-6">
          <!-- Service selection UI -->
        </div>

        <!-- Step 3: Configuration -->
        <div v-else-if="currentStep === 3" class="space-y-6">
          <!-- Configuration UI -->
        </div>

        <!-- Step 4: Node Assignment -->
        <div v-else-if="currentStep === 4" class="space-y-6">
          <!-- Node assignment UI -->
        </div>

        <!-- Step 5: Review -->
        <div v-else-if="currentStep === 5" class="space-y-6">
          <!-- Review and create -->
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
        <button
          v-if="currentStep > 1"
          @click="currentStep--"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          ← Back
        </button>
        <div v-else></div>

        <div class="flex items-center space-x-3">
          <button
            @click="$emit('close')"
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            v-if="currentStep < 5"
            @click="currentStep++"
            :disabled="!canProceed"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            Next →
          </button>
          <button
            v-else
            @click="createCluster"
            :disabled="creating"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            {{ creating ? 'Creating...' : '🚀 Create Cluster' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'created']);

const currentStep = ref(1);
const creating = ref(false);

const steps = ['Distribution', 'Services', 'Configuration', 'Nodes', 'Review'];

const config = ref({
  distribution: 'hdp',
  services: ['hdfs', 'yarn', 'zookeeper'],
  nodes: {
    masters: [],
    workers: []
  },
  hdfs: {
    replicationFactor: 3,
    blockSize: '128MB'
  }
});

const canProceed = computed(() => {
  // Validation logic for each step
  return true;
});

const createCluster = async () => {
  // Implementation
};
</script>
```

---

## 📝 **Implementation Checklist - Phase 1**

### **Database (Day 1-2)**
- [ ] Update Prisma schema with HDFS models
- [ ] Create migration for new tables
- [ ] Test schema changes
- [ ] Update database documentation

### **Backend (Day 3-7)**
- [ ] Create `/api/hdfs` routes
- [ ] Implement `hdfsProvisioner.js` service
- [ ] Add Ambari blueprint generation
- [ ] Test cluster creation flow
- [ ] Add error handling

### **Frontend (Day 8-12)**
- [ ] Create `HDFSClusterWizard.vue` component
- [ ] Add service selection UI
- [ ] Add configuration forms
- [ ] Add node assignment UI
- [ ] Integrate with backend API

### **Testing (Day 13-14)**
- [ ] Test end-to-end cluster creation
- [ ] Test with minimum configuration (3 nodes)
- [ ] Verify Ambari installation
- [ ] Test service deployment

---

## 🎯 **Success Criteria - Phase 1**

- [ ] User can select "HDFS" cluster type
- [ ] User can select services (HDFS, YARN, Spark, Hive)
- [ ] User can configure cluster (replication, resources)
- [ ] User can assign nodes (2 masters + 3 workers minimum)
- [ ] Cluster creates successfully with Ambari
- [ ] Services start and show as "Running"
- [ ] User can access Ambari UI

---

## 📚 **Additional Resources Needed**

### **1. Ambari Blueprint Templates**
- Create blueprint JSON templates for different distributions
- Store in `backend/templates/ambari/`

### **2. Installation Scripts**
- Ambari server installation script
- Ambari agent installation script
- Store in `backend/scripts/hdfs/`

### **3. Documentation**
- User guide for HDFS cluster creation
- Troubleshooting guide
- Best practices document

---

## 🚀 **Next Steps After Phase 1**

**Phase 2: Enhanced Features (Week 2-3)**
- Add more services (Kafka, HBase, etc.)
- Add cluster monitoring
- Add job submission UI
- Add HDFS browser

**Phase 3: Production Features (Week 4)**
- High Availability setup
- Kerberos security
- Auto-scaling workers
- Backup/restore

---

**Total Estimated Time:** 3-4 weeks for complete feature

**Ready to start implementing?** Let me know and I'll begin with the database schema!

