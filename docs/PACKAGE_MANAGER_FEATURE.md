# 📦 CloudEvy Package Manager Feature

**Status:** 🔮 Future Feature (Post-MVP)  
**Priority:** High  
**Estimated Implementation:** 3-4 weeks  
**Last Updated:** January 5, 2026

---

## 🎯 Feature Overview

A "one-click app store" for servers that allows users to install, manage, and monitor software packages without SSH/terminal knowledge.

### **User Flow:**
1. User opens server details → **"Packages"** or **"Software"** tab
2. Sees a **catalog of installable packages** (Docker, Node.js, MySQL, etc.)
3. Selects version (if applicable) and clicks **"Install"**
4. **Real-time installation logs** stream in the UI (via WebSocket)
5. Installation completes → Shows **success ✅** or **error ❌**
6. User can **uninstall** or **upgrade** packages later

---

## 💡 Business Value

### **For Users:**
- ✅ **Lowers barrier to entry** - No SSH/terminal knowledge needed
- ✅ **Saves time** - One click vs. 10+ commands
- ✅ **Reduces errors** - Tested scripts for each OS
- ✅ **Transparency** - See exactly what's being installed
- ✅ **Reversible** - Easy uninstall option

### **For CloudEvy:**
- 💰 **Premium Feature** - Monetization opportunity
- 🚀 **Competitive Advantage** - Unique in monitoring space
- 📈 **User Retention** - More reasons to use CloudEvy
- 🎯 **Market Expansion** - Appeal to non-technical users
- ⭐ **Viral Growth** - "Install Docker in 1 click" is shareable

---

## 📦 Package Categories

### **1. Container Technologies**
- Docker (Docker Engine + CLI)
- Docker Compose
- Kubernetes (kubectl, k3s, minikube)
- Podman (Docker alternative)

### **2. Programming Languages & Runtimes**
- Node.js (LTS versions: 18.x, 20.x, 22.x)
- Python (3.9, 3.10, 3.11, 3.12)
- Go
- Java (OpenJDK 11, 17, 21)
- Ruby
- PHP (7.4, 8.0, 8.1, 8.2, 8.3)
- Rust
- .NET Core

### **3. Databases**
- MySQL / MariaDB
- PostgreSQL
- MongoDB
- Redis
- Elasticsearch
- Cassandra
- InfluxDB
- SQLite

### **4. Web Servers & Reverse Proxies**
- Nginx
- Apache
- Caddy
- HAProxy
- Traefik

### **5. Big Data & Analytics**
- Apache Hadoop (HDFS)
- Apache Spark
- Apache Kafka
- Apache Airflow
- Apache Flink

### **6. Process Managers**
- PM2 (Node.js process manager)
- Supervisor
- systemd service templates

### **7. Monitoring & Observability**
- Prometheus
- Grafana
- Node Exporter
- Loki (log aggregation)

### **8. Message Queues**
- RabbitMQ
- Apache Kafka
- NATS

### **9. Security & Tools**
- Fail2Ban (intrusion prevention)
- UFW (firewall)
- Let's Encrypt (Certbot) (SSL certificates)
- ClamAV (antivirus)

### **10. Development Tools**
- Git
- Vim / Nano / Emacs
- Build tools (make, gcc, g++)
- Terraform
- Ansible

### **11. Cache & CDN**
- Varnish Cache
- Memcached

### **12. CI/CD**
- Jenkins
- GitLab Runner

---

## 🏗️ Technical Architecture

### **1. Database Schema**

**New Tables to Add:**

