# Project Architecture - Odoo SMB Implementation

**Project Name:** Odoo Community Edition - SMB Implementation
**Version:** 19.0
**Purpose:** Full-featured ERP system for small/medium businesses with OnlyOffice document editing integration
**Last Updated:** 2025-12-22

---

## 🎯 Project Purpose & Goals

### Primary Purpose
Deploy and customize Odoo 19.0 Community Edition as a complete ERP solution for SMB (Small-Medium Business) operations, with enhanced document collaboration through OnlyOffice integration.

### Business Goals
- ✅ Centralized business management (CRM, Sales, Inventory, Accounting)
- ✅ Real-time office document editing (Word, Excel, PowerPoint)
- ✅ Multi-user collaboration on documents
- ✅ Cost-effective solution (Community Edition, no Enterprise fees)
- ✅ Self-hosted, full data control

### Technical Goals
- ✅ Odoo 19.0 compatibility (latest stable)
- ✅ Custom module development capability
- ✅ Scalable architecture (development → production)
- ✅ Docker-based services for easy deployment
- ✅ Comprehensive documentation for future maintenance

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx (SSL)    │  Port 80/443
                    │  Reverse Proxy  │  (Production)
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
  │   Odoo    │      │  OnlyOffice │     │  PostgreSQL │
  │  (Python) │◄────►│  Doc Server │     │  Database   │
  │           │      │   (Docker)  │     │             │
  │ Port 8069 │      │  Port 8080  │     │  Port 5433  │
  └───────┬───┘      └─────────────┘     └──────┬──────┘
          │                                      │
          │          ┌────────────────┐          │
          └─────────►│   Filestore    │◄─────────┘
                     │  (Attachments) │
                     └────────────────┘
```

### Component Details

#### 1. Odoo Application Server
- **Technology:** Python 3.10
- **Framework:** Odoo 19.0 Community
- **Port:** 8069 (internal)
- **Interface:** 0.0.0.0 (all interfaces - required for Docker callback)
- **Process Manager:** systemd (odoo.service)
- **Location:** `/opt/sodoo` (workspace root)

**Responsibilities:**
- Business logic execution
- Database ORM operations
- API endpoints for frontend
- Module loading and management
- Session management

#### 2. OnlyOffice Document Server
- **Technology:** Node.js (in Docker)
- **Version:** Latest (v9.2.0+)
- **Port:** 8080 (internal)
- **Deployment:** Docker container
- **Container Name:** `onlyoffice-documentserver`

**Responsibilities:**
- Render office documents (DOCX, XLSX, PPTX)
- Real-time collaborative editing
- Document conversion
- JWT authentication with Odoo

**Architecture:**
```
Odoo Request ──────────────────────────► OnlyOffice
    │                                         │
    │  1. Initialize editor                  │
    │  2. Provide file URL + JWT token       │
    │                                         │
    │◄────────────────────────────────────── │
    │  3. Callback: Download file            │
    │                                         │
    │◄────────────────────────────────────── │
    │  4. Callback: Save changes             │
