# ⚡ HDFS Cluster Setup - Quick Reference

## 🚀 Quick Start (Minimal Test Cluster)

### 1. Create Security Group
```
Name: hdfs-test-cluster
Inbound Rules:
  - All Traffic from sg-xxxxx (same group)
  - SSH (22) from Your IP
  - Custom TCP (8080) from Your IP [Optional - Ambari UI]
```

### 2. Launch 3 Servers
```
Master Node:
  - Instance: t3.small (2 vCPU, 2 GB RAM)
  - Storage: 20 GB gp3
  - Security Group: hdfs-test-cluster
  - Same VPC/Subnet

Worker Nodes (x2):
  - Instance: t3.small (2 vCPU, 2 GB RAM)
  - Storage: 20 GB root + 20 GB data volume
  - Security Group: hdfs-test-cluster
  - Same VPC/Subnet
```

### 3. Add Servers to CloudEvy
```
- Add SSH key
- Add all 3 servers
- Verify SSH connectivity
```

### 4. Create HDFS Cluster
```
Step 1: Pre-requisites ✓ (Review checklist)
Step 2: Distribution    → Select "Hortonworks HDP"
Step 3: Services        → Select "Minimal" preset (HDFS, YARN, Zookeeper)
Step 4: Configuration   → Name: "test-hdfs", Replication: 2x
Step 5: Nodes           → Master: 1 node, Workers: 2 nodes
Step 6: Review          → Click "Create Cluster"
```

---

## 🎯 Pre-requisites Checklist

### Before Creating Cluster:

#### ☐ 1. Security Group
- [ ] All nodes use SAME security group
- [ ] "All Traffic" rule from same security group (sg-xxxxx)
- [ ] SSH (22) access configured
- [ ] Optional: Ambari UI (8080), NameNode UI (50070), YARN UI (8088)

#### ☐ 2. Servers
- [ ] Minimum 3 servers (1 master + 2 workers)
- [ ] Master: t3.small or better (2 GB RAM, 2 CPU)
- [ ] Workers: t3.small or better (2 GB RAM, 2 CPU)
- [ ] Workers have data volumes attached (recommended)

#### ☐ 3. Network
- [ ] All servers in same VPC
- [ ] Preferably in same subnet
- [ ] Private IPs can communicate
- [ ] DNS resolution working

#### ☐ 4. SSH
- [ ] SSH key uploaded to CloudEvy
- [ ] Same SSH key on all servers
- [ ] User has sudo privileges (no password)
- [ ] All servers added to CloudEvy

#### ☐ 5. System (Auto-configured)
- [x] Java, Python, Ambari (CloudEvy installs automatically)
- [x] Firewall configuration (CloudEvy handles)
- [x] Hostname resolution (CloudEvy configures)

---

## 🔐 Security Group Quick Setup

### AWS Console → EC2 → Security Groups → Create

```yaml
Name: hdfs-cluster-sg
Description: HDFS cluster - all nodes

Inbound Rules:
  1. Type: All Traffic
     Source: sg-xxxxx (select this same security group)
     Description: Allow inter-cluster communication
  
  2. Type: SSH
     Port: 22
     Source: My IP
     Description: SSH access for management
  
  3. Type: Custom TCP
     Port: 8080
     Source: My IP
     Description: Ambari Web UI
  
  4. Type: Custom TCP
     Port: 50070
     Source: My IP
     Description: HDFS NameNode UI
  
  5. Type: Custom TCP
     Port: 8088
     Source: My IP
     Description: YARN ResourceManager UI
```

---

## 💻 Server Configuration Guide

### Minimum (Testing) - $53/month

| Role    | Instance   | vCPU | RAM  | Root | Data | Count |
|---------|------------|------|------|------|------|-------|
| Master  | t3.small   | 2    | 2 GB | 20GB | -    | 1     |
| Worker  | t3.small   | 2    | 2 GB | 20GB | 20GB | 2     |