```prisma
// backend/prisma/schema.prisma

model PackageInstallation {
  id            Int       @id @default(autoincrement())
  serverId      Int       @map("server_id")
  packageName   String    @db.VarChar(100)  // "docker", "nodejs", etc.
  packageVersion String?  @db.VarChar(50)   // "20.x", "latest"
  status        String    @db.VarChar(50)   // "installing", "installed", "failed", "uninstalling"
  installLog    String?   @db.Text          // Installation output
  errorMsg      String?   @db.Text
  startedAt     DateTime  @default(now()) @map("started_at")
  completedAt   DateTime? @map("completed_at")
  installedBy   Int       @map("installed_by") // User ID
  
  server        Server    @relation(fields: [serverId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [installedBy], references: [id], onDelete: Cascade)
  
  @@index([serverId])
  @@index([status])
  @@index([packageName])
  @@map("package_installations")
}

model PackageDefinition {
  id             Int      @id @default(autoincrement())
  name           String   @unique @db.VarChar(100)      // "docker", "nodejs"
  displayName    String   @db.VarChar(255)              // "Docker"
  category       String   @db.VarChar(100)              // "container", "language", "database"
  description    String   @db.Text
  icon           String?  @db.VarChar(255)              // emoji "🐳" or icon name
  dependencies   String[] // ["docker"] - requires Docker first
  conflicts      String[] // ["apache"] - cannot coexist with Apache
  supportedOS    String[] // ["ubuntu", "amazon-linux", "centos"]
  versions       Json     // { "20.x": {...}, "18.x": {...} }
  defaultVersion String?  @db.VarChar(50)               // "latest"
  isActive       Boolean  @default(true)
  isPopular      Boolean  @default(false)               // Show in "Popular" section
  installCount   Int      @default(0)                   // Track popularity
  documentation  String?  @db.Text                      // Post-install instructions
  healthCheck    String?  @db.Text                      // Command to verify installation
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  @@index([category])
  @@index([isActive])
  @@map("package_definitions")
}
```

**Update Server Model:**

```prisma
model Server {
  // ... existing fields ...
  packages       PackageInstallation[]
}

model User {
  // ... existing fields ...
  packageInstallations PackageInstallation[]
}
```

---

### **2. Backend Implementation**

#### **File Structure:**

```
backend/
├── src/
│   ├── routes/
│   │   └── packages.js               # NEW: Package API routes
│   ├── services/
│   │   ├── packageInstaller.js       # NEW: Core installation logic
│   │   └── packageDefinitions.json   # NEW: Package definitions
│   └── websocketServer.js            # UPDATE: Add package installation events
```

#### **Package Definitions (`backend/src/services/packageDefinitions.json`)**