```

#### 3. PostgreSQL Database
- **Version:** 16
- **Port:** 5433 (non-standard to avoid conflicts)
- **Database Name:** `odoo_smb`
- **User:** `odoo`
- **Location:** `pgdata/` (local) or managed service (production)

**Responsibilities:**
- All persistent data storage
- Transactional integrity
- Relational data (customers, products, invoices, etc.)
- Attachment metadata (files stored separately)

#### 4. Nginx Reverse Proxy (Production Only)
- **Purpose:** SSL termination, security, caching
- **Configuration:**
  - Port 80 → Redirect to HTTPS
  - Port 443 → Proxy to Odoo (8069)
  - Optional: Subdomain for OnlyOffice (onlyoffice.smb-hkt.com)

---

## 📁 Project Structure

```
/home/embed/Dev/SODOO/              # Development (workspace)
/opt/sodoo/                          # Production (workspace)
├── .ai/                             # ⭐ AI Context & Documentation
│   ├── context.yaml                 # Project state and config
│   ├── README.md                    # Overview
│   ├── AI_AGENT_GUIDELINES.md       # AI rules and protocols
│   ├── TEMPLATE_USAGE.md            # Template for other projects
│   ├── DEVELOPMENT_LOG.md           # Issue tracking
│   ├── PROJECT_ARCHITECTURE.md      # This file
│   ├── NEW_CHAT_TEMPLATE.md         # Session starter
│   ├── ONLYOFFICE_PRODUCTION_CHECKLIST.md  # Deployment guide
│   └── sessions/                    # Session logs
│       └── 2025-12-*.md
│
├── logos/                           # ⭐ All branding assets
│   ├── sodoo-logo.svg               # Main SODOO logo
│   ├── sodoo-logo-favicon.svg       # Favicon source
│   ├── sodoo-favicon.ico            # Multi-size ICO
│   ├── sodoo-icon-*.png             # PNG icons (16-512px)
│   ├── sodooc-*.svg/png/ico         # SODOOC variants
│   └── ...
│
├── odoo/                            # Core Odoo framework (submodule)
│   ├── addons/                      # Official Odoo modules
│   │   ├── base/                    # Core module
│   │   ├── sale/                    # Sales module
│   │   ├── crm/                     # CRM module
│   │   ├── account/                 # Accounting module
│   │   └── ... (200+ modules)
│   │
│   ├── odoo/                        # Framework code
│   │   ├── __init__.py
│   │   ├── api.py                   # ORM API
│   │   ├── fields.py                # Field types
│   │   ├── models.py                # Base model classes
│   │   ├── http.py                  # HTTP controller
│   │   └── ...
│   │
│   └── odoo-bin                     # Main executable
│
├── custom_addons/                   # ⭐ Custom modules (OUR CODE)
│   └── onlyoffice_odoo/             # OnlyOffice integration (SODOOC)
│       ├── __init__.py
│       ├── __manifest__.py          # Module metadata
│       ├── controllers/
│       │   └── controllers.py       # HTTP endpoints
│       ├── models/
│       │   ├── res_config_settings.py   # Settings UI
│       │   └── ...
│       ├── views/
│       │   ├── res_config_settings_views.xml
│       │   ├── attachment_card_onlyoffice.xml
│       │   └── templates.xml
│       ├── static/
│       │   ├── src/
│       │   │   ├── js/
│       │   │   └── css/
│       │   └── description/
│       ├── i18n/                    # Translations
│       │   └── en.po
│       └── utils/
│           ├── config_utils.py
│           └── validation_utils.py
│
├── addons/                          # Symlink to odoo/addons
│
├── .venv/ or venv/                  # Python virtual environment
│
├── odoo.conf                        # Main configuration
├── odoo.conf.smb                    # SMB-specific config
├── requirements.txt                 # Python dependencies
├── .gitignore
└── pgdata/                          # PostgreSQL data (local dev)
```

---

## 🔄 Data Flow

### 1. User Request Flow
```
User Browser
    │
    ▼
[HTTPS Request] → Nginx (SSL termination)
    │
    ▼
[HTTP Proxy] → Odoo (Port 8069)
    │
    ├──► Controller (HTTP handler)
    │       │
    │       ▼
    ├──► Model (Business logic)
    │       │
    │       ▼
    ├──► Database (PostgreSQL)
    │       │
    │       ▼
    └──► Response (HTML/JSON)
            │
            ▼
        User Browser
```

### 2. OnlyOffice Document Edit Flow
```
User clicks "Edit in OnlyOffice"
    │
    ▼
Odoo generates editor URL + JWT token
    │
    ▼
Browser loads OnlyOffice editor (iframe)
    │
    ▼
OnlyOffice requests document from Odoo
    │  (Authenticated with JWT)
    ▼
