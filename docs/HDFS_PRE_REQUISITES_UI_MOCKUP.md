# 🎨 HDFS Pre-requisites UI - Visual Mockup

## Step 1: Pre-requisites Screen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🐘 Create HDFS Cluster                                            ✕        │
│  Distributed data processing with Hadoop ecosystem                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ● ─── ○ ─── ○ ─── ○ ─── ○ ─── ○                                           │
│  1      2     3     4     5     6                                            │
│  Pre-   Dist  Serv  Conf  Node  Revi                                        │
│  req    ribut vice  igur  s     ew                                          │
│        ion   s     ation                                                     │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🎯 Pre-requisites Checklist                                                │
│  Ensure all requirements are met before creating your HDFS cluster          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️  CRITICAL: All cluster nodes MUST be in the SAME security      │   │
│  │     group with proper inbound rules configured. Failure to do so   │   │
│  │     will cause installation to fail.                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ① Security Group Configuration                              ▼     │   │
│  │  All nodes in same security group with proper rules                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  📋 Required Inbound Rules:                                         │   │
│  │                                                                     │   │
│  │  ✓ All Traffic from Same Security Group                            │   │
│  │    Type: All Traffic | Source: sg-xxxxx (same group)               │   │
│  │    Allows all cluster nodes to communicate with each other          │   │
│  │                                                                     │   │
│  │  ✓ SSH Access                                                       │   │
│  │    Type: SSH (22) | Source: Your IP / 0.0.0.0/0                    │   │
│  │    Required for CloudEvy to manage servers                          │   │
│  │                                                                     │   │
│  │  ! Ambari Web UI (Optional)                                         │   │
│  │    Type: Custom TCP (8080) | Source: Your IP                       │   │
│  │    To access Ambari management interface                            │   │
│  │                                                                     │   │
│  │  ! HDFS NameNode UI (Optional)                                      │   │
│  │    Type: Custom TCP (50070) | Source: Your IP                      │   │
│  │    To access HDFS web interface                                     │   │
│  │                                                                     │   │
│  │  ! YARN ResourceManager UI (Optional)                               │   │
│  │    Type: Custom TCP (8088) | Source: Your IP                       │   │
│  │    To access YARN web interface                                     │   │
│  │                                                                     │   │
│  │  💡 Pro Tip: Create a dedicated security group called              │   │
│  │     "hdfs-cluster-sg" and apply it to all servers before proceeding│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ② Server Configuration                                      ▼     │   │
│  │  Minimum 3 servers with adequate resources                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐          │   │
│  │  │ 📊 Minimum (Testing)    │  │ 🚀 Recommended (Prod)   │          │   │
│  │  │                         │  │                         │          │   │
│  │  │ Master:  t3.small       │  │ Master:  t3.medium      │          │   │
│  │  │          (2 vCPU, 2 GB) │  │          (2 vCPU, 4 GB) │          │   │
│  │  │                         │  │                         │          │   │
│  │  │ Workers: 2x t3.small    │  │ Workers: 3x t3.large    │          │   │
│  │  │          (2 vCPU, 2 GB) │  │          (2 vCPU, 8 GB) │          │   │
│  │  │                         │  │                         │          │   │
│  │  │ Storage: 20 GB root +   │  │ Storage: 50 GB root +   │          │   │
│  │  │          20 GB data     │  │          100+ GB data   │          │   │
│  │  │                         │  │                         │          │   │
│  │  │ Cost: ~$53/month        │  │ Cost: ~$200+/month      │          │   │
│  │  └─────────────────────────┘  └─────────────────────────┘          │   │
│  │                                                                     │   │
│  │  ⚠️ Important: Worker nodes should have additional EBS volumes     │   │
│  │     attached for HDFS data storage.                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ③ Network Setup                                             ▼     │   │
│  │  VPC, subnet, and connectivity requirements                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ④ SSH Configuration                                         ▼     │   │
│  │  Key-based authentication and sudo access                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⑤ System Configuration                                      ▼     │   │
│  │  OS, firewall, and system settings (auto-configured)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✓  Ready to Proceed?                                                │   │
│  │                                                                     │   │
│  │    Once you've verified all requirements above, click "Next" to     │   │
│  │    begin configuring your HDFS cluster. Installation typically      │   │
│  │    takes 15-30 minutes depending on services selected.              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                       [ Cancel ]  [ Next → ]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Expanded View - Security Group Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ① Security Group Configuration                              ▲     │   │
│  │  All nodes in same security group with proper rules                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ 📋 Required Inbound Rules:                                    │ │   │
│  │  │                                                               │ │   │
│  │  │ ┌─┐                                                           │ │   │
│  │  │ │✓│ All Traffic from Same Security Group                     │ │   │
│  │  │ └─┘ Type: All Traffic | Source: sg-xxxxx (same group)        │ │   │
│  │  │     Allows all cluster nodes to communicate with each other   │ │   │
│  │  │                                                               │ │   │
│  │  │ ┌─┐                                                           │ │   │
│  │  │ │✓│ SSH Access                                                │ │   │
│  │  │ └─┘ Type: SSH (22) | Source: Your IP / 0.0.0.0/0             │ │   │
│  │  │     Required for CloudEvy to manage servers                   │ │   │
│  │  │                                                               │ │   │
│  │  │ ┌─┐                                                           │ │   │
│  │  │ │!│ Ambari Web UI (Optional)                                  │ │   │
│  │  │ └─┘ Type: Custom TCP (8080) | Source: Your IP                │ │   │
│  │  │     To access Ambari management interface                     │ │   │
│  │  │                                                               │ │   │
│  │  │ ┌─┐                                                           │ │   │
│  │  │ │!│ HDFS NameNode UI (Optional)                               │ │   │
│  │  │ └─┘ Type: Custom TCP (50070) | Source: Your IP               │ │   │
│  │  │     To access HDFS web interface                              │ │   │
│  │  │                                                               │ │   │
│  │  │ ┌─┐                                                           │ │   │
│  │  │ │!│ YARN ResourceManager UI (Optional)                        │ │   │
│  │  │ └─┘ Type: Custom TCP (8088) | Source: Your IP                │ │   │
│  │  │     To access YARN web interface                              │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ 💡 Pro Tip: Create a dedicated security group called          │ │   │
│  │  │    "hdfs-cluster-sg" and apply it to all servers before       │ │   │
│  │  │    proceeding.                                                │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Backgrounds
- **Main Background:** `bg-gray-900` (Dark theme)
- **Section Background:** `bg-gray-800/50` (Semi-transparent dark)
- **Expanded Content:** `bg-gray-900/50` (Darker for nested content)

