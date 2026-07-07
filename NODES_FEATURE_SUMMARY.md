# ✅ Live Node Metrics Feature - Complete Fix

## 🎯 Summary

**Issue:** Backend couldn't fetch live node metrics due to:
1. ❌ kubectl timeout (10s → 35s)
2. ❌ Security group blocking port 6443 from CloudEvy server
3. ❌ Poor error messages

**Fixed:**
1. ✅ Increased kubectl timeout to 35 seconds
2. ✅ Added connectivity pre-check before fetching nodes
3. ✅ Better error messages with troubleshooting hints
4. ✅ Added `--request-timeout` flag to kubectl commands
5. ✅ Created helper scripts and documentation

---

## 📦 What's Been Deployed

**Docker Images Updated:**
- ✅ `cloudevy/cloudevy-backend:latest` (with kubectl installed + timeout fixes)
- ✅ `cloudevy/cloudevy-frontend:latest` (enhanced Nodes UI)

**New Files Created:**
- ✅ `DEPLOY_NODES_FEATURE.md` - Complete deployment guide
- ✅ `deploy-nodes.sh` - Quick deployment script
- ✅ `check-k3s-connectivity.sh` - Connectivity troubleshooting tool

---

## 🚀 Deploy to Production Server

### **Option 1: Quick Deploy (Recommended)**

```bash
# SSH into CloudEvy production server
ssh -i your-key.pem ec2-user@your-cloudevy-server

# Run quick deploy
cd /home/ec2-user/cloudevy
docker-compose pull backend frontend
docker-compose up -d backend frontend

# Watch logs
docker-compose logs -f backend
```

### **Option 2: Using Deploy Script**

```bash
# Copy deploy-nodes.sh to server
scp -i your-key.pem deploy-nodes.sh ec2-user@your-cloudevy-server:/home/ec2-user/cloudevy/

# SSH and run
ssh -i your-key.pem ec2-user@your-cloudevy-server
cd /home/ec2-user/cloudevy
chmod +x deploy-nodes.sh
./deploy-nodes.sh
```

---

## 🔧 Critical: Fix Security Group

**The live metrics WILL NOT WORK until you fix the security group!**

### **What to Do:**

1. **Go to AWS Console → EC2 → Security Groups**

2. **Find your K3s master node's security group**

3. **Add Inbound Rule:**
   ```
   Type: Custom TCP
   Port: 6443
   Source: <your-cloudevy-server-security-group-id>
   Description: CloudEvy live metrics access
   ```

4. **Save**

### **Test Connectivity:**

```bash
# On CloudEvy server
cd /home/ec2-user/cloudevy

# Copy and run connectivity checker
# (First copy check-k3s-connectivity.sh to server)
chmod +x check-k3s-connectivity.sh
./check-k3s-connectivity.sh
```

---

## 🧪 Testing After Deployment

### **1. Verify Backend Has kubectl**

```bash
docker exec cloudevy-backend kubectl version --client

# Should show: Client Version: v1.xx.x
```

### **2. Check Backend Logs**

```bash
docker-compose logs backend | tail -50

# Look for: "Testing K3s API connectivity..."
# Should see: "✅ K3s API is reachable for cluster XX"
```

### **3. Test in UI**

1. Open CloudEvy: `http://your-server:8001`
2. Go to **Clusters** page
3. Click **"View Details"** on a running cluster
4. Click **"Nodes"** tab
5. Click **"Refresh"** button

**Expected Results:**

**✅ If Working:**
- Nodes load within 5-10 seconds
- Shows node names, roles, status
- Shows pod counts
- CPU/Memory show 0% (or real values if metrics-server installed)

**❌ If Failing:**
- Error message: "Connection timeout: Unable to reach K3s API server..."
- **Fix:** Add security group rule (see above)

---

## 📊 What You'll See

### **Without Metrics Server (Default):**

```
┌─────────────────────────────────────────────────────────┐
│ Cluster-Master-Node          [master]    [Ready]        │
│ Internal IP: 172.31.15.74                               │
│ Version: v1.34.3+k3s1                                   │
│ OS: Amazon Linux 2023                                   │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────┐                   │
│  │ CPU     │  │ Memory   │  │ Pods │                   │
│  │  0%     │  │  0%      │  │  8   │   ← Real number!  │
│  └─────────┘  └──────────┘  └──────┘                   │
└─────────────────────────────────────────────────────────┘
```

### **With Metrics Server (Recommended):**

```bash
# Install metrics-server on K3s master
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Wait 30 seconds, then refresh in UI
```

```
┌─────────────────────────────────────────────────────────┐
│ Cluster-Master-Node          [master]    [Ready]        │
│ Internal IP: 172.31.15.74                               │
│ Version: v1.34.3+k3s1                                   │
│ OS: Amazon Linux 2023                                   │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────┐                   │
│  │ CPU     │  │ Memory   │  │ Pods │                   │
│  │  5%     │  │  12%     │  │  8   │   ← All real!     │
│  └─────────┘  └──────────┘  └──────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### **Error: "Connection timeout: Unable to reach K3s API server"**

**Cause:** Security group not configured

**Fix:**
1. Add port 6443 inbound rule to K3s master security group
2. Source: CloudEvy server's security group or IP
3. Test with `nc -zv <k3s-master-ip> 6443`
4. Retry in CloudEvy UI

### **Error: "kubectl: not found"**

**Cause:** Old backend image

**Fix:**
```bash
docker-compose pull backend
docker-compose up -d backend
docker exec cloudevy-backend kubectl version --client
```

### **Error: "Cluster kubeconfig not available"**

**Cause:** Cluster created with old version

**Fix:**
1. Delete old cluster in CloudEvy
2. Create new cluster
3. Kubeconfig will be saved automatically

### **Nodes show but metrics are 0%**

**Cause:** Metrics-server not installed (this is normal!)

**Fix (optional):**
```bash
# SSH to K3s master
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

---

## 📝 Quick Reference

### **Deploy Commands**
```bash
cd /home/ec2-user/cloudevy
docker-compose pull backend frontend
docker-compose up -d backend frontend
docker-compose logs -f backend
```

### **Test Connectivity**
```bash
nc -zv <k3s-master-ip> 6443
docker exec cloudevy-backend kubectl version --client
```

### **Check Backend Logs**
```bash
docker-compose logs backend | grep "K3s API"
docker-compose logs backend | grep "live cluster nodes"
```

### **Install Metrics Server**
```bash
# On K3s master
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
kubectl get deployment metrics-server -n kube-system
```

---

## ✅ Checklist

Before testing in UI:
- [ ] Backend image updated (`docker-compose pull backend`)
- [ ] Backend container restarted (`docker-compose up -d backend`)
- [ ] kubectl installed in backend (`docker exec cloudevy-backend kubectl version --client`)
- [ ] Security group allows port 6443 from CloudEvy server
- [ ] Connectivity test passes (`nc -zv master-ip 6443`)

After deployment:
- [ ] Open CloudEvy UI
- [ ] Go to Clusters → View Details → Nodes tab
- [ ] See nodes with status and pod counts
- [ ] (Optional) Install metrics-server for CPU/Memory
- [ ] Click Refresh to update metrics

---

## 🎉 You're All Set!

Your CloudEvy instance now has live node monitoring with:
- ✅ Real-time node status (Ready/NotReady)
- ✅ Pod counts per node
- ✅ Node information (IP, version, OS)
- ✅ CPU/Memory metrics (after metrics-server installation)
- ✅ Manual refresh capability
- ✅ Beautiful responsive UI
- ✅ Helpful error messages

**Enjoy monitoring your K3s clusters!** 🚀