Odoo serves document file
    │
    ▼
User edits document in browser
    │
    ▼
OnlyOffice auto-saves changes
    │  (Callbacks to Odoo every few seconds)
    ▼
Odoo receives and stores new version
    │
    ▼
Document saved in filestore
```

---

## 🧩 Module Architecture

### Odoo Module Structure (Standard)

Every Odoo module follows this pattern:

```python
# __manifest__.py - Module metadata
{
    'name': 'Module Name',
    'version': '1.0',
    'depends': ['base', 'mail'],  # Dependencies
    'data': [  # XML files to load
        'security/ir.model.access.csv',
        'views/views.xml',
    ],
    'installable': True,
}

# models/ - Business logic
class MyModel(models.Model):
    _name = 'my.model'
    _description = 'My Model Description'

    name = fields.Char(string='Name', required=True)
    active = fields.Boolean(default=True)

# controllers/ - HTTP endpoints
class MyController(http.Controller):
    @http.route('/my/endpoint', auth='user')
    def my_endpoint(self):
        return request.render('template_name')

# views/ - UI definitions (XML)
<odoo>
    <record id="view_form" model="ir.ui.view">
        <field name="name">my.model.form</field>
        <field name="model">my.model</field>
        <field name="arch" type="xml">
            <!-- UI structure here -->
        </field>
    </record>
</odoo>
```

---

## 🔧 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10.12 | Programming language |
| Odoo Framework | 19.0 | ERP framework |
| PostgreSQL | 16 | Database |
| PyJWT | 2.10.1+ | JWT authentication |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| JavaScript | ES6+ | Client-side scripting |
| XML | - | View definitions |
| QWeb | (Odoo native) | Templating engine |
| Bootstrap | (Odoo bundled) | CSS framework |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | 28.2.2+ | OnlyOffice container |
| Nginx | Latest | Reverse proxy (production) |
| Systemd | - | Service management |
| Let's Encrypt | - | SSL certificates |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| Git | - | Version control |
| VS Code | - | Code editor |
| Claude Code | - | AI assistant |

---

## 🔐 Security Architecture

### Authentication Layers
1. **User Authentication:** Odoo session-based (cookies)
2. **API Authentication:** JWT tokens for OnlyOffice
3. **Database Authentication:** PostgreSQL user credentials
4. **Transport Security:** HTTPS (SSL/TLS) in production

### Security Best Practices Implemented
- ✅ Passwords never committed to version control
- ✅ JWT secrets generated per installation
- ✅ Database accessible only from localhost
- ✅ Odoo behind Nginx reverse proxy
- ✅ Firewall rules: Only 80/443 exposed publicly
- ✅ Access rules for Odoo models
- ✅ Regular security updates

---

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine (192.168.181.130)
├── Odoo: python3 odoo-bin -c odoo.conf --dev=all
├── OnlyOffice: Docker container (localhost:8080)
├── PostgreSQL: Local instance (localhost:5433)
└── Git: Direct commits
```

### Production Environment
```
Production Server (smb-hkt.com / 91.99.22.41)
├── Odoo: systemd service (odoo.service)
├── OnlyOffice: Docker container (internal:8080)
├── PostgreSQL: Managed or local
├── Nginx: Reverse proxy (ports 80/443)
└── Git: Pull from GitHub for updates
```

### Deployment Process
1. Develop locally with `--dev=all` flag
2. Test in local environment
3. Commit to GitHub (branch: 19.0)
4. SSH to production server
5. Pull latest changes
6. Run update script (module upgrade)
7. Restart Odoo service
8. Smoke test in production

---

## 📊 Database Schema (Key Tables)

