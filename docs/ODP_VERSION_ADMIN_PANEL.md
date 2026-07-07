# ODP Version Admin Panel - Design Document

**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** Proposed Feature  
**Priority:** Medium (Build when version updates become frequent)

---

## 1. Overview

### Purpose
Provide CloudEvy administrators with a web-based interface to manage ODP (Open Data Platform) versions, their compatibility matrix, and repository URLs without requiring code changes or redeployment.

### Business Value
- **Faster Time-to-Market**: Add new ODP versions in minutes instead of hours
- **Reduced Technical Debt**: No need to update code for version changes
- **Accessibility**: Non-technical team members can manage versions
- **Audit Trail**: Track who added/modified versions and when
- **Quality Control**: Validate repository URLs before making them available to users

---

## 2. Current State vs. Future State

| Aspect | Current State | Future State |
|--------|--------------|--------------|
| **Data Storage** | Static file: `odpSupportMatrix.js` | PostgreSQL database tables |
| **Adding Versions** | Edit code → Git commit → Redeploy | Admin UI → Save → Live immediately |
| **Who Can Add** | Only developers with repo access | Admins with appropriate permissions |
| **Validation** | Manual testing after deployment | Built-in URL validation before saving |
| **Rollback** | Git revert → Redeploy | Disable/delete version in UI |
| **Audit** | Git history | Database audit log with timestamps |

---

## 3. User Interface Design

### 3.1 Main Management Page

**Location:** CloudEvy Dashboard > Admin > ODP Version Management

**Features:**
- List view of all ODP versions
- Search and filter by version number, OS, Ambari version
- Quick actions: Edit, Delete, Clone, Enable/Disable
- Bulk operations: Import from Acceldata, Export to JSON
- Pagination for large datasets

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ ODP Version Management                     [+ Add Version] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🔍 Search: [____________]  Filter: [All OSes ▼]          │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ ODP 3.3.6.3-1                    [Edit] [Clone] [Del]  ││
│ │ Status: ✅ Active                                       ││
│ │ Ambari: 3.0.0.0-1                                      ││
│ │ OS: RHEL 8/9, Ubuntu 20/22                             ││
│ │ JDK: 17 | Python: 3.11                                 ││
│ │ Added: Jan 13, 2026 by admin@cloudevy.in               ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ ODP 3.3.6.2-1                    [Edit] [Clone] [Del]  ││
│ │ Status: ✅ Active                                       ││
│ │ Ambari: 2.7.9.2-1, 3.0.0.0-1                           ││
│ │ OS: RHEL 8/9, Ubuntu 20/22                             ││
│ │ JDK: 8, 11, 17 | Python: 3.9, 3.11                     ││
│ │ Added: Dec 15, 2025 by admin@cloudevy.in               ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ Showing 1-10 of 19        [1] [2] [Next]                 │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Add/Edit Form

**Form Sections:**
1. Basic Information
2. Compatibility Matrix
3. Repository URLs
4. Validation & Preview

**Form Fields:**

#### Section 1: Basic Information
```
ODP Version *
┌──────────────────────┐
│ 3.3.7.0-1           │  Format: X.X.X.X-X
└──────────────────────┘

Status *
┌──────────────────────┐
│ ○ Active  ○ Draft    │  Draft = Not visible to end users
└──────────────────────┘

Release Date
┌──────────────────────┐
│ Jan 20, 2026        │  [Calendar]
└──────────────────────┘

Release Notes (Optional)
┌──────────────────────┐
│ - Bug fixes          │
│ - Performance...     │
└──────────────────────┘
```

#### Section 2: Compatibility Matrix
```
Compatible Ambari Versions * (Multi-select)
┌──────────────────────────────────────┐
│ ☑ 3.0.0.0-1                          │
│ ☐ 2.7.9.2-1                          │
│ ☐ 2.7.9.1-1                          │
│ [+ Add New Ambari Version]           │
└──────────────────────────────────────┘

Compatible Operating Systems * (Multi-select with versions)
┌──────────────────────────────────────┐
│ RHEL:     ☑ 8   ☑ 9                  │
│ Ubuntu:   ☑ 20  ☑ 22                 │
│ Rocky:    ☐ 8   ☐ 9                  │
│ CentOS:   ☐ 7                        │
└──────────────────────────────────────┘

ODP JDK Versions * (Multi-select)
┌──────────────────────────────────────┐
│ ☐ JDK 8   ☐ JDK 11   ☑ JDK 17       │
│ ☐ JDK 21                             │
└──────────────────────────────────────┘

Ambari JDK Versions * (Multi-select)
┌──────────────────────────────────────┐
│ ☐ JDK 8   ☐ JDK 11   ☑ JDK 17       │
│ ☐ JDK 21                             │
└──────────────────────────────────────┘

Python Versions * (Multi-select)
┌──────────────────────────────────────┐
│ ☐ Python 2   ☐ Python 3.9   ☑ Python 3.11 │
└──────────────────────────────────────┘

Database Support (Multi-select with versions)
┌──────────────────────────────────────┐
│ MySQL:       ☑ 5.7.x   ☑ 8.x        │
│ PostgreSQL:  ☑ 12      ☑ 15         │
│ MariaDB:     ☑ 10.11                │
│ Oracle:      ☑ 19c                  │
└──────────────────────────────────────┘
```