### Borders
- **Main Border:** `border-gray-700`
- **Active/Hover:** `border-orange-500`

### Text Colors
- **Primary Text:** `text-white`
- **Secondary Text:** `text-gray-400`
- **Tertiary Text:** `text-gray-500`

### Status Colors
- **Critical Warning:** `bg-red-500/10` + `border-red-500/30` + `text-red-300`
- **Info/Optional:** `bg-blue-500/10` + `border-blue-500/30` + `text-blue-300`
- **Success/Ready:** `bg-green-500/10` + `border-green-500/30` + `text-green-300`
- **Warning:** `bg-yellow-500/10` + `border-yellow-500/30` + `text-yellow-300`
- **Pro Tip:** `bg-blue-500/10` + `border-blue-500/30` + `text-blue-300`

### Accent Colors
- **Primary Action:** `bg-orange-500` / `bg-orange-600` (buttons, active states)
- **Success Action:** `bg-green-500` / `bg-green-600`
- **Neutral Action:** `bg-gray-700` / `bg-gray-600`

### Icons
- **Required (Checkmark):** `text-green-400` on `bg-green-500/20`
- **Optional (Info):** `text-blue-400` on `bg-blue-500/20`
- **Warning:** `text-yellow-400`
- **Critical:** `text-red-400`

---

## Interactive States

### Accordion Sections
```
Collapsed:
┌─────────────────────────────────────────────────────────┐
│  ① Security Group Configuration                   ▼    │
│  All nodes in same security group with proper rules    │
└─────────────────────────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────────────────────────┐
│  ① Security Group Configuration                   ▲    │
│  All nodes in same security group with proper rules    │
├─────────────────────────────────────────────────────────┤
│  [Detailed content here...]                             │
└─────────────────────────────────────────────────────────┘

Hover:
┌─────────────────────────────────────────────────────────┐
│  ① Security Group Configuration                   ▼    │  ← bg-gray-800
│  All nodes in same security group with proper rules    │
└─────────────────────────────────────────────────────────┘
```

### Progress Steps
```
Past Step:     ✓  (Green circle with checkmark)
Current Step:  ●  (Orange circle with number)
Future Step:   ○  (Gray circle with number)

Progress Line:
Past:    ━━━  (Green line)
Future:  ━━━  (Gray line)
```