### Core Odoo Tables
```sql
-- Users and authentication
res_users               -- User accounts
res_partner             -- Contacts (customers, suppliers, users)
res_company             -- Company information

-- Document management
ir_attachment           -- All file attachments (metadata)
                        -- Actual files in filestore/

-- Module system
ir_module_module        -- Installed modules
ir_model                -- Database models
ir_ui_view              -- UI views

-- Business data
sale_order              -- Sales orders
account_move            -- Invoices and bills
crm_lead                -- CRM leads/opportunities
product_product         -- Products
stock_picking           -- Inventory movements
```

### OnlyOffice Module Tables
```sql
-- Custom tables (if any)
onlyoffice_odoo         -- OnlyOffice configuration (settings)
```

---

## 🎨 Design Decisions

### Why Odoo 19.0 Community?
**Decision:** Use latest stable Community Edition (19.0)
**Reasoning:**
- Latest features and security patches
- Community = Free, no Enterprise license fees
- Full source code access for customization
- Large community support

**Trade-offs:**
- No Studio for drag-drop module building
- No official support (community support only)
- Some advanced features missing (vs Enterprise)

### Why OnlyOffice Integration?
**Decision:** Add OnlyOffice document server for real-time editing
**Reasoning:**
- Native office file editing in browser
- Real-time collaboration (multiple users)
- Better than downloading → editing → uploading
- Alternative to Google Docs (self-hosted)

**Trade-offs:**
- Additional infrastructure (Docker container)
- Network complexity (bidirectional communication)
- Requires Odoo 19.0 compatibility patches