#### Section 3: Repository URLs

**Option A: Auto-Generate (Recommended)**
```
Repository URL Pattern *
┌──────────────────────────────────────────────────────┐
│ ○ Use Standard ODP Mirror Pattern                   │
│   Base: https://mirror.odp.acceldata.dev/v2/       │
│   Python: python3 | JDK: jdk17                      │
│   [Generate URLs]                                    │
└──────────────────────────────────────────────────────┘
```

**Option B: Manual Entry**
```
Repository URL Pattern *
┌──────────────────────────────────────────────────────┐
│ ○ Enter URLs Manually                               │
│                                                      │
│   RHEL 9 - ODP Repository:                          │
│   ┌────────────────────────────────────────────────┐│
│   │ https://mirror.odp.acceldata.dev/v2/odp/...   ││
│   └────────────────────────────────────────────────┘│
│   [Test URL]  Status: ✅ Accessible                │
│                                                      │
│   RHEL 9 - Ambari Repository:                       │
│   ┌────────────────────────────────────────────────┐│
│   │ https://mirror.odp.acceldata.dev/v2/ambari/... ││
│   └────────────────────────────────────────────────┘│
│   [Test URL]  Status: ✅ Accessible                │
│                                                      │
│   ... (All OS combinations)                         │
└──────────────────────────────────────────────────────┘
```

#### Section 4: Validation & Preview
```
Validation Status
┌──────────────────────────────────────────────────────┐
│ ✅ All repository URLs are accessible                │
│ ✅ Compatibility matrix is valid                     │
│ ✅ No duplicate version number                       │
│ ⚠️  Warning: This version has no LTS support        │
└──────────────────────────────────────────────────────┘

Preview: How Users Will See This
┌──────────────────────────────────────────────────────┐
│ [Mini preview of the ODP version card in the        │
│  support matrix UI that end users will see]          │
└──────────────────────────────────────────────────────┘

[Cancel]  [Save as Draft]  [Validate & Publish]
```

---

## 4. Database Schema

### 4.1 Tables

#### Table: `odp_versions`
```sql
CREATE TABLE odp_versions (
  id                SERIAL PRIMARY KEY,
  version           VARCHAR(50) UNIQUE NOT NULL, -- e.g., "3.3.6.3-1"
  status            VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'active', 'draft', 'deprecated'
  release_date      DATE,
  release_notes     TEXT,
  is_recommended    BOOLEAN DEFAULT false,
  created_by        INTEGER REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odp_versions_status ON odp_versions(status);
CREATE INDEX idx_odp_versions_created_at ON odp_versions(created_at DESC);
```

#### Table: `odp_compatibility`
```sql
CREATE TABLE odp_compatibility (
  id                SERIAL PRIMARY KEY,
  odp_version_id    INTEGER REFERENCES odp_versions(id) ON DELETE CASCADE,
  component_type    VARCHAR(50) NOT NULL, -- 'ambari', 'os', 'odp_jdk', 'ambari_jdk', 'python', 'database'
  component_key     VARCHAR(50) NOT NULL, -- e.g., 'rhel', 'mysql'
  component_value   VARCHAR(50) NOT NULL, -- e.g., '9', '8.x'
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odp_compatibility_version ON odp_compatibility(odp_version_id);
CREATE INDEX idx_odp_compatibility_type ON odp_compatibility(component_type);
```