```json
{
  "docker": {
    "displayName": "Docker",
    "category": "container",
    "description": "Container platform for building and running applications",
    "icon": "🐳",
    "dependencies": [],
    "conflicts": [],
    "supportedOS": ["ubuntu", "debian", "amazon-linux", "centos", "rhel"],
    "defaultVersion": "latest",
    "versions": {
      "latest": {
        "ubuntu": {
          "script": "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER && sudo systemctl enable docker && sudo systemctl start docker",
          "healthCheck": "docker --version"
        },
        "amazon-linux": {
          "script": "sudo yum install -y docker && sudo usermod -aG docker $USER && sudo systemctl enable docker && sudo systemctl start docker",
          "healthCheck": "docker --version"
        },
        "centos": {
          "script": "sudo yum install -y docker && sudo usermod -aG docker $USER && sudo systemctl enable docker && sudo systemctl start docker",
          "healthCheck": "docker --version"
        }
      }
    },
    "documentation": "Docker has been installed successfully! You may need to log out and back in for group changes to take effect. Run 'docker run hello-world' to verify the installation."
  },
  
  "nodejs": {
    "displayName": "Node.js",
    "category": "language",
    "description": "JavaScript runtime built on Chrome's V8 engine",
    "icon": "⬢",
    "dependencies": [],
    "conflicts": [],
    "supportedOS": ["ubuntu", "debian", "amazon-linux", "centos"],
    "defaultVersion": "20.x",
    "versions": {
      "20.x": {
        "ubuntu": {
          "script": "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs",
          "healthCheck": "node --version && npm --version"
        },
        "amazon-linux": {
          "script": "curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo yum install -y nodejs",
          "healthCheck": "node --version && npm --version"
        }
      },
      "18.x": {
        "ubuntu": {
          "script": "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs",
          "healthCheck": "node --version && npm --version"
        },
        "amazon-linux": {
          "script": "curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs",
          "healthCheck": "node --version && npm --version"
        }
      },
      "22.x": {
        "ubuntu": {
          "script": "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs",
          "healthCheck": "node --version && npm --version"
        },
        "amazon-linux": {
          "script": "curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo yum install -y nodejs",
          "healthCheck": "node --version && npm --version"
        }
      }
    },
    "documentation": "Node.js and npm have been installed successfully! Verify with 'node --version' and 'npm --version'."
  },

  "postgresql": {
    "displayName": "PostgreSQL",
    "category": "database",
    "description": "Powerful, open source object-relational database system",
    "icon": "🐘",
    "dependencies": [],
    "conflicts": [],
    "supportedOS": ["ubuntu", "debian", "amazon-linux", "centos"],
    "defaultVersion": "15",
    "versions": {
      "15": {
        "ubuntu": {
          "script": "sudo apt-get update && sudo apt-get install -y postgresql-15 postgresql-contrib && sudo systemctl enable postgresql && sudo systemctl start postgresql",
          "healthCheck": "sudo -u postgres psql --version"
        },
        "amazon-linux": {
          "script": "sudo amazon-linux-extras install postgresql15 && sudo yum install -y postgresql-server postgresql-contrib && sudo postgresql-setup initdb && sudo systemctl enable postgresql && sudo systemctl start postgresql",
          "healthCheck": "psql --version"
        }
      },
      "14": {
        "ubuntu": {
          "script": "sudo apt-get update && sudo apt-get install -y postgresql-14 postgresql-contrib && sudo systemctl enable postgresql && sudo systemctl start postgresql",
          "healthCheck": "sudo -u postgres psql --version"
        }
      }
    },
    "documentation": "PostgreSQL has been installed and started. Default user is 'postgres'. To access: sudo -u postgres psql"
  },

  "nginx": {
    "displayName": "Nginx",
    "category": "webserver",
    "description": "High-performance HTTP server and reverse proxy",
    "icon": "🔷",
    "dependencies": [],
    "conflicts": ["apache"],
    "supportedOS": ["ubuntu", "debian", "amazon-linux", "centos"],
    "defaultVersion": "latest",
    "versions": {
      "latest": {
        "ubuntu": {
          "script": "sudo apt-get update && sudo apt-get install -y nginx && sudo systemctl enable nginx && sudo systemctl start nginx",
          "healthCheck": "nginx -v"
        },
        "amazon-linux": {
          "script": "sudo yum install -y nginx && sudo systemctl enable nginx && sudo systemctl start nginx",
          "healthCheck": "nginx -v"
        }
      }
    },
    "documentation": "Nginx has been installed and is running on port 80. Configuration: /etc/nginx/nginx.conf"
  },

  "pm2": {
    "displayName": "PM2",
    "category": "process-manager",
    "description": "Production process manager for Node.js applications",
    "icon": "📦",
    "dependencies": ["nodejs"],
    "conflicts": [],
    "supportedOS": ["ubuntu", "debian", "amazon-linux", "centos"],
    "defaultVersion": "latest",
    "versions": {
      "latest": {
        "ubuntu": {
          "script": "sudo npm install -g pm2 && pm2 startup systemd -u $USER --hp $HOME && sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME",
          "healthCheck": "pm2 --version"
        },
        "amazon-linux": {
          "script": "sudo npm install -g pm2 && pm2 startup systemd -u $USER --hp $HOME && sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME",
          "healthCheck": "pm2 --version"
        }
      }
    },
    "documentation": "PM2 has been installed globally. Use 'pm2 start app.js' to manage Node.js processes. Run 'pm2 save' to persist applications."
  }
}
```

#### **Package Installer Service (`backend/src/services/packageInstaller.js`)**

