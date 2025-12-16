# Project Architecture - Odoo SMB Implementation

**Project Name:** Odoo Community Edition - SMB Implementation
**Version:** 19.0
**Purpose:** Full-featured ERP system for small/medium businesses with OnlyOffice document editing integration
**Last Updated:** 2025-12-16

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
- **Location:** `/opt/odoo/odoo/`

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
/home/embed/Dev/ODOO/odoo/          # Development
/opt/odoo/odoo/                      # Production
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
│       └── 2025-12-16_*.md
│
├── odoo/                            # Core Odoo framework
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
│   └── onlyoffice_odoo/             # OnlyOffice integration
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
- [Project GitHub](https://github.com/zcakar/odoo)

---

## 📝 Change Log

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

**Document Version:** 1.0.0
**Last Updated:** 2025-12-16
**Maintained By:** Project Team & AI Agents
**Next Review:** When major architectural change occurs