#### Table: `odp_repository_urls`
```sql
CREATE TABLE odp_repository_urls (
  id                SERIAL PRIMARY KEY,
  odp_version_id    INTEGER REFERENCES odp_versions(id) ON DELETE CASCADE,
  ambari_version    VARCHAR(50) NOT NULL, -- e.g., "3.0.0.0-1"
  os_type           VARCHAR(50) NOT NULL, -- 'rhel', 'ubuntu', 'rocky'
  os_version        VARCHAR(50) NOT NULL, -- '8', '9', '20', '22'
  repo_type         VARCHAR(20) NOT NULL, -- 'odp', 'ambari'
  url               TEXT NOT NULL,
  is_validated      BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odp_repo_urls_version ON odp_repository_urls(odp_version_id);
CREATE INDEX idx_odp_repo_urls_lookup ON odp_repository_urls(odp_version_id, os_type, os_version, repo_type);
```

#### Table: `odp_version_audit_log`
```sql
CREATE TABLE odp_version_audit_log (
  id                SERIAL PRIMARY KEY,
  odp_version_id    INTEGER REFERENCES odp_versions(id) ON DELETE CASCADE,
  action            VARCHAR(50) NOT NULL, -- 'created', 'updated', 'published', 'deprecated', 'deleted'
  changed_by        INTEGER REFERENCES users(id),
  changes           JSONB, -- Store what was changed
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odp_audit_version ON odp_version_audit_log(odp_version_id);
CREATE INDEX idx_odp_audit_created_at ON odp_version_audit_log(created_at DESC);
```

---

## 5. API Endpoints

### 5.1 Admin Endpoints (Require Admin Role)

#### GET /api/admin/odp-versions
**Purpose:** List all ODP versions (including drafts)

**Query Parameters:**
- `status` (optional): 'active', 'draft', 'deprecated', 'all' (default: 'all')
- `search` (optional): Search by version number
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": 1,
        "version": "3.3.6.3-1",
        "status": "active",
        "is_recommended": true,
        "release_date": "2026-01-13",
        "created_by": "admin@cloudevy.in",
        "created_at": "2026-01-13T10:00:00Z",
        "compatibility_summary": {
          "ambari": ["3.0.0.0-1"],
          "os": ["RHEL 8", "RHEL 9", "Ubuntu 20", "Ubuntu 22"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 19,
      "total_pages": 1
    }
  }
}
```

---

#### GET /api/admin/odp-versions/:id
**Purpose:** Get full details of a specific ODP version

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "version": "3.3.6.3-1",
    "status": "active",
    "is_recommended": true,
    "release_date": "2026-01-13",
    "release_notes": "Bug fixes and performance improvements",
    "compatibility": {
      "ambari": ["3.0.0.0-1"],
      "os": {
        "rhel": ["8", "9"],
        "ubuntu": ["20", "22"]
      },
      "odp_jdk": ["8", "11", "17"],
      "ambari_jdk": ["17"],
      "python": ["3.9", "3.11"],
      "database": {
        "mysql": ["5.7.x", "8.x"],
        "postgresql": ["12", "15"]
      }
    },
    "repository_urls": {
      "rhel9": {
        "odp": "https://mirror.odp.acceldata.dev/v2/odp/python3/jdk17/3.3.6.3-1/releases/rhel9/",
        "ambari": "https://mirror.odp.acceldata.dev/v2/ambari/python3/jdk17/3.0.0.0-1/releases/rhel9/"
      }
    }
  }
}
```

---

#### POST /api/admin/odp-versions
**Purpose:** Create a new ODP version

**Request Body:**
```json
{
  "version": "3.3.7.0-1",
  "status": "draft",
  "release_date": "2026-02-01",
  "release_notes": "New features...",
  "is_recommended": false,
  "compatibility": {
    "ambari": ["3.0.0.0-1"],
    "os": {
      "rhel": ["8", "9"],
      "ubuntu": ["20", "22"]
    },
    "odp_jdk": ["17"],
    "ambari_jdk": ["17"],
    "python": ["3.11"]
  },
  "repository_urls": {
    "rhel9": {
      "odp": "https://mirror.odp.acceldata.dev/...",
      "ambari": "https://mirror.odp.acceldata.dev/..."
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "version": "3.3.7.0-1",
    "status": "draft",
    "message": "ODP version created successfully"
  }
}
```

---

#### PUT /api/admin/odp-versions/:id
**Purpose:** Update an existing ODP version