```javascript
import { Client } from 'ssh2';
import packageDefinitions from './packageDefinitions.json' assert { type: 'json' };
import prisma from '../config/prisma.js';

export class PackageInstaller {
  constructor(server, sshCredentials, userId) {
    this.server = server;
    this.sshCredentials = sshCredentials;
    this.userId = userId;
    this.installationRecord = null;
  }

  /**
   * Detect OS on the server
   */
  async detectOS() {
    const conn = new Client();
    
    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        conn.exec('cat /etc/os-release', (err, stream) => {
          if (err) return reject(err);
          
          let output = '';
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.on('close', () => {
            conn.end();
            
            // Parse OS
            if (output.includes('Ubuntu')) resolve('ubuntu');
            else if (output.includes('Amazon Linux')) resolve('amazon-linux');
            else if (output.includes('CentOS')) resolve('centos');
            else if (output.includes('Red Hat')) resolve('rhel');
            else if (output.includes('Debian')) resolve('debian');
            else resolve('unknown');
          });
        });
      });
      
      conn.on('error', reject);
      conn.connect(this.sshCredentials);
    });
  }

  /**
   * Check if package is already installed
   */
  async isInstalled(packageName) {
    const existing = await prisma.packageInstallation.findFirst({
      where: {
        serverId: this.server.id,
        packageName,
        status: 'installed'
      }
    });
    return !!existing;
  }

  /**
   * Check dependencies
   */
  async checkDependencies(packageName) {
    const pkgDef = packageDefinitions[packageName];
    if (!pkgDef || !pkgDef.dependencies.length) return [];

    const missing = [];
    for (const dep of pkgDef.dependencies) {
      const installed = await this.isInstalled(dep);
      if (!installed) {
        missing.push(dep);
      }
    }
    return missing;
  }

  /**
   * Install a package
   */
  async install(packageName, version, onProgress) {
    // 1. Validate package exists
    const pkgDef = packageDefinitions[packageName];
    if (!pkgDef) {
      throw new Error(`Package '${packageName}' not found`);
    }

    // 2. Check if already installed
    if (await this.isInstalled(packageName)) {
      throw new Error(`Package '${packageName}' is already installed`);
    }

    // 3. Check dependencies
    const missingDeps = await this.checkDependencies(packageName);
    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    // 4. Detect OS
    const os = await this.detectOS();
    if (!pkgDef.supportedOS.includes(os)) {
      throw new Error(`Package '${packageName}' is not supported on ${os}`);
    }

    // 5. Get installation script
    const versionDef = pkgDef.versions[version || pkgDef.defaultVersion];
    if (!versionDef) {
      throw new Error(`Version '${version}' not found for package '${packageName}'`);
    }

    const osDef = versionDef[os];
    if (!osDef) {
      throw new Error(`No installation script for ${os}`);
    }

    // 6. Create installation record
    this.installationRecord = await prisma.packageInstallation.create({
      data: {
        serverId: this.server.id,
        packageName,
        packageVersion: version || pkgDef.defaultVersion,
        status: 'installing',
        installedBy: this.userId,
        installLog: ''
      }
    });

    // 7. Execute installation script
    try {
      await this.executeScript(osDef.script, (log) => {
        // Update log in database
        this.appendLog(log);
        // Send to frontend via WebSocket
        if (onProgress) onProgress(log);
      });

      // 8. Run health check
      const healthOk = await this.runHealthCheck(osDef.healthCheck);
      
      if (healthOk) {
        // Mark as installed
        await prisma.packageInstallation.update({
          where: { id: this.installationRecord.id },
          data: {
            status: 'installed',
            completedAt: new Date()
          }
        });

        // Increment install count
        await prisma.packageDefinition.update({
          where: { name: packageName },
          data: {
            installCount: { increment: 1 }
          }
        });

        return {
          success: true,
          message: pkgDef.documentation
        };
      } else {
        throw new Error('Health check failed');
      }

    } catch (error) {
      // Mark as failed
      await prisma.packageInstallation.update({
        where: { id: this.installationRecord.id },
        data: {
          status: 'failed',
          errorMsg: error.message,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Execute script via SSH
   */
  async executeScript(script, onProgress) {
    const conn = new Client();
    
    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        conn.exec(script, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          
          stream.on('data', (data) => {
            onProgress({ type: 'stdout', data: data.toString() });
          });
          
          stream.stderr.on('data', (data) => {
            onProgress({ type: 'stderr', data: data.toString() });
          });
          
          stream.on('close', (code) => {
            conn.end();
            
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Installation failed with exit code ${code}`));
            }
          });
        });
      });
      
      conn.on('error', (err) => {
        reject(err);
      });
      
      conn.connect(this.sshCredentials);
    });
  }

  /**
   * Run health check
   */
  async runHealthCheck(healthCheckCommand) {
    if (!healthCheckCommand) return true;

    const conn = new Client();
    
    return new Promise((resolve) => {
      conn.on('ready', () => {
        conn.exec(healthCheckCommand, (err, stream) => {
          if (err) {
            conn.end();
            return resolve(false);
          }
          
          stream.on('close', (code) => {
            conn.end();
            resolve(code === 0);
          });
        });
      });
      
      conn.on('error', () => {
        resolve(false);
      });
      
      conn.connect(this.sshCredentials);
    });
  }

  /**
   * Append log to installation record
   */
  async appendLog(log) {
    if (!this.installationRecord) return;

    const currentLog = await prisma.packageInstallation.findUnique({
      where: { id: this.installationRecord.id },
      select: { installLog: true }
    });

    const newLog = (currentLog.installLog || '') + 
                   `[${new Date().toISOString()}] ${log.data}\n`;

    await prisma.packageInstallation.update({
      where: { id: this.installationRecord.id },
      data: { installLog: newLog }
    });
  }

  /**
   * Uninstall a package
   */
  async uninstall(packageName, onProgress) {
    // Implementation for uninstall
    // Similar to install but runs uninstall scripts
  }
}
```

#### **API Routes (`backend/src/routes/packages.js`)**

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { PackageInstaller } from '../services/packageInstaller.js';
import { decryptSSHKey } from '../services/sshLogStreamer.js';
import packageDefinitions from '../services/packageDefinitions.json' assert { type: 'json' };

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/packages
 * Get all available packages
 */
router.get('/', async (req, res) => {
  try {
    const { category, os } = req.query;

    // Filter packages from packageDefinitions.json
    let packages = Object.entries(packageDefinitions).map(([name, def]) => ({
      name,
      ...def
    }));

    if (category) {
      packages = packages.filter(p => p.category === category);
    }

    if (os) {
      packages = packages.filter(p => p.supportedOS.includes(os));
    }

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

/**
 * GET /api/servers/:id/packages
 * Get installed packages for a server
 */
router.get('/servers/:id/packages', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    const installations = await prisma.packageInstallation.findMany({
      where: { serverId },
      orderBy: { startedAt: 'desc' }
    });

    res.json({
      success: true,
      data: installations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installed packages'
    });
  }
});

/**
 * POST /api/servers/:id/packages/install
 * Install a package on a server
 */
router.post('/servers/:id/packages/install', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const { packageName, version } = req.body;

    // Get server with SSH credentials
    const server = await prisma.server.findFirst({
      where: { id: serverId, workspaceId },
      include: { cloudAccount: true }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    if (!server.cloudAccount.sshPrivateKey) {
      return res.status(400).json({
        success: false,
        message: 'SSH credentials not configured for this server'
      });
    }

    // Decrypt SSH credentials
    const privateKey = decryptSSHKey(server.cloudAccount.sshPrivateKey);
    const sshCredentials = {
      host: server.ipAddress,
      port: server.cloudAccount.sshPort || 22,
      username: server.cloudAccount.sshUsername,
      privateKey
    };

    // Create installer
    const installer = new PackageInstaller(
      server,
      sshCredentials,
      req.user.userId
    );

    // Start installation (non-blocking, continues via WebSocket)
    installer.install(packageName, version, null)
      .catch(err => {
        console.error('Package installation error:', err);
      });

    res.json({
      success: true,
      message: 'Installation started. Check the packages tab for progress.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/servers/:id/packages/:installId/log
 * Get installation log
 */
router.get('/servers/:id/packages/:installId/log', async (req, res) => {
  try {
    const serverId = parseInt(req.params.id);
    const installId = parseInt(req.params.installId);
    const workspaceId = req.user.workspaceId;

    const installation = await prisma.packageInstallation.findFirst({
      where: {
        id: installId,
        serverId,
        server: { workspaceId }
      }
    });

    if (!installation) {
      return res.status(404).json({
        success: false,
        message: 'Installation not found'
      });
    }

    res.json({
      success: true,
      data: {
        log: installation.installLog,
        status: installation.status,
        errorMsg: installation.errorMsg
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installation log'
    });
  }
});

/**
 * DELETE /api/servers/:id/packages/:installId
 * Uninstall a package
 */
router.delete('/servers/:id/packages/:installId', async (req, res) => {
  try {
    // Implementation for uninstall
    res.json({
      success: true,
      message: 'Package uninstall feature coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to uninstall package'
    });
  }
});

export default router;
```