### Why Docker for OnlyOffice?
**Decision:** Deploy OnlyOffice in Docker container
**Reasoning:**
- Official recommended deployment method
- Easier updates (pull new image)
- Isolated environment (doesn't affect Odoo)
- Built-in PostgreSQL and RabbitMQ

**Trade-offs:**
- Requires Docker installation
- Network configuration complexity
- Container resource overhead (~2GB RAM)

### Why http_interface = 0.0.0.0?
**Decision:** Odoo listens on all interfaces (0.0.0.0)
**Reasoning:**
- OnlyOffice Docker container on separate network
- Container cannot access 127.0.0.1 on host
- Required for OnlyOffice → Odoo callbacks

**Security Mitigation:**
- Nginx reverse proxy in front
- Firewall blocks direct access to 8069
- Production uses HTTPS only

---

## 🧭 Edition Gap Tracker (Community vs Enterprise)

Source: [odoo.com/page/editions](https://www.odoo.com/page/editions) (fetched 2025-12-22). Focused on gaps where Community = No / Enterprise = Yes. The third column is our evolving plan for replacements or custom development (update as we add modules).

**General**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Functional support | Not included | Included | In-house support + community resources; purchase partner hours if needed |
| Version upgrades | Manual/self-service | Included | Maintain our own upgrade playbooks and staging tests |
| Hosting | Self-host only | Included (Odoo Online/Odoo.sh) | Continue on-prem/VM hosting with Nginx/SSL hardening |

**User Interface**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Mobile apps (Android/iOS) | Not included | Included | Rely on responsive web/PWA; evaluate lightweight mobile shell later |

**Finance**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Accounting (GL, reconciliation, budgets, consolidation, localizations, OCR) | Not included | Included | Evaluate OCA Accounting/localization packs; custom GL + tax reporting as needed |
| AI invoice automation | Not included | Included | Optional: integrate OCR/AI (Tesseract or external API) for vendor bills |
| Payroll | Not included | Included | Consider OCA/payroll modules or localized payroll addon |
| Expense OCR | Not included | Included | Hook expenses to OCR pipeline (same as invoice OCR) |
| Payslip reimbursement | Not included | Included | Cover via chosen payroll alternative |
| Documents | Not included | Included | Use OnlyOffice + Odoo attachments; add light DMS flows if required |
| Spreadsheet | Not included | Included | Use OnlyOffice spreadsheets embedded in Odoo |
| Sign | Not included | Included | Integrate external e-sign (DocuSign/OnlyOffice Sign) or build minimal signature flow |
| ESG | Not included | Included | Defer; track future compliance add-ons if requested |

**Sales**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Subscriptions | Not included | Included | Build recurring billing on Sales/Invoices or adopt OCA subscription |
| Rental | Not included | Included | Custom rental addon (pricing + availability + returns) |
| Amazon connector | Not included | Included | Use marketplace connector (OCA/third-party) or custom SP-API integration |

**Supply Chain**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Barcode | Not included | Included | Add OCA barcode/mobile picking module; test with hardware scanners |
| MRP shopfloor/control panel/scheduling | Not included | Included | Custom shopfloor UI + scheduling views over Manufacturing |
| PLM | Not included | Included | Evaluate OCA/PLM or lightweight engineering change logs with Documents |
| Quality | Not included | Included | Add OCA quality checks/alerts; simple QC steps in Inventory if urgent |

**Human Resources**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Referrals | Not included | Included | Simple referral workflow inside Recruitment (tags + rewards) |
| Appraisals | Not included | Included | Custom performance review module (goals, cycles, manager review) |

**Marketing**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Social marketing | Not included | Included | Integrate external schedulers (e.g., Buffer) or custom social posting |
| Marketing automation | Not included | Included | Use Email/SMS with manual segments; evaluate OCA automation later |

**Services**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Timesheet grid/timer/validation | Not included | Included | Extend Timesheets with grid view + validation rules |
| Field Service | Not included | Included | Adopt OCA field-service modules or custom dispatch app |
| Helpdesk | Not included | Included | Deploy OCA helpdesk or custom ticketing on Projects |
| Planning | Not included | Included | Add scheduling layer to Projects (Gantt/slots) |
| Appointments | Not included | Included | Calendar-based booking app (community addons/custom) |

**Productivity**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Approvals | Not included | Included | Custom approval flows (server actions + records) |
| VoIP | Not included | Included | Integrate PBX/softphone (Asterisk/3CX) via SIP connectors |
| IoT | Not included | Included | Direct device/API integrations; explore open IoT box alternative |

**Customization**

| Feature | Community | Enterprise | SODO plan / alternative |
|---------|-----------|------------|-------------------------|
| Studio | Not included | Included | Code-first module development (current approach) |

---

## 📈 Scalability Considerations

### Current Capacity
- **Users:** ~20-50 concurrent users (single server)
- **Database:** ~100K records per main table
- **Documents:** Limited by disk space
- **OnlyOffice:** ~10-20 concurrent editors

### Scaling Strategy (Future)
1. **Horizontal Scaling:**
   - Multiple Odoo workers (already supported)
   - Load balancer (HAProxy/Nginx)
   - Separate DB server

2. **Vertical Scaling:**
   - Increase server RAM (Odoo benefits greatly)
   - Faster CPU for report generation
   - SSD for database

3. **Caching:**
   - Redis for session storage
   - CDN for static assets
   - Database query caching

---

## 🔮 Future Enhancements

### Planned Features
- [ ] SMS integration for notifications
- [ ] E-commerce website module
- [ ] Advanced reporting with BI tools
- [ ] Mobile app integration
- [ ] Automated backups to cloud
- [ ] Multi-company support

### Technical Improvements
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing (pytest)
- [ ] Performance monitoring (Prometheus)
- [ ] Log aggregation (ELK stack)
- [ ] Containerized Odoo (Docker)

---

## 🐛 Known Limitations

### Current Limitations
1. **OnlyOffice:** Requires manual JWT secret configuration
2. **Odoo 19.0:** Some third-party modules not yet compatible
3. **Network:** Docker container cannot use localhost URLs
4. **Access Rules:** OnlyOffice module missing security rules (warning)

### Workarounds Implemented
- JWT secret documented in deployment checklist
- Manual compatibility patches for OnlyOffice
- Use host IP (0.0.0.0) instead of localhost
- Access rules warning accepted (non-critical)

---

## 📚 Reference Documentation

### Official Documentation
- [Odoo 19.0 Docs](https://www.odoo.com/documentation/19.0/)
- [OnlyOffice Docs API](https://api.onlyoffice.com/editors/basic)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)

### Project-Specific Docs
- `.ai/context.yaml` - Current project state
- `.ai/DEVELOPMENT_LOG.md` - Issue history
- `.ai/ONLYOFFICE_PRODUCTION_CHECKLIST.md` - Deployment guide
- `.ai/sessions/` - Session-by-session logs

### External Resources
- [Odoo GitHub](https://github.com/odoo/odoo)
- [OnlyOffice GitHub](https://github.com/ONLYOFFICE/onlyoffice_odoo)
- [SODOO Workspace](https://github.com/zzafercakar/sodoo) - Complete workspace
- [SODOO Odoo Fork](https://github.com/zzafercakar/odoo) - Odoo core with SODOOC

---

## 📝 Change Log

### Version 1.1.0 - 2025-12-22
**Added edition gap tracker with replacement plan**

- Captured Community vs Enterprise differences from odoo.com/editions
- Added third-column roadmap for SODO alternatives/replacements
- Updated metadata (Last Updated + document version)

### Version 1.0.0 - 2025-12-16
**Initial architecture document created**

Key Points Documented:
- System architecture diagrams
- Component responsibilities
- Data flow descriptions
- Technology stack details
- Security architecture
- Design decisions with reasoning
- Known limitations and workarounds

**Status:** Development environment complete, production deployment 85% complete

**Next Updates:** Document final production deployment, add performance metrics, expand future enhancements section as project evolves.

---

## 🤝 Contributing to This Document

When to update this document:
- ✅ New module added to system
- ✅ Architecture changed (new services, removed components)
- ✅ Major technology upgrade (Python, PostgreSQL, etc.)
- ✅ New integration added (payment gateway, shipping, etc.)
- ✅ Security model changed
- ✅ Scalability improvements implemented
- ✅ Design decision made (document reasoning)

**Update Protocol:**
1. Edit this file with changes
2. Update "Change Log" section with date and changes
3. Update "Last Updated" date at top
4. Commit with descriptive message
5. Update `.ai/context.yaml` if needed

---

---

## 🎨 Branding & Icon System (ZC-20251223)

### Favicon ve İkon Mimarisi

SODOO ve SODOOC markaları için tüm platformlarda tutarlı görsel kimlik sağlayan ikon sistemi.

#### Kaynak Dosyalar (SVG)

**Lokasyon:** `/home/embed/Dev/ODOO/logos/`

```
logos/
├── sodoo-favicon.svg       # SODOO ana logo (turuncu, kalınlaştırılmış)
├── sodooc-favicon.svg      # SODOOC ana logo (yeşil/mavi, kalınlaştırılmış)
└── FAVICON-README.md       # Detaylı dokümantasyon
```

**Logo Özellikleri:**
- Stroke genişliği: 13.75px (2x kalınlaştırılmış)
- Ok işareti: scale(2) (2x büyütülmüş)
- Format: SVG (vektörel, ölçeklenebilir)
- Renk: SODOO (#DD4814 turuncu), SODOOC (#8BB955 yeşil + #446995 mavi)

#### Platform-Specific İkonlar

**Kaynak: logos/ Dizini (Tüm ikonlar buradan!)**
```
/opt/sodoo/logos/                    # Production
/home/embed/Dev/SODOO/logos/         # Development
├── sodoo-favicon.ico       # Multi-size (16-256px)
├── sodoo-icon-16x16.png    # Tarayıcı sekmesi (küçük)
├── sodoo-icon-32x32.png    # Tarayıcı sekmesi (orta)
├── sodoo-icon-48x48.png    # Tarayıcı sekmesi (büyük)
├── sodoo-icon-64x64.png    # Yüksek DPI ekranlar
├── sodoo-icon-128x128.png  # App ikon
├── sodoo-icon-192x192.png  # PWA standart
├── sodoo-icon-256x256.png  # PWA/App
├── sodoo-icon-512x512.png  # PWA yüksek çözünürlük
├── sodoo-icon-ios-120.png  # iPhone
├── sodoo-icon-ios-152.png  # iPad
├── sodoo-icon-ios-167.png  # iPad Pro
├── sodoo-icon-ios-180.png  # iPhone Retina
├── sodooc-favicon.ico      # SODOOC multi-size ICO
└── sodooc-icon-*.png       # SODOOC PNG ikonları
```

#### Odoo Entegrasyonu

**1. Web Template (webclient_templates.xml)**

```xml
<!-- Line 23: Favicon -->
<link type="image/x-icon" rel="shortcut icon"
      t-att-href="x_icon or '/web/static/img/sodoo-favicon.ico'"/>

<!-- Line 282: Apple Touch Icon -->
<link rel="apple-touch-icon"
      href="/web/static/img/sodoo-icon-ios.png"/>
```

**2. PWA Manifest (webmanifest.py)**

```python
# Line 54-59: PWA Icons
icon_sizes = ['192x192', '512x512']
manifest['icons'] = [{
    'src': '/web/static/img/sodoo-icon-%s.png' % size,
    'sizes': size,
    'type': 'image/png',
} for size in icon_sizes]

# Line 92: Offline Icon
def _icon_path(self):
    return 'web/static/img/sodoo-icon-192x192.png'
```

#### İkon Oluşturma Pipeline

**Araçlar:**
- Inkscape: SVG → PNG render (yüksek kalite)
- Python PIL/Pillow: ICO oluşturma, resize
- ImageMagick: PNG optimize

**Workflow:**
```bash
cd /opt/sodoo/logos   # Production
# veya: cd /home/embed/Dev/SODOO/logos   # Development

# 1. SVG → PNG (Inkscape) - tüm boyutlar
for size in 16 32 48 64 128 192 256 512; do
  inkscape sodoo-logo-favicon.svg \
    --export-type=png \
    --export-filename=sodoo-icon-${size}x${size}.png \
    -w $size -h $size
done

# 2. iOS boyutları
for size in 120 152 167 180; do
  inkscape sodoo-logo-favicon.svg \
    --export-type=png \
    --export-filename=sodoo-icon-ios-${size}.png \
    -w $size -h $size
done

# 3. Multi-size ICO (ImageMagick convert)
convert sodoo-icon-16x16.png sodoo-icon-32x32.png sodoo-icon-48x48.png \
        sodoo-icon-64x64.png sodoo-icon-128x128.png sodoo-icon-256x256.png \
        sodoo-favicon.ico

# 4. Git'e commit
git add *.ico *.png
git commit -m "chore: Update favicon icons"
git push origin master

# 5. Production'a deployment
ssh root@smb-hkt.com "cd /opt/sodoo && git pull origin master && systemctl restart odoo"
```

#### Best Practices

**Tasarım:**
- ✅ SVG kaynak dosyasından oluştur (kalite)
- ✅ Şeffaf arka plan kullan (RGBA)
- ✅ En-boy oranını koru
- ✅ Minimum 512x512 boyutunda master dosya

**Teknik:**
- ✅ PNG optimize et (dosya boyutu)
- ✅ Multi-size ICO oluştur (tarayıcı uyumluluğu)
- ✅ Platform-specific boyutlara uy
- ✅ Cache-busting için versiyon ekle (gerekirse)

**Dokümantasyon:**
- ✅ Tüm boyutları dokümante et
- ✅ Kullanım alanlarını belirt
- ✅ Oluşturma komutlarını kaydet
- ✅ Deployment prosedürünü yaz

---

**Document Version:** 1.2.0
**Last Updated:** 2025-12-23
**Maintained By:** Project Team & AI Agents
**Next Review:** When major architectural change occurs