**Total Cost:** ~$53/month (~$0.07/hour)
**Usable Storage:** ~8-10 GB (with 2x replication)

### Recommended (Production) - $200+/month

| Role    | Instance   | vCPU | RAM  | Root | Data  | Count |
|---------|------------|------|------|------|-------|-------|
| Master  | t3.medium  | 2    | 4 GB | 50GB | -     | 1     |
| Worker  | t3.large   | 2    | 8 GB | 50GB | 100GB | 3     |

**Total Cost:** ~$200+/month
**Usable Storage:** ~100-150 GB (with 3x replication)

---

## 🎛️ Service Selection Guide

### Minimal (Testing) - 15 min install
- HDFS
- YARN
- Zookeeper

### Basic (Development) - 25 min install
- HDFS
- YARN
- Zookeeper
- Spark
- Hive

### Full Stack (Production) - 40+ min install
- HDFS
- YARN
- Zookeeper
- Spark
- Hive
- HBase
- Kafka
- Flink
- Oozie

---

## ⚙️ Configuration Recommendations

### HDFS Settings

| Setting           | Testing | Production |
|-------------------|---------|------------|
| Replication       | 2       | 3          |
| Block Size        | 128 MB  | 128 MB     |
| Data Directory    | /data   | /data      |
| NameNode Dir      | /hadoop | /hadoop    |

### YARN Settings

| Setting           | Testing | Production |
|-------------------|---------|------------|
| Memory per Node   | 1-2 GB  | 4-8 GB     |
| CPU Cores per Node| 2       | 4-8        |
| Container Memory  | 512 MB  | 1-2 GB     |

---

## 🌐 Required Ports Reference

### Must Open (Internal - via Security Group)
```
All Traffic from same security group covers these automatically
```

### Should Open (External - for UI access)
```
8080   - Ambari Web UI
50070  - HDFS NameNode UI
8088   - YARN ResourceManager UI
```

### Complete Port List (Auto-configured via SG rule)
```
HDFS:       8020, 9000, 50070, 50010, 50020, 50075
YARN:       8088, 8030-8033, 8042
Zookeeper:  2181, 2888, 3888
Ambari:     8080, 8440, 8441, 6188
Spark:      8080, 18080, 7077, 8081
Hive:       10000, 10002, 9083
```

---

## ⏱️ Installation Timeline

### What Happens During Cluster Creation:

```
Minute 0-2:   📡 SSH validation and connectivity checks
Minute 2-5:   📦 Install Java, Python, system packages
Minute 5-10:  🎯 Install and configure Ambari Server
Minute 10-15: 🤝 Register all nodes with Ambari
Minute 15-25: 🐘 Install HDFS, YARN, Zookeeper
Minute 25-35: 🚀 Install optional services (Spark, Hive, etc.)
Minute 35-40: ✅ Start all services and validate cluster
```

**Total Time:** 15-40 minutes (depending on services selected)

---

## 🎬 Step-by-Step Wizard Flow

### Step 1: Pre-requisites
- Review all 5 checklist sections
- Verify security groups
- Confirm server specs
- Check network setup
- Validate SSH access
- ✓ Click "Next"

### Step 2: Distribution
- Select "Hortonworks HDP" (recommended)
- Or choose "Cloudera CDH" or "Apache Hadoop"
- ✓ Click "Next"

### Step 3: Services
- Choose a preset OR
- Select individual services
- Minimum 3 required: HDFS, YARN, Zookeeper
- ✓ Click "Next"

### Step 4: Configuration
- Enter cluster name
- Set HDFS replication factor (2-3)
- Set block size (128 MB recommended)
- Configure YARN resources
- ✓ Click "Next"

### Step 5: Node Assignment
- Select 1+ master nodes
- Select 2+ worker nodes
- Verify node counts
- ✓ Click "Next"

### Step 6: Review & Create
- Review all settings
- Check estimated time
- Verify cost estimates
- ✓ Click "Create Cluster" 🚀

---