#### **Update WebSocket Server (`backend/src/services/websocketServer.js`)**

Add new message types for package installation:

```javascript
// Handle package installation streaming
if (message.type === 'start_package_install') {
  const { serverId, packageName, version } = message;
  
  // Similar to log streaming, but for package installation
  // Stream installation progress to frontend
}
```

---

### **3. Frontend Implementation**

#### **New Component: `ServerPackagesTab.vue`**

```vue
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Software Packages</h2>
        <p class="text-gray-400 text-sm">Install and manage software on your server</p>
      </div>
      <button
        @click="refreshPackages"
        class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Installed Packages -->
    <div v-if="installedPackages.length > 0" class="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 class="text-lg font-bold text-white mb-4">📦 Installed Packages</h3>
      <div class="space-y-2">
        <div
          v-for="pkg in installedPackages"
          :key="pkg.id"
          class="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ getPackageIcon(pkg.packageName) }}</span>
            <div>
              <p class="text-white font-medium">{{ pkg.packageName }}</p>
              <p class="text-xs text-gray-400">Version: {{ pkg.packageVersion }}</p>
            </div>
          </div>
          <button
            @click="uninstallPackage(pkg)"
            class="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
          >
            Uninstall
          </button>
        </div>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="flex space-x-2 overflow-x-auto pb-2">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectedCategory = cat.id"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition',
          selectedCategory === cat.id
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        ]"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- Package Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="pkg in filteredPackages"
        :key="pkg.name"
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-3xl">{{ pkg.icon }}</span>
            <div>
              <h4 class="text-white font-bold">{{ pkg.displayName }}</h4>
              <p class="text-xs text-gray-500">{{ pkg.category }}</p>
            </div>
          </div>
        </div>

        <p class="text-sm text-gray-400 mb-4">{{ pkg.description }}</p>

        <!-- Version Selector -->
        <select
          v-if="Object.keys(pkg.versions).length > 1"
          v-model="selectedVersions[pkg.name]"
          class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mb-3"
        >
          <option v-for="ver in Object.keys(pkg.versions)" :key="ver" :value="ver">
            Version: {{ ver }}
          </option>
        </select>

        <!-- Install Button -->
        <button
          v-if="!isInstalled(pkg.name)"
          @click="installPackage(pkg)"
          :disabled="isInstalling(pkg.name)"
          class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          {{ isInstalling(pkg.name) ? '⏳ Installing...' : '✨ Install' }}
        </button>

        <!-- Installed Badge -->
        <div
          v-else
          class="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium text-center"
        >
          ✓ Installed
        </div>

        <!-- Dependencies Warning -->
        <div v-if="pkg.dependencies.length > 0" class="mt-2 text-xs text-yellow-400">
          ⚠️ Requires: {{ pkg.dependencies.join(', ') }}
        </div>
      </div>
    </div>

    <!-- Installation Log Modal -->
    <InstallationLogModal
      v-if="showInstallLog"
      :package-name="currentPackage"
      :logs="installationLogs"
      :status="installStatus"
      @close="showInstallLog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/api/client';
import InstallationLogModal from './InstallationLogModal.vue';

const props = defineProps({
  server: { type: Object, required: true }
});

const categories = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'container', name: 'Containers', icon: '🐳' },
  { id: 'language', name: 'Languages', icon: '⬢' },
  { id: 'database', name: 'Databases', icon: '🗄️' },
  { id: 'webserver', name: 'Web Servers', icon: '🔷' },
  { id: 'process-manager', name: 'Process Mgmt', icon: '📊' }
];

const selectedCategory = ref('all');
const availablePackages = ref([]);
const installedPackages = ref([]);
const selectedVersions = ref({});
const installingPackages = ref(new Set());

const showInstallLog = ref(false);
const currentPackage = ref(null);
const installationLogs = ref([]);
const installStatus = ref('installing');

const filteredPackages = computed(() => {
  if (selectedCategory.value === 'all') {
    return availablePackages.value;
  }
  return availablePackages.value.filter(p => p.category === selectedCategory.value);
});

async function loadPackages() {
  try {
    const [available, installed] = await Promise.all([
      apiClient.get('/packages'),
      apiClient.get(`/servers/${props.server.id}/packages`)
    ]);
    
    availablePackages.value = available.data.data;
    installedPackages.value = installed.data.data.filter(p => p.status === 'installed');

    // Set default versions
    availablePackages.value.forEach(pkg => {
      selectedVersions.value[pkg.name] = pkg.defaultVersion;
    });
  } catch (error) {
    console.error('Failed to load packages:', error);
  }
}

function isInstalled(packageName) {
  return installedPackages.value.some(p => p.packageName === packageName);
}

function isInstalling(packageName) {
  return installingPackages.value.has(packageName);
}

function getPackageIcon(packageName) {
  const pkg = availablePackages.value.find(p => p.name === packageName);
  return pkg?.icon || '📦';
}

async function installPackage(pkg) {
  try {
    installingPackages.value.add(pkg.name);
    currentPackage.value = pkg.name;
    showInstallLog.value = true;
    installationLogs.value = [];
    installStatus.value = 'installing';

    const response = await apiClient.post(
      `/servers/${props.server.id}/packages/install`,
      {
        packageName: pkg.name,
        version: selectedVersions.value[pkg.name]
      }
    );

    // Poll for installation status and logs
    pollInstallationStatus(pkg.name);

  } catch (error) {
    console.error('Installation failed:', error);
    installStatus.value = 'failed';
    installingPackages.value.delete(pkg.name);
  }
}

async function pollInstallationStatus(packageName) {
  // Poll every 2 seconds for installation progress
  const interval = setInterval(async () => {
    try {
      const response = await apiClient.get(`/servers/${props.server.id}/packages`);
      const installation = response.data.data.find(p => p.packageName === packageName);

      if (installation) {
        installationLogs.value = installation.installLog?.split('\n') || [];
        
        if (installation.status === 'installed') {
          installStatus.value = 'installed';
          installingPackages.value.delete(packageName);
          clearInterval(interval);
          loadPackages(); // Refresh
        } else if (installation.status === 'failed') {
          installStatus.value = 'failed';
          installingPackages.value.delete(packageName);
          clearInterval(interval);
        }
      }
    } catch (error) {
      console.error('Failed to poll installation status:', error);
      clearInterval(interval);
    }
  }, 2000);
}

function refreshPackages() {
  loadPackages();
}

onMounted(() => {
  loadPackages();
});
</script>
```

