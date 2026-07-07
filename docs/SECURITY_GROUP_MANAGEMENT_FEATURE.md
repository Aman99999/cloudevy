# CloudEvy Security Group Management Feature

**Date:** January 7, 2026  
**Status:** Planned for Future Implementation  
**Priority:** High (Phase 1), Medium (Phase 2-4)

---

## 💬 Feature Overview

**User:** Can we manage AWS security groups from CloudEvy so users don't need to go to AWS Console?

**Assistant:** Yes! Absolutely possible. CloudEvy already has AWS credentials and SDK access. We can automate:
- Security group management
- Adding/removing inbound/outbound rules
- Auto-configuring ports for K3s clusters
- One-click port opening for common services
- Smart suggestions based on detected services

---

## 🎯 Why This Feature is Important

### Problem We Faced Today
During K3s cluster creation, we had to manually:
1. Go to AWS Console
2. Find the security group
3. Add port 6443 inbound rule (internal cluster communication)
4. Add port 6443 for external kubectl access (from user's IP)
5. Come back to CloudEvy

**This broke the flow and required AWS knowledge.**

### Solution
CloudEvy should detect missing ports and auto-configure them, or offer one-click configuration.

---

## 📋 Implementation Phases

### **Phase 1: Auto-Configure K3s Security** ⭐ (Must-Have)
**Estimated Time:** 2-3 days  
**Priority:** High

**What to Build:**
1. When creating K3s cluster, check if port 6443 is open between nodes
2. If not, show modal:
   ```
   🔐 Security Configuration Required
   
   Your K3s cluster needs port 6443 open for internal communication.
   
   [✓] Open port 6443 between cluster nodes (Required)
   [✓] Open port 6443 for external kubectl access (Optional)
       Source: [My IP ▼] [Custom IP]
   
   [ Configure Automatically ]  [ Manual Setup ]
   ```
3. If user clicks "Configure Automatically":
   - Add inbound rule: Port 6443, Source: Same Security Group
   - Add inbound rule: Port 6443, Source: User's IP (if selected)
4. Proceed with cluster creation

**Benefits:**
- ✅ Eliminates manual AWS Console steps
- ✅ Prevents cluster creation failures
- ✅ Educates users about security requirements
- ✅ Better UX - everything in one place

**AWS Permissions Needed:**
```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeSecurityGroups",
    "ec2:AuthorizeSecurityGroupIngress"
  ],
  "Resource": "*"
}
```

---

### **Phase 2: Security Group Viewer** 
**Estimated Time:** 2 days  
**Priority:** Medium

**What to Build:**
New page: `Networking → Security Groups`

**Features:**
- List all security groups for workspace
- Show inbound rules (protocol, port, source, description)
- Show outbound rules
- Show which instances use each security group
- Filter and search capabilities

**UI Mockup:**
```
Security Groups
─────────────────────────────────────────────────
┌─ launch-wizard-1 (sg-0abc123def456789) ─────┐
│ Used by: 3 servers                            │
│                                               │
│ Inbound Rules:                                │
│ ┌────────────────────────────────────────┐  │
│ │ Type    Port  Source           Desc.   │  │
│ │ SSH     22    0.0.0.0/0       SSH      │  │
│ │ HTTP    80    0.0.0.0/0       Web      │  │
│ │ Custom  6443  sg-0abc...      K3s      │  │
│ └────────────────────────────────────────┘  │
│                                               │
│ [View Details] [Edit Rules]                   │
└───────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Users understand their security configuration
- ✅ No need to open AWS Console
- ✅ Visual representation of rules

---

### **Phase 3: Rule Management**
**Estimated Time:** 3-4 days  
**Priority:** Medium

**What to Build:**
Add/edit/delete security group rules from CloudEvy UI

**Features:**
1. **Quick Buttons for Common Ports:**
   ```
   Common Ports:
   [Open HTTP (80)]  [Open HTTPS (443)]  [Open SSH (22)]
   [Open PostgreSQL] [Open MySQL]  [Open MongoDB]
   ```

2. **Custom Rule Form:**
   ```
   Add Inbound Rule
   ─────────────────────────────────
   Type:     [Custom TCP ▼]
   Protocol: TCP
   Port:     [____]
   Source:   [My IP ▼]  or  [Custom: ____]
   Desc:     [________________]
   
   [Add Rule]
   ```

3. **"My IP" Auto-Detection:**
   - Automatically detect user's current IP
   - Offer as default for external access rules

4. **Delete Rules:**
   - One-click delete with confirmation
   - Show warning if rule might break running services

**Security Features:**
- ⚠️ Warn before opening 0.0.0.0/0 on sensitive ports
- ⚠️ Require confirmation for dangerous changes
- 🔒 Audit log all changes (who, when, what)
- 🔒 Only workspace admins can modify

**Benefits:**
- ✅ Complete security management from CloudEvy
- ✅ Safer than AWS Console (warnings and validations)
- ✅ Audit trail for compliance

---

### **Phase 4: Smart Suggestions**
**Estimated Time:** 2-3 days  
**Priority:** Low (Nice to Have)

**What to Build:**
Context-aware port suggestions based on detected services

**Examples:**

1. **Detect Running Services:**
   ```
   💡 Smart Suggestion
   
   We detected Node.js running on port 3000.
   This port is not publicly accessible.
   
   [Open port 3000 for HTTP traffic]  [Ignore]
   ```

2. **Database Detection:**
   ```
   💡 Database Detected
   
   PostgreSQL is running on this server.
   For security, we recommend:
   
   [✓] Open port 5432 only for application servers
       Select servers: [app-server-1 ▼]
   
   [ Configure ]
   ```

3. **Load Balancer Suggestion:**
   ```
   💡 Optimization Suggestion
   
   You have 3 web servers with port 80 open.
   Consider creating a load balancer.
   
   [Create Load Balancer]  [Not Now]
   ```

**Benefits:**
- ✅ Proactive security guidance
- ✅ Helps beginners learn best practices
- ✅ Prevents misconfigurations
- ✅ Unique feature - competitors don't have this!

---

## 🔧 Technical Implementation

### Backend Structure

**New Route File:** `backend/src/routes/securityGroups.js`

```javascript
// GET /api/security-groups - List all security groups
router.get('/', authenticate, async (req, res) => {
  // Get all SGs for workspace's cloud accounts
  // Return with current rules and attached instances
});

// GET /api/security-groups/:id - Get specific security group
router.get('/:id', authenticate, async (req, res) => {
  // Return detailed info about one SG
});

// POST /api/security-groups/:id/rules - Add inbound rule
router.post('/:id/rules', authenticate, async (req, res) => {
  // Add new inbound rule
  // Validate and log in audit_logs
  // Use AWS SDK: AuthorizeSecurityGroupIngressCommand
});

// DELETE /api/security-groups/:id/rules - Remove rule
router.delete('/:id/rules', authenticate, async (req, res) => {
  // Remove inbound rule
  // Warn if removing critical rule (SSH, etc.)
  // Log in audit_logs
  // Use AWS SDK: RevokeSecurityGroupIngressCommand
});

// POST /api/clusters/:id/configure-security - Auto-configure for cluster
router.post('/clusters/:id/configure-security', authenticate, async (req, res) => {
  // Called during cluster creation
  // Checks if port 6443 is open
  // Adds rules if needed
});
```

**AWS SDK Usage:**
```javascript
import { 
  EC2Client,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand
} from '@aws-sdk/client-ec2';

// Example: Add port 6443 for K3s
const command = new AuthorizeSecurityGroupIngressCommand({
  GroupId: securityGroupId,
  IpPermissions: [{
    IpProtocol: 'tcp',
    FromPort: 6443,
    ToPort: 6443,
    UserIdGroupPairs: [{ 
      GroupId: securityGroupId  // Self-reference for internal access
    }]
  }]
});

await ec2Client.send(command);
```

### Frontend Structure

**New Component:** `frontend/src/views/SecurityGroups.vue`
- List all security groups
- Show rules in table format
- Add/edit/delete actions

**New Component:** `frontend/src/components/SecurityGroupRuleModal.vue`
- Form to add new rules
- Quick buttons for common ports
- Validation and warnings

**Update Existing:** `frontend/src/components/CreateClusterModal.vue`
- Add security configuration step
- Check port availability before cluster creation
- Offer auto-configuration

---

## 🎯 Competitive Advantage

### Comparison with Competitors

| Feature | AWS Console | CloudEvy (After Implementation) | DigitalOcean | Linode |
|---------|-------------|--------------------------------|--------------|--------|
| View Security Groups | ✅ Complex UI | ✅ Simple UI | ✅ | ✅ |
| Edit Rules | ✅ Manual | ✅ One-Click | ✅ | ✅ |
| Auto-Configure for Services | ❌ | ✅ **Unique!** | ⚠️ Limited | ❌ |
| Smart Suggestions | ❌ | ✅ **Unique!** | ❌ | ❌ |
| Quick Common Ports | ❌ | ✅ | ✅ | ✅ |
| Security Warnings | ❌ | ✅ **Better** | ⚠️ Basic | ⚠️ Basic |
| Audit Logging | ✅ CloudTrail | ✅ Built-in | ✅ | ✅ |

**CloudEvy's Unique Value:**
1. Context-aware (knows what you're running)
2. Proactive suggestions
3. Auto-configuration for clusters
4. Simplified UX
5. Prevents security mistakes

---

## ⚠️ Security Considerations

### Must Implement:

1. **Audit Logging:**
   - Log every security group change
   - Track: who, when, what changed, before/after values
   - Store in `audit_logs` table

2. **Permissions:**
   - Only workspace admins can modify security groups
   - Team members can view only
   - Add RBAC (Role-Based Access Control)

3. **Validation:**
   - Warn before opening 0.0.0.0/0 on sensitive ports
   - Block opening all ports to public
   - Require confirmation for dangerous changes

4. **AWS IAM:**
   - Update CloudEvy setup docs with required permissions
   - Test with IAM policies that have only necessary permissions

### Warnings to Show Users:

```
⚠️ Security Warning
You're about to open port 22 (SSH) to 0.0.0.0/0 (entire internet).
This is risky! Consider restricting to your IP: 123.45.67.89

[ Open to Everyone (Risky) ]  [ Restrict to My IP (Recommended) ]
```

```
⚠️ Critical Port
You're about to close port 22 (SSH).
You might lose access to this server!

[ Cancel ]  [ I Understand, Close It ]
```

---

## 📊 Success Metrics

**After Phase 1 (K3s Auto-Config):**
- ✅ 0% cluster creation failures due to port 6443 issues
- ✅ Reduce cluster setup time by 5 minutes
- ✅ 100% of users stay in CloudEvy (no AWS Console needed)

**After Phase 3 (Full Management):**
- ✅ 90% of security group management done in CloudEvy
- ✅ Reduce AWS Console visits by 80%
- ✅ User satisfaction increase

**After Phase 4 (Smart Suggestions):**
- ✅ Reduce security misconfigurations by 70%
- ✅ Unique selling point in marketing
- ✅ "Easiest cloud management platform"

---

## 🚀 Recommendation

### Start With Phase 1 ASAP

**Why:**
- Directly solves the problem we faced today
- Makes K3s cluster creation truly one-click
- Small scope (2-3 days)
- High impact
- Users will love it

**Implementation Order:**
1. Week 1: Phase 1 (Auto-configure K3s) ⭐
2. Week 2: Phase 2 (Security Group Viewer)
3. Week 3-4: Phase 3 (Rule Management)
4. Week 5: Phase 4 (Smart Suggestions) - Optional

---

## 💡 Future Enhancements

### Beyond Security Groups:

**Load Balancer Management:**
- Create AWS ALB/NLB from CloudEvy
- Configure target groups
- One-click load balancer for K3s ingress

**Elastic IP Management:**
- Assign persistent IPs to servers
- No more IP changes on restart!
- One-click assignment

**Network ACL Management:**
- Subnet-level security
- More advanced than security groups

**VPC Management:**
- Create and manage VPCs
- Subnet configuration
- Route tables

**Cost Optimization:**
- Detect unused security groups
- Suggest cleanup
- Show cost of resources

---

## 📝 Notes from Implementation Session

**Date:** January 7, 2026

**Context:** 
While implementing K3s cluster creation, we discovered that port 6443 needed to be manually opened in AWS security groups. This required:
1. Finding the security group ID
2. Going to AWS Console
3. Editing inbound rules
4. Adding two rules (internal + external access)

This broke the flow and was confusing for users.

**Decision:**
Implement automatic security group configuration to make CloudEvy a true "no AWS Console needed" platform.

**Related Features:**
- K3s cluster creation (implemented)
- Private IP support (implemented)
- TLS certificate with public IP (implemented)
- Security group management (this document)

---

## 🔗 Related Documentation

- K3s Cluster Creation: `backend/src/services/kubernetesProvisioner.js`
- Server Management: `backend/src/routes/servers.js`
- AWS Integration: `backend/src/routes/cloudAccounts.js`
- Security: `backend/src/middleware/auth.js`

---

## ✅ When to Build This

**Immediate (Next Sprint):**
- Phase 1: K3s auto-security configuration

**Short Term (1-2 months):**
- Phase 2: Security group viewer
- Phase 3: Rule management

**Medium Term (3-6 months):**
- Phase 4: Smart suggestions
- Load balancer management
- Elastic IP management

**Long Term (6+ months):**
- Full VPC management
- Network ACL
- Multi-cloud security management

---

**Last Updated:** January 7, 2026  
**Status:** Ready for Implementation  
**Next Action:** Create Phase 1 implementation task