**Request Body:** (Same structure as POST)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "version": "3.3.7.0-1",
    "message": "ODP version updated successfully"
  }
}
```

---

#### DELETE /api/admin/odp-versions/:id
**Purpose:** Delete an ODP version (soft delete for active versions)

**Response:**
```json
{
  "success": true,
  "message": "ODP version deleted successfully"
}
```

---

#### POST /api/admin/odp-versions/:id/validate-repos
**Purpose:** Validate all repository URLs for a version

**Response:**
```json
{
  "success": true,
  "data": {
    "rhel9_odp": {
      "url": "https://mirror.odp.acceldata.dev/...",
      "status": "accessible",
      "response_time_ms": 234
    },
    "rhel9_ambari": {
      "url": "https://mirror.odp.acceldata.dev/...",
      "status": "accessible",
      "response_time_ms": 187
    },
    "ubuntu20_odp": {
      "url": "https://mirror.odp.acceldata.dev/...",
      "status": "not_found",
      "error": "404 Not Found"
    }
  },
  "all_valid": false
}
```

---

#### POST /api/admin/odp-versions/:id/publish
**Purpose:** Change status from 'draft' to 'active'

**Response:**
```json
{
  "success": true,
  "message": "ODP version published successfully"
}
```

---

#### POST /api/admin/odp-versions/:id/deprecate
**Purpose:** Mark version as deprecated

**Response:**
```json
{
  "success": true,
  "message": "ODP version deprecated successfully"
}
```

---

#### GET /api/admin/odp-versions/:id/audit-log
**Purpose:** Get change history for a version

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "action": "created",
      "changed_by": "admin@cloudevy.in",
      "timestamp": "2026-01-13T10:00:00Z"
    },
    {
      "action": "updated",
      "changed_by": "admin@cloudevy.in",
      "changes": {
        "status": {"from": "draft", "to": "active"}
      },
      "timestamp": "2026-01-13T14:00:00Z"
    }
  ]
}
```

---

### 5.2 Public Endpoints (Used by Regular Users)

#### GET /api/odp-matrix
**Purpose:** Get only active ODP versions for the support matrix

**Response:**
```json
{
  "success": true,
  "data": {
    "odpVersions": ["3.3.6.3-1", "3.3.6.2-1", ...],
    "ambariVersions": ["3.0.0.0-1", "2.7.9.2-1", ...],
    "compatibility": { /* same as current */ }
  }
}
```
*Note: This endpoint only returns versions with `status = 'active'`*

---

## 6. Security & Permissions

### 6.1 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access: Create, Read, Update, Delete, Publish, Deprecate |
| **Admin** | Create drafts, Update own drafts, Read all, Publish with approval |
| **Viewer** | Read-only access to admin panel |
| **Regular User** | No access to admin panel, only sees active versions in UI |

### 6.2 Security Measures

1. **Authentication**: JWT-based authentication required for all admin endpoints
2. **Authorization**: Middleware checks user role before allowing admin operations
3. **Input Validation**: All inputs validated using express-validator
4. **SQL Injection Prevention**: Prisma ORM with parameterized queries
5. **Audit Logging**: All changes logged with user ID and timestamp
6. **Rate Limiting**: API rate limits to prevent abuse
7. **CSRF Protection**: CSRF tokens for state-changing operations

---

## 7. URL Validation Logic

### 7.1 Validation Process

When "Test URL" is clicked:

1. **HTTP HEAD Request**: Check if URL is accessible (faster than GET)
2. **Check repomd.xml**: Verify `<base_url>/repodata/repomd.xml` exists
3. **Response Time**: Measure and display latency
4. **SSL Certificate**: Validate HTTPS certificate
5. **Content-Type**: Verify it's a valid repository

### 7.2 Validation Status Indicators

- ✅ **Accessible**: 200 OK, repomd.xml found, <500ms response
- ⚠️ **Slow**: 200 OK, but >500ms response time
- ❌ **Not Found**: 404 or repomd.xml missing
- ⛔ **Error**: Connection timeout, SSL error, or other error

### 7.3 Background Validation

- **Scheduled Task**: Validate all active versions daily at 3 AM
- **Email Alerts**: Notify admins if any URLs become inaccessible
- **Auto-Deprecation**: Optionally auto-deprecate versions with broken URLs (disabled by default)

---

## 8. Migration Strategy

### 8.1 Phase 1: Database Setup
1. Create new database tables
2. Run initial migration script
3. Seed database with existing data from `odpSupportMatrix.js`

### 8.2 Phase 2: Dual-Read Mode
1. Update API to read from **both** database and static file
2. Database takes priority, static file as fallback
3. Allows gradual migration and rollback capability

### 8.3 Phase 3: Admin UI Development
1. Build admin frontend
2. Connect to admin API endpoints
3. User acceptance testing

### 8.4 Phase 4: Full Migration
1. Switch to database-only reads
2. Remove static file fallback
3. Monitor for issues

### 8.5 Phase 5: Deprecation
1. Remove `odpSupportMatrix.js` from codebase
2. Update documentation

---