#### **Installation Log Modal (`InstallationLogModal.vue`)**

```vue
<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">
            {{ status === 'installing' ? '⏳' : status === 'installed' ? '✅' : '❌' }}
          </span>
          <div>
            <h3 class="text-xl font-bold text-white">
              {{ status === 'installing' ? 'Installing' : status === 'installed' ? 'Installed' : 'Failed' }}
              {{ packageName }}
            </h3>
            <p class="text-sm text-gray-400">Live installation log</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Log Output -->
      <div class="flex-1 overflow-y-auto p-6 bg-black font-mono text-sm">
        <div v-for="(line, index) in logs" :key="index" class="text-green-400">
          {{ line }}
        </div>
        <div v-if="status === 'installing'" class="text-yellow-400 animate-pulse">
          ▊ Installing...
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-700 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  packageName: String,
  logs: Array,
  status: String
});

defineEmits(['close']);
</script>
```

#### **Add Packages Tab to ServerDetailsModal.vue**

```vue
<!-- In ServerDetailsModal.vue -->
<button
  @click="activeTab = 'packages'"
  :class="[
    'py-4 px-1 border-b-2 font-medium text-sm transition relative',
    activeTab === 'packages'
      ? 'border-indigo-500 text-indigo-400'
      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
  ]"
>
  <div class="flex items-center space-x-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
    <span>Packages</span>
  </div>
</button>

<!-- Tab Content -->
<div v-else-if="activeTab === 'packages' && serverData" class="space-y-6">
  <ServerPackagesTab :server="serverData" />
</div>
```