### Buttons
```
Primary (Next):
  Normal:   bg-orange-600 hover:bg-orange-700
  Disabled: bg-gray-600 disabled:cursor-not-allowed

Secondary (Cancel/Back):
  Normal:   bg-gray-700 hover:bg-gray-600

Success (Create):
  Normal:   bg-green-600 hover:bg-green-700
  Disabled: bg-gray-600
```

---

## Responsive Breakpoints

### Desktop (1920px+)
- Two-column grid for server specs
- All content fully visible
- Large icons and spacing

### Laptop (1280px - 1920px)
- Maintained two-column layout
- Slightly reduced spacing
- All features intact

### Tablet (768px - 1280px)
- Single column for server specs
- Accordion sections stack
- Reduced padding
- Touch-friendly hit areas

### Mobile (< 768px)
- Full single-column layout
- Larger accordion headers
- Optimized font sizes
- Bottom-fixed footer
- Scroll to content behavior

---

## Animation & Transitions

### Accordion Expand/Collapse
```css
transition: all 0.3s ease-in-out
```

### Arrow Rotation
```css
transform: rotate(180deg)
transition: transform 0.3s ease
```

### Hover Effects
```css
transition: background-color 0.2s ease, border-color 0.2s ease
```

### Button States
```css
transition: all 0.2s ease
```

---

## Accessibility Features

### ARIA Labels
- `aria-expanded` on accordion headers
- `aria-controls` linking headers to content
- `role="button"` on clickable elements

### Keyboard Navigation
- Tab to navigate between accordion sections
- Enter/Space to expand/collapse
- Tab to navigate within expanded content
- Arrow keys for section navigation

### Screen Reader Support
- Semantic HTML structure
- Clear heading hierarchy (h3, h4)
- Descriptive button labels
- Status announcements on expand/collapse

### Focus Indicators
```css
focus:ring-2 focus:ring-orange-500 focus:outline-none
```

---

## Typography

### Headings
- **H2 (Main Title):** `text-2xl font-bold text-white`
- **H3 (Section Title):** `text-xl font-bold text-white`
- **H4 (Subsection):** `text-lg font-semibold text-white`

### Body Text
- **Primary:** `text-sm text-gray-300`
- **Secondary:** `text-xs text-gray-400`
- **Tertiary:** `text-xs text-gray-500`

### Special Text
- **Mono (Ports/IDs):** `font-mono text-gray-400`
- **Bold Emphasis:** `font-semibold text-white`
- **Color Emphasis:** `text-orange-400`, `text-green-400`, `text-blue-400`

---

## Icon System

### Emoji Icons (Primary)
- 🐘 HDFS/Hadoop
- 🎯 Pre-requisites/Target
- 🛡️ Security
- 💻 Servers
- 🌐 Network
- 🔑 SSH/Security
- ⚙️ Configuration
- 📋 Checklist
- 💡 Pro Tip
- ⚠️ Warning
- ✓ Success/Required
- ! Info/Optional

### SVG Icons (Functional)
- Close (X)
- Chevron Down/Up (Accordion)
- Checkmark (Completed steps)
- Alert Triangle
- Info Circle

---

## Grid Layouts

### Server Specs (Desktop)
```
┌──────────────────────────┬──────────────────────────┐
│  Minimum (Testing)       │  Recommended (Production)│
│  Master:  t3.small       │  Master:  t3.medium      │
│  Workers: 2x t3.small    │  Workers: 3x t3.large    │
│  Storage: 20 GB          │  Storage: 100+ GB        │
│  Cost:    $53/month      │  Cost:    $200+/month    │
└──────────────────────────┴──────────────────────────┘
```

### Server Specs (Mobile)
```
┌──────────────────────────┐
│  Minimum (Testing)       │
│  Master:  t3.small       │
│  Workers: 2x t3.small    │
│  Storage: 20 GB          │
│  Cost:    $53/month      │
└──────────────────────────┘

┌──────────────────────────┐
│  Recommended (Production)│
│  Master:  t3.medium      │
│  Workers: 3x t3.large    │
│  Storage: 100+ GB        │
│  Cost:    $200+/month    │
└──────────────────────────┘
```

---

## Summary

This pre-requisites screen provides:
- ✅ Clear, comprehensive requirements checklist
- ✅ Expandable sections for detailed information
- ✅ Visual hierarchy with colors and icons
- ✅ Side-by-side comparisons (desktop)
- ✅ Mobile-responsive layout
- ✅ Interactive hover/focus states
- ✅ Accessibility-compliant
- ✅ Modern, dark-themed UI
- ✅ Consistent with CloudEvy design system

**Result:** Users are properly informed and prepared before creating HDFS clusters! 🚀
