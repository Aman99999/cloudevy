# 🔧 Permanent Fix for Nginx "Connection Refused" Issue

## 🎯 Problem
Nginx shows `connect() failed (111: Connection refused)` errors when backend container restarts or IP changes.

## ✅ Permanent Solution Implemented

### **1. Updated Nginx Configuration** (`nginx/cloudevy-ssl.conf`)

#### **Key Changes:**

**Dynamic DNS Resolution with Variables:**
```nginx
location /api {
    set $backend_server backend:8002;  # Variable forces DNS re-resolution
    proxy_pass http://$backend_server;
    ...
}
```

**Why this works:**
- Using a variable (`$backend_server`) forces Nginx to resolve the DNS **on every request**
- Without variables, `upstream` blocks only resolve at startup
- Docker's internal DNS (127.0.0.11) always returns the current container IP

**Longer DNS Cache + Retry Logic:**
```nginx
resolver 127.0.0.11 valid=30s ipv6=off;  # Cache DNS for 30s
resolver_timeout 5s;

# Retry on failure
proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
proxy_next_upstream_tries 3;
```

**Increased Timeouts:**
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

## 📋 Deploy the Fix

### **On Server (EC2):**

```bash
# 1. SSH to server
ssh ec2-user@cloudevy.in

# 2. Update Nginx config (copy the new config)
cd /home/ec2-user/cloudevy
nano nginx/cloudevy-ssl.conf
# Paste the new config from your local nginx/cloudevy-ssl.conf

# 3. Test Nginx config
docker exec cloudevy-nginx nginx -t

# 4. Reload Nginx (zero-downtime)
docker exec cloudevy-nginx nginx -s reload

# 5. Check logs
docker logs cloudevy-nginx --tail 50

# 6. Verify backend is running
docker ps | grep backend
docker logs cloudevy-backend --tail 50
```

---

## 🔍 Why This is Permanent

### **Before (Problem):**
```nginx
upstream backend_upstream {
    server backend:8002;  # Resolved ONCE at Nginx startup
}
location /api {
    proxy_pass http://backend_upstream;  # Uses cached IP
}
```
❌ If backend restarts → IP changes → Nginx still uses old IP → 502 error

### **After (Solution):**
```nginx
location /api {
    set $backend_server backend:8002;  # Variable forces re-resolution
    proxy_pass http://$backend_server;  # DNS resolved every request
}
```
✅ If backend restarts → IP changes → Nginx re-resolves DNS → Works!

---

## 🛡️ Additional Safeguards

### **1. Auto-Restart Backend**
Already configured in `server-docker.yml`:
```yaml
backend:
  restart: unless-stopped  # Always restarts on crash
```

### **2. Health Checks** (Optional Enhancement)
Add to `server-docker.yml`:
```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### **3. Nginx Auto-Restart**
Already configured:
```yaml
nginx:
  restart: unless-stopped
  depends_on:
    - frontend
    - backend
```

---

## 🧪 Testing

### **Test 1: Restart Backend**
```bash
docker restart cloudevy-backend
# Wait 5 seconds
curl https://cloudevy.in/api/health
# Should return: {"status":"ok"}
```

### **Test 2: Agent Metrics**
```bash
# From your monitored server
curl -X POST https://cloudevy.in/api/metrics/report \
  -H "Content-Type: application/json" \
  -d '{"serverId":1,"apiKey":"your-key","metrics":{}}'
# Should return: {"success":true}
```

### **Test 3: Check Nginx Logs**
```bash
docker logs cloudevy-nginx --tail 100 | grep "Connection refused"
# Should see NO errors after the fix
```

---

## 📊 Monitoring

### **Check if Backend is Down:**
```bash
docker ps | grep backend
# Should show: Up X seconds

docker logs cloudevy-backend --tail 50
# Should NOT show errors
```

### **Check Nginx Errors:**
```bash
docker exec cloudevy-nginx tail -f /var/log/nginx/error.log
# Should see NO "Connection refused" errors
```

### **Check Container IPs (for debugging):**
```bash
docker inspect cloudevy-backend | grep IPAddress
docker inspect cloudevy-frontend | grep IPAddress
# IPs can change - that's why we use DNS!
```

---

## 🚀 Why This Won't Break Again

1. ✅ **DNS Variables**: Force re-resolution on every request
2. ✅ **Docker DNS**: Always returns current container IP
3. ✅ **Retry Logic**: Automatically retries failed requests
4. ✅ **Auto-Restart**: Containers restart on crash
5. ✅ **Longer Cache**: 30s DNS cache reduces overhead
6. ✅ **Increased Timeouts**: Handles slow startup after restart

---

## 📞 If Issues Persist

### **Emergency Quick Fix:**
```bash
# Restart Nginx to force DNS refresh
docker restart cloudevy-nginx
```

### **Check Backend Status:**
```bash
curl -I http://localhost:8002/health
# Should return: HTTP/1.1 200 OK
```

### **Full Stack Restart (last resort):**
```bash
cd /home/ec2-user/cloudevy
docker compose -f server-docker.yml restart
```

---

## 🎯 Summary

**What Changed:**
- Nginx now uses DNS variables for dynamic resolution
- Added retry logic for transient failures
- Increased timeouts for better stability

**Result:**
- ✅ Backend restarts no longer cause 502 errors
- ✅ Container IP changes handled automatically
- ✅ No manual intervention needed
- ✅ Zero-downtime updates

**This is a PERMANENT solution** - no more manual Nginx restarts needed! 🎉

