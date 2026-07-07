# 🚀 Deploy Live Node Metrics Feature

## ✅ What Was Added

**New Feature:** Live node metrics display in the Cluster Details modal

**Changes:**
- ✅ Backend: New endpoint `GET /api/clusters/:id/nodes/live`
- ✅ Backend: kubectl installed in Docker container
- ✅ Frontend: Enhanced Nodes tab with live metrics
- ✅ Real-time CPU, Memory, and Pod count per node
- ✅ Node status (Ready/NotReady), role (master/worker)
- ✅ Refresh button to update metrics

---

## 📦 Deployment Instructions

### **Step 1: SSH into Production Server**

```bash
ssh -i your-key.pem ec2-user@your-server-ip
```

### **Step 2: Navigate to CloudEvy Directory**

```bash
cd /home/ec2-user/cloudevy
```

### **Step 3: Pull Latest Images**

```bash
# Pull latest backend (now includes kubectl)
docker-compose pull backend

# Pull latest frontend (updated Nodes UI)
docker-compose pull frontend
```

### **Step 4: Restart Services**

```bash
# Stop and remove old containers
docker-compose down backend frontend

# Start new containers
docker-compose up -d backend frontend
```

### **Step 5: Verify Deployment**

```bash
# Check if containers are running
docker-compose ps

# Check backend logs for kubectl
docker-compose logs backend | grep kubectl

# You should see: "Client Version: v1.xx.x"

# Follow live logs
docker-compose logs -f backend frontend
```

---

## 🧪 Testing the Feature

### **1. Open CloudEvy Dashboard**

Navigate to: `http://your-server-ip:8001`

### **2. Go to Clusters Page**

Click on **"Clusters"** in the sidebar

### **3. Open a Cluster**

Click **"View Details"** on any running cluster

### **4. Go to Nodes Tab**

Click the **"Nodes"** tab

### **5. Verify Node Metrics**

You should see:
- ✅ Node names (e.g., "Cluster-Master-Node", "workernode-1")
- ✅ Roles (Master/Worker badges)
- ✅ Status (Ready/NotReady)
- ✅ Internal IP addresses
- ✅ Kubelet versions
- ✅ OS information
- ✅ CPU Usage (may show 0% if metrics-server not installed)
- ✅ Memory Usage (may show 0% if metrics-server not installed)
- ✅ Pod counts (should show actual numbers)

### **6. Test Refresh Button**

Click the **"Refresh"** button to update metrics

---

## ⚠️ Important Notes

### **Security Group Requirements (CRITICAL!)**

For the live node metrics to work, the **CloudEvy backend server must be able to reach the K3s API server on port 6443**.

**Required Security Group Rule:**

On your **K3s master node's security group**, add:

```
Type: Custom TCP
Port: 6443
Source: Security Group of CloudEvy server (or CloudEvy server's IP)
Description: Allow CloudEvy to fetch node metrics
```

**Quick Check:**

```bash
# From your CloudEvy server, test connectivity to K3s master
nc -zv <k3s-master-public-ip> 6443

# Should see: "Connection to <ip> 6443 port [tcp/*] succeeded!"
# If timeout, security group needs to be fixed
```

**Without this rule, you'll see:**
- ⚠️ "Connection timeout: Unable to reach K3s API server" error
- Nodes tab will fall back to database values (no live metrics)

---

### **Metrics Server (Optional but Recommended)**

By default, K3s doesn't include metrics-server, so CPU and Memory will show as `0%`.

**To enable full metrics, run this on your K3s master node:**

```bash
# SSH into your K3s master node
ssh -i your-key.pem ec2-user@master-node-ip

# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For K3s, patch to allow insecure TLS (required for internal IPs)
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Verify metrics-server is running
kubectl get deployment metrics-server -n kube-system

# Wait 30 seconds, then test
kubectl top nodes
```

**After installing metrics-server:**
- CPU and Memory percentages will show real values
- Metrics update every 15-30 seconds

**Even without metrics-server, you still get:**
- ✅ Node status (Ready/NotReady)
- ✅ Pod counts
- ✅ Node information (IP, version, OS)

---

## 🐛 Troubleshooting

### **Problem: "Connection timeout: Unable to reach K3s API server"**

**This is the most common issue!**

**Root Cause:** CloudEvy backend cannot reach K3s master on port 6443

**Solution:**