## 📊 Live Monitoring

### During Installation:
- Watch live logs in the "Logs" tab
- See real-time progress
- Filter by server
- Error highlighting
- Auto-scroll to bottom

### After Installation:
- Access Ambari UI: `http://<master-ip>:8080`
- Default credentials: admin / admin
- Monitor cluster health
- View service status
- Check HDFS usage

---

## 🔍 Troubleshooting

### Installation Failed?

#### Check Security Group
```bash
# On master node
ping <worker1-private-ip>
ping <worker2-private-ip>
# Should get responses
```

#### Check SSH Access
```bash
# From CloudEvy
ssh -i your-key.pem ec2-user@<server-ip>
sudo -l
# Should show NOPASSWD: ALL
```

#### Check Ambari
```bash
# On master node
sudo ambari-server status
sudo ambari-agent status
# Should show running
```

### Services Not Starting?

#### Check Logs
```bash
# On master
sudo tail -f /var/log/ambari-server/ambari-server.log

# On workers
sudo tail -f /var/log/ambari-agent/ambari-agent.log
```

#### Restart Services
```bash
# Via Ambari UI
http://<master-ip>:8080
# Login → Services → Actions → Restart All
```

---

## 💡 Pro Tips

### Cost Optimization
- Use Spot Instances for non-critical clusters
- Stop clusters when not in use (save ~70%)
- Use gp3 volumes instead of gp2 (20% cheaper)
- Right-size instances based on actual usage

### Performance
- Use instances with enhanced networking
- Place all nodes in same availability zone
- Use placement groups for low latency
- Monitor YARN container sizes

### Security
- Change Ambari default password immediately
- Use security groups, not 0.0.0.0/0 for SSH
- Enable Kerberos for production clusters
- Regular security patches and updates

### Monitoring
- Set up CloudWatch alarms for disk usage
- Monitor HDFS replication health
- Track YARN queue utilization
- Set up log aggregation

---

## 🆘 Quick Commands

### Check Cluster Health
```bash
# HDFS status
hdfs dfsadmin -report

# YARN nodes
yarn node -list

# Service status
sudo systemctl status ambari-server
sudo systemctl status ambari-agent
```

### Basic HDFS Operations
```bash
# List files
hdfs dfs -ls /

# Create directory
hdfs dfs -mkdir /data

# Upload file
hdfs dfs -put localfile.txt /data/

# Download file
hdfs dfs -get /data/file.txt ./

# Check disk usage
hdfs dfs -du -h /
```

### Ambari Commands
```bash
# Restart Ambari Server
sudo ambari-server restart

# Restart Ambari Agent
sudo ambari-agent restart

# Reset Ambari Admin Password
sudo ambari-server setup --reset
```

---

## 📞 Support

### Need Help?
- Check live logs in CloudEvy UI
- Review Ambari UI for service status
- See detailed documentation in `/docs`
- Contact CloudEvy support

### Common Issues Resolved:
✅ Security group misconfiguration
✅ Insufficient server resources
✅ SSH connectivity problems
✅ Service startup failures
✅ Disk space issues

---

## 🎯 Success Checklist

### After Cluster Creation:
- [ ] All services show "Started" in Ambari
- [ ] HDFS report shows all DataNodes
- [ ] YARN shows all NodeManagers
- [ ] Can access Ambari UI at port 8080
- [ ] Can upload/download files to HDFS
- [ ] Changed default Ambari password

**Congratulations! Your HDFS cluster is ready! 🎉**

---

## 📚 Next Steps

1. **Upload Data:** Start uploading data to HDFS
2. **Run Jobs:** Submit YARN/Spark jobs
3. **Monitor:** Set up monitoring and alerts
4. **Scale:** Add more worker nodes as needed
5. **Backup:** Configure NameNode backup strategy
6. **Secure:** Enable Kerberos and SSL
7. **Optimize:** Tune HDFS and YARN configs

---

**Happy Clustering! 🐘🚀**