---

## 📊 Implementation Phases

### **Phase 1: Core Infrastructure (Week 1)**
- ✅ Database schema (PackageInstallation, PackageDefinition)
- ✅ Package definitions JSON (10 initial packages)
- ✅ PackageInstaller service (SSH execution, OS detection)
- ✅ Basic API routes (list, install, status)

**Deliverable:** Can install Docker via API call

### **Phase 2: Frontend UI (Week 2)**
- ✅ ServerPackagesTab component
- ✅ Package cards with categories
- ✅ InstallationLogModal with live logs
- ✅ Installation history view

**Deliverable:** Full UI for package management

### **Phase 3: Package Library Expansion (Week 3)**
- ✅ Add 30-50 popular packages
- ✅ Multi-version support (Node.js 18.x, 20.x, 22.x)
- ✅ Dependency resolution
- ✅ Conflict detection (Apache vs Nginx)
- ✅ Health checks post-installation

**Deliverable:** Comprehensive package catalog

### **Phase 4: Advanced Features (Week 4)**
- ✅ Uninstall functionality
- ✅ One-click stacks (LAMP, MERN, etc.)
- ✅ Package update/upgrade
- ✅ Custom script support
- ✅ Analytics dashboard (most installed packages)

**Deliverable:** Production-ready feature

