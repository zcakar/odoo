# SODOO Workspace Deployment Guide

**Last Updated:** 2025-12-24  
**Primary Repo:** https://github.com/zzafercakar/sodoo (Private)

---

## 📋 Repository Structure

```
https://github.com/zzafercakar/sodoo (WORKSPACE - PRIMARY)
├── .gitignore
├── .gitmodules
├── custom_addons/
│   └── onlyoffice_odoo/        # SODOOC module
├── logos/                       # SODOO branding assets
├── odoo/                        # Submodule → zzafercakar/odoo:19.0
├── odoo.code-workspace
└── sodoo_logo_font.py

https://github.com/zzafercakar/odoo (ODOO CORE - Submodule)
├── .ai/                         # AI context & documentation
├── addons/                      # Odoo core modules
├── custom_addons/               # Custom modules
└── odoo-bin                     # Main executable
```

---

## 🚀 Production Deployment

### Initial Setup

```bash
# 1. Clone workspace with submodules
cd /opt
git clone --recursive https://github.com/zzafercakar/sodoo.git
cd sodoo

# 2. Verify submodule
cd odoo
git status
git checkout 19.0

# 3. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pyjwt

# 4. Configure Odoo
cp /etc/odoo/odoo.conf.template /etc/odoo/odoo.conf
# Edit odoo.conf with correct paths

# 5. Start services
systemctl start odoo
```

### Updates & Maintenance

```bash
# Update workspace
cd /opt/sodoo
git pull origin master

# Update odoo submodule
cd odoo
git pull origin 19.0

# Restart Odoo
systemctl restart odoo
```

---

## ⚠️ IMPORTANT RULES

### 1. Primary Deployment Source
- ✅ **ALWAYS** deploy from `zzafercakar/sodoo` workspace
- ❌ **NEVER** deploy from `zzafercakar/odoo` directly
- The workspace contains the complete SODOO system

### 2. Submodule Management
```bash
# Initialize submodules
git submodule update --init --recursive

# Update submodule to latest
cd odoo
git pull origin 19.0
cd ..
git add odoo
git commit -m "chore: Update odoo submodule"
git push origin master
```

### 3. Development Workflow
```bash
# Work on odoo core
cd /opt/sodoo/odoo
git checkout -b feature/my-feature
# Make changes
git commit -am "feat: My feature"
git push origin feature/my-feature

# Update workspace to use new commit
cd /opt/sodoo
git add odoo
git commit -m "chore: Update odoo submodule to feature/my-feature"
git push origin master
```

---

## 🔑 JWT Secret Management

After container restart, JWT secrets must be regenerated:

```bash
# Generate new secrets
NEW_DOC_SECRET=$(openssl rand -hex 16)
NEW_INTERNAL_SECRET=$(openssl rand -hex 16)

# Update Odoo database
sudo -u postgres psql -d sodoo_smb -c \
  "UPDATE ir_config_parameter SET value = '$NEW_DOC_SECRET' \
   WHERE key = 'onlyoffice_connector.doc_server_jwt_secret';"

sudo -u postgres psql -d sodoo_smb -c \
  "UPDATE ir_config_parameter SET value = '$NEW_INTERNAL_SECRET' \
   WHERE key = 'onlyoffice_connector.internal_jwt_secret';"

# Update OnlyOffice config
docker exec onlyoffice-documentserver bash -c \
  "sed -i 's/\"string\": \"[^\"]*\"/\"string\": \"$NEW_DOC_SECRET\"/g' \
   /etc/onlyoffice/documentserver/local.json"

# Restart services
docker exec onlyoffice-documentserver supervisorctl restart all
systemctl restart odoo
```

---

## 📝 Current Production State

**Server:** smb-hkt.com  
**Location:** `/opt/odoo/odoo` (legacy path, should migrate to `/opt/sodoo`)  
**Database:** `sodoo_smb`  
**URLs:**
- Main: https://smb-hkt.com/sodoo/
- Editor: https://smb-hkt.com/sodooc/editor/{id}

**Current JWT Keys (2025-12-24):**
- Doc Server: `3345e7434a9910d10dc7af04f46a869a`
- Internal: `13b434b52fce00e2e3a5c5bb7d13ada4`

---

## 🔄 Migration Plan (Future)

Current production is at `/opt/odoo/odoo`. Should migrate to:

```bash
# New structure
/opt/sodoo/              # Workspace root
├── odoo/                # Odoo core (submodule)
├── custom_addons/       # Custom modules
└── logos/               # Branding assets
```

This will align production with the workspace structure.

---

**Maintained By:** SODOO Team  
**License:** LGPL-3

