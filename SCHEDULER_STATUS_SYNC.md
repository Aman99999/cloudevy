# ✅ Scheduler Status Synchronization

## Problem

When the **scheduler** stops/starts a machine:
- ✅ AWS instance state changes (stopped/running)
- ❌ Database status stays the same (running/stopped)
- ❌ Frontend shows old status until manual refresh

**Example:**
```
6:30 PM: Scheduler stops machine
AWS: running → stopped ✅
DB:  running → running ❌
UI:  shows "running" ❌
```

---

## Solution

### 1. **Scheduler Updates Database** (`downtime-scheduler/src/executor.js`)

After executing an action, the scheduler now updates the server status:

```javascript
// Execute action (stop/start/reboot)
await executeAWSAction(schedule);

// Update database status
await updateServerStatus(schedule.server.id, schedule.action);
// stop   → status: 'stopping'
// start  → status: 'starting'
// reboot → status: 'rebooting'
```

### 2. **Frontend Auto-Polls Transitional States** (`frontend/src/views/Servers.vue`)

Every **10 seconds**, the frontend checks all servers with transitional statuses:

```javascript
onMounted(() => {
  // Auto-poll every 10 seconds
  setInterval(() => {
    servers
      .filter(s => ['stopping', 'starting', 'rebooting'].includes(s.status))
      .forEach(server => {
        // Fetch real AWS status
        apiClient.get(`/servers/${server.id}/status`)
        // Update UI if changed
      })
  }, 10000)
})
```

---

## Flow Diagram

### **Scheduler-Initiated Stop:**

```
18:30:00 IST | Scheduler executes "stop" schedule
             ↓
18:30:01     | AWS API: StopInstances(i-xxx)
             ↓
18:30:02     | Database: status = 'stopping' ✅
             ↓
18:30:05     | Frontend auto-poll detects 'stopping'
             ↓
18:30:10     | Frontend polls AWS: status = 'stopping'
18:30:20     | Frontend polls AWS: status = 'stopping'
18:30:30     | Frontend polls AWS: status = 'stopped' ✅
             ↓
18:30:30     | UI updates: 'stopping' → 'stopped' ✅
             | Toast: "Server stopped" 🎉
```

### **User-Initiated Stop:**

```
User clicks "Stop" button
             ↓
Backend API: StopInstances(i-xxx)
Database: status = 'stopping'
             ↓
Frontend starts polling immediately (every 4 seconds)
             ↓
When status = 'stopped':
  - UI updates
  - Toast: "Server stopped" 🎉
```

---

## Key Features

✅ **Scheduler updates database** after actions  
✅ **Frontend auto-polls** every 10 seconds for transitional states  
✅ **User-initiated actions** poll every 4 seconds (faster)  
✅ **Toast notifications** when state changes  
✅ **No page refresh needed**  
✅ **Works for both scheduler and manual actions**

---

## Timeline Comparison

### **Before (❌):**
```
18:30:00 | Scheduler stops machine
18:30:05 | AWS: stopped
         | DB:  running ❌
         | UI:  running ❌
         
User refreshes page manually
         | DB:  running ❌
         | UI:  running ❌
         
User waits 30 seconds for metrics refresh
18:30:35 | Metrics fetch fails (server offline)
         | Still shows "running" ❌
```

### **After (✅):**
```
18:30:00 | Scheduler stops machine
18:30:02 | DB:  stopping ✅
18:30:05 | Frontend auto-poll detects 'stopping'
18:30:10 | Frontend polls AWS
18:30:20 | Frontend polls AWS
18:30:30 | AWS: stopped ✅
         | DB:  stopped ✅ (backend updates on status fetch)
         | UI:  stopped ✅
         | Toast: "Server stopped" 🎉
```

---

## Deployment

```bash
# 1. Build
./build-images.sh

# 2. Push
./push-images.sh

# 3. Deploy on server
ssh ec2-user@cloudevy.in
cd cloudevy
./pull-images.sh
```

---

## Testing

### **Test Scheduled Stop:**
1. Create a schedule for **current time + 2 minutes**
2. Wait for scheduler to execute
3. Watch the UI update automatically (no refresh needed)
4. You should see:
   - Status changes: `running` → `stopping` → `stopped`
   - Toast: "Server stopped"
   - Start button appears

### **Test Scheduled Start:**
1. Create a schedule to start stopped server
2. Wait for execution
3. Watch UI update: `stopped` → `starting` → `running`
4. Toast: "Server started"
5. Metrics appear after 2 seconds

---

## Monitoring

### **Scheduler Logs:**
```bash
docker logs -f cloudevy-downtime-scheduler
```

**Expected output:**
```
▶️  Executing schedule: Nightly Shutdown (ID: 12)
🎯 Executing: stop on server "test1" (ID: 8)
   🔑 Decrypting credentials for cloud account ID: 2
   ✅ Credentials validated, region: ap-south-1
   Current state: running
   ⏹️  Stop command sent for instance i-xxx
   📊 Database status updated to: stopping ✅
✅ Success: stop completed in 1234ms
```

### **Frontend Console:**
```
🔄 Auto-polling 1 server(s) in transitional state
   test1: stopping → stopped
```

---

## Benefits

1. ✅ **Real-time updates** (10-second polling)
2. ✅ **No manual refresh needed**
3. ✅ **Works for scheduler AND manual actions**
4. ✅ **User-friendly toast notifications**
5. ✅ **Database stays in sync with AWS**
6. ✅ **Handles edge cases** (refresh during transition)

🎯 **Your UI will now stay perfectly in sync with AWS!**