## 9. Testing Plan

### 9.1 Unit Tests
- Database model validation
- API endpoint logic
- URL validation function

### 9.2 Integration Tests
- Full CRUD operations
- Permission checks
- Repository URL validation

### 9.3 E2E Tests
- Admin user creates new version
- Regular user sees new version in matrix
- Cluster installation uses correct repositories

### 9.4 Performance Tests
- Load test: 100 concurrent admin operations
- Repository validation with 50+ URLs
- Database query optimization

---

## 10. Implementation Timeline

| Phase | Tasks | Duration | Effort |
|-------|-------|----------|--------|
| **Phase 1: Design** | Finalize UI mockups, API specs | 2 days | 16 hours |
| **Phase 2: Backend** | Database schema, migrations, API endpoints | 5 days | 40 hours |
| **Phase 3: Frontend** | Admin UI components, forms, validation | 5 days | 40 hours |
| **Phase 4: Integration** | Connect frontend to backend, testing | 3 days | 24 hours |
| **Phase 5: Migration** | Seed data, dual-read mode, monitoring | 2 days | 16 hours |
| **Phase 6: Deployment** | Production deployment, documentation | 1 day | 8 hours |
| **Total** | | **18 days** | **144 hours** |

---

## 11. Future Enhancements

### 11.1 Version Import Wizard
- Bulk import from CSV/JSON
- Import from Acceldata documentation URL
- Auto-detect compatibility from repository metadata

### 11.2 Repository Health Dashboard
- Real-time status of all repository URLs
- Historical uptime metrics
- Alerting when repositories go down

### 11.3 Version Comparison Tool
- Compare compatibility between versions
- Show upgrade path from one version to another
- Highlight breaking changes

### 11.4 Automated Testing
- Auto-test installation on VM when new version is added
- Integration with CI/CD pipeline
- Validation reports before publishing

### 11.5 User Feedback
- Allow users to rate version stability
- Report issues with specific versions
- Show popularity metrics (most installed versions)

---

## 12. Rollback Plan

If issues arise after deployment:

1. **Immediate**: Switch API back to reading from static file
2. **Short-term**: Fix database/API issues, redeploy
3. **Long-term**: If unfixable, remove admin panel and revert to manual updates

---

## 13. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to Add Version** | <5 minutes | Track from admin login to published |
| **Admin Adoption** | 100% | All version updates done via admin panel |
| **URL Validation Accuracy** | >95% | Compare validation results to actual installation success |
| **System Uptime** | 99.9% | Monitor API availability |
| **User Satisfaction** | >4.5/5 | Admin user surveys |

---

## 14. Documentation Requirements

### 14.1 Admin Documentation
- How to add a new ODP version
- How to validate repository URLs
- How to publish/deprecate versions
- Troubleshooting guide

### 14.2 Developer Documentation
- Database schema reference
- API endpoint reference
- How to extend the admin panel

### 14.3 End-User Documentation
- No changes needed (transparent to end users)

---

## 15. Appendix

### 15.1 Example: Adding ODP 3.3.7.0-1

**Step-by-Step:**
1. Admin logs into CloudEvy dashboard
2. Navigates to Admin > ODP Version Management
3. Clicks "+ Add Version"
4. Fills in form:
   - Version: 3.3.7.0-1
   - Status: Draft
   - Compatible Ambari: 3.0.0.0-1
   - OS: RHEL 8/9, Ubuntu 20/22
   - JDK: 17
   - Python: 3.11
5. Clicks "Generate URLs" (auto-generates based on pattern)
6. Clicks "Validate & Publish"
7. System validates all URLs (takes ~30 seconds)
8. Admin reviews validation results
9. Clicks "Publish"
10. Version is now live and visible to all users in the support matrix

**Total Time: 3-4 minutes**

---

## 16. Questions & Answers

**Q: What happens to existing installations if we deprecate a version?**  
A: Existing clusters continue to work. Deprecation only prevents new installations of that version.

**Q: Can we have multiple versions marked as "recommended"?**  
A: No, only one version can be marked as recommended at a time. It's enforced at the database level.

**Q: What if Acceldata changes their URL structure?**  
A: Admins can manually override URLs for any version. The URL generation pattern is also configurable.

**Q: How do we handle beta/RC versions?**  
A: Add a `version_type` field: 'stable', 'beta', 'rc'. Beta versions only shown to users with beta access enabled.

---

**Document End**

**Prepared By:** AI Assistant  
**Reviewed By:** [To be filled]  
**Approved By:** [To be filled]  
**Next Review Date:** [To be filled]