---

## 💰 Monetization Strategy

### **Free Tier:**
- 5 package installations per month per workspace
- Access to basic packages (Docker, Node.js, Nginx, PostgreSQL)

### **Pro Tier ($29/month):**
- Unlimited installations
- Access to all packages
- Priority support
- Custom scripts

### **Enterprise Tier ($99/month):**
- Everything in Pro
- One-click stacks
- Custom package definitions
- API access for automation
- Dedicated support

---

## 🚨 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Sudo password required** | 1. Store encrypted sudo password<br>2. Configure NOPASSWD for specific commands<br>3. Use SSH key with sudo access |
| **Different OS = different commands** | Maintain OS-specific scripts in packageDefinitions.json |
| **Package conflicts** | Check conflicts array before installation |
| **Long installations** | WebSocket + polling for status updates |
| **Failed installations** | Comprehensive error logging, rollback support |
| **Security concerns** | Run scripts in isolated environments, audit all scripts |

---

## 🔒 Security Considerations

1. **Script Validation:**
   - All scripts audited before adding to definitions
   - No user-provided scripts in MVP (Pro feature)
   - Sandbox execution where possible

2. **SSH Credentials:**
   - Reuse existing encrypted SSH credentials
   - Never log sensitive data

3. **Permissions:**
   - Request minimal sudo permissions
   - Clear warnings about what will be installed

4. **Audit Trail:**
   - Log all installations in PackageInstallation table
   - Track which user installed what

---

## 📈 Success Metrics

- **Installation Success Rate** - Target: >95%
- **Average Installation Time** - Track by package
- **Most Installed Packages** - Informs future priorities
- **User Engagement** - % of users using this feature
- **Conversion Rate** - Free to Pro due to package limits

---

## 🎯 Post-MVP Enhancements

1. **One-Click Stacks:**
   - LAMP (Linux + Apache + MySQL + PHP)
   - MEAN (MongoDB + Express + Angular + Node.js)
   - MERN (MongoDB + Express + React + Node.js)
   - Analytics Stack (Elasticsearch + Logstash + Kibana)

2. **Script Marketplace:**
   - Users share custom installation scripts
   - Community voting/rating
   - Revenue sharing for popular scripts

3. **Configuration Management:**
   - Not just install, but configure
   - Nginx vhost setup
   - Database initialization
   - SSL certificate installation

4. **Rollback Support:**
   - "Undo last installation"
   - Restore previous state

5. **Scheduled Updates:**
   - Auto-update packages
   - Security patch notifications

6. **Multi-Server Deployment:**
   - Install Docker on 10 servers at once
   - Cluster setups (Kubernetes, Hadoop)

---

## 📝 Notes

- This feature significantly differentiates CloudEvy from competitors
- Reduces time-to-value for new users (deploy app in minutes)
- Opens door to infrastructure-as-code offerings
- Natural upsell opportunity (free → pro)
- Consider partnerships with software vendors (promoted packages)

---

**Status:** 📋 Ready for Implementation  
**Next Steps:** Review with team, prioritize MVP packages, allocate development resources