1. **Check K3s master security group:**
   ```bash
   # On AWS Console
   # Go to EC2 → Instances → Select K3s master → Security tab
   # Check if port 6443 is open for CloudEvy server
   ```

2. **Add security group rule:**
   ```
   Type: Custom TCP
   Port: 6443
   Source: <CloudEvy-server-security-group-ID> or <CloudEvy-server-IP>/32
   Description: CloudEvy metrics access
   ```

3. **Test connectivity from CloudEvy server:**
   ```bash
   # SSH into CloudEvy server
   ssh -i key.pem ec2-user@cloudevy-server-ip
   
   # Test K3s master connectivity
   nc -zv <k3s-master-public-ip> 6443
   
   # Should see: "Connection succeeded!"
   ```

4. **Verify K3s is listening:**
   ```bash
   # SSH into K3s master
   sudo netstat -tulpn | grep 6443
   
   # Should see k3s listening on 0.0.0.0:6443
   ```

5. **Retry in CloudEvy:**
   - Go to Clusters → View Details → Nodes tab
   - Click "Refresh" button

---

### **Problem: "kubectl: not found" error in logs**

**Solution:** The new backend image with kubectl is not running.

```bash
# Force pull and recreate
docker-compose pull backend
docker-compose up -d --force-recreate backend
```

### **Problem: "Cluster kubeconfig not available"**

**Solution:** The cluster was created before kubeconfig was saved.

- Delete the old cluster
- Create a new cluster
- Kubeconfig will be automatically saved

### **Problem: "Failed to fetch live cluster node metrics"**

**Possible causes:**
1. Cluster API endpoint is unreachable
2. Kubeconfig is invalid
3. kubectl command timed out

**Check logs:**
```bash
docker-compose logs backend | grep -A 10 "live cluster nodes error"
```

### **Problem: Nodes show "0%" for CPU/Memory**

**This is normal!** Metrics-server is not installed by default.

**To fix:** Install metrics-server (see above)

### **Problem: Nodes list is empty**

**Possible causes:**
1. Cluster is still being created
2. Cluster creation failed
3. Nodes haven't joined yet

**Check cluster status:**
```bash
# On master node
kubectl get nodes

# Check if API is accessible
curl -k https://master-ip:6443
```

---

## 📊 What You'll See

### **Healthy Cluster (with metrics-server):**

```
┌─────────────────────────────────────────────────────────┐
│ Cluster-Master-Node          [master]    [Ready]        │
│ Internal IP: 172.31.15.74                               │
│ Version: v1.34.3+k3s1                                   │
│ OS: Amazon Linux 2023                                   │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────┐                   │
│  │ CPU     │  │ Memory   │  │ Pods │                   │
│  │  5%     │  │  12%     │  │  8   │                   │
│  └─────────┘  └──────────┘  └──────┘                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ workernode-1                 [worker]    [Ready]        │
│ Internal IP: 172.31.5.183                               │
│ Version: v1.34.3+k3s1                                   │
│ OS: Amazon Linux 2023                                   │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────┐                   │
│  │ CPU     │  │ Memory   │  │ Pods │                   │
│  │  3%     │  │  8%      │  │  5   │                   │
│  └─────────┘  └──────────┘  └──────┘                   │
└─────────────────────────────────────────────────────────┘
```

### **Without metrics-server (still useful!):**

```
┌─────────────────────────────────────────────────────────┐
│ Cluster-Master-Node          [master]    [Ready]        │
│ Internal IP: 172.31.15.74                               │
│ Version: v1.34.3+k3s1                                   │
│ OS: Amazon Linux 2023                                   │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────┐                   │
│  │ CPU     │  │ Memory   │  │ Pods │                   │
│  │  0%     │  │  0%      │  │  8   │                   │
│  └─────────┘  └──────────┘  └──────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Deployment Summary

```bash
# On your production server
cd /home/ec2-user/cloudevy
docker-compose pull backend frontend
docker-compose down backend frontend
docker-compose up -d backend frontend
docker-compose logs -f backend frontend

# On your K3s master (optional, for full metrics)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

---

## ✅ Deployment Complete!

Your CloudEvy instance now has:
- ✅ Live node monitoring
- ✅ Real-time metrics (CPU, Memory, Pods)
- ✅ Node status tracking
- ✅ Beautiful UI with refresh capability

**Enjoy your enhanced Kubernetes management experience!** 🎉

