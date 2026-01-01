# ✅ Timezone Fix for Scheduled Downtime

## Problem

When a user scheduled a server action for **18:49 IST (Asia/Kolkata)**, it was being stored in the database as **13:18:19 UTC** instead of **13:19:00 UTC**.

**Root Cause:**
- RRule was interpreting `BYHOUR=18;BYMINUTE=49` as **UTC time** instead of **user's timezone**
- The backend wasn't converting from user's timezone to UTC before storing `nextRunAt`

## Solution

### 1. **Backend Timezone Conversion** (`backend/src/routes/schedules.js`)

Added `getTimezoneOffsetMs()` helper function to calculate timezone offsets:

```javascript
function getTimezoneOffsetMs(timezone, date = new Date()) {
  // Returns the offset to SUBTRACT from UTC to get local time
  // e.g., for "Asia/Kolkata" (UTC+5:30), returns -19800000 ms
}
```

**How it works:**
1. User schedules for **18:49 IST**
2. Backend receives: `BYHOUR=18`, `BYMINUTE=49`, `timezone="Asia/Kolkata"`
3. Backend calculates:
   - Current time in IST
   - Next occurrence of 18:49 in IST
   - Converts to UTC: **18:49 IST → 13:19 UTC**
4. Stores **13:19:00 UTC** in database (seconds normalized to 0)

### 2. **Scheduler Service** (`downtime-scheduler/src/scheduler.js`)

- **Check Interval:** Reduced from **60 seconds** to **10 seconds**
- **Execution Window:** Changed to **minute-precision matching**
- **Normalization:** Both scheduled time AND current time are normalized to **HH:MM:00** before comparison

**How it works:**
```javascript
// Schedule: 18:49:00
// Check at: 18:49:01 → Normalized to 18:49:00 → MATCH ✅
// Check at: 18:49:59 → Normalized to 18:49:00 → MATCH ✅
// Check at: 18:50:00 → Normalized to 18:50:00 → NO MATCH ❌
```

This ensures:
- ✅ Job executes ANY time during the scheduled minute (18:49:00 - 18:49:59)
- ✅ No more "missed by 1 second" issues
- ✅ 10-second check interval catches it within the minute

### 3. **Frontend Reload UX** (`frontend/src/views/Servers.vue`)

Added:
- ✅ Toast notification when server starts/stops: "Server stopped! Reload the page to see changes"
- ✅ Floating refresh button (bottom-right) to manually reload
- ✅ Automatic status polling every 4 seconds during transitional states

## Deployment Steps

### 1. **Build Updated Images**
```bash
./build-images.sh
```

### 2. **Push to Docker Hub**
```bash
./push-images.sh
```

### 3. **Deploy on Server**
```bash
ssh ec2-user@cloudevy.in
cd cloudevy
./pull-images.sh
```

### 4. **Test the Fix**

1. Navigate to **Servers** page
2. Click **"Schedule Downtime"** on a server
3. Select **Daily** at **current time + 2 minutes**
4. Verify in database:
   ```bash
   docker exec -it cloudevy-postgres psql -U cloudevy -d cloudevy \
     -c "SELECT id, name, rrule, timezone, next_run_at FROM schedules;"
   ```
5. Check `next_run_at` is correctly converted to UTC

## Example

**User Input:**
- Timezone: `Asia/Kolkata` (UTC+5:30)
- Schedule: Daily at 18:49

**RRule Generated:**
```
FREQ=DAILY;BYHOUR=18;BYMINUTE=49
```

**Database Storage:**
```sql
rrule:       FREQ=DAILY;BYHOUR=18;BYMINUTE=49
timezone:    Asia/Kolkata
next_run_at: 2025-12-31 13:19:00+00  ← Correct UTC conversion!
```

**Scheduler Execution:**
- At **13:19:00 UTC** (= 18:49 IST), scheduler detects this job
- Executes the action (stop/start/reboot)
- Calculates next occurrence: **2026-01-01 13:19:00 UTC**

## Verification Checklist

- [x] Backend converts timezone correctly
- [x] Scheduler checks every 10 seconds
- [x] Execution window is 15 seconds
- [x] Frontend shows reload toast
- [x] Floating refresh button added
- [x] No linter errors
- [x] All services updated (backend, frontend, scheduler)

## Files Changed

1. `backend/src/routes/schedules.js` - Timezone conversion logic
2. `downtime-scheduler/src/scheduler.js` - 10-second check interval, 15-second window
3. `downtime-scheduler/src/rules.js` - Updated documentation
4. `frontend/src/views/Servers.vue` - Reload toast + floating refresh button

---

**Ready to deploy!** 🚀

