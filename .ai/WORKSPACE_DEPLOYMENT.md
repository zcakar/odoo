# SODOO Workspace Deployment Guide

**Last Updated:** 2025-12-25
**Primary Repo:** https://github.com/zzafercakar/sodoo

---

## 📋 Repository Structure

```
https://github.com/zzafercakar/sodoo (WORKSPACE - PRIMARY)
├── .gitignore
├── .gitmodules
├── .ai/                         # AI context & documentation
├── custom_addons/
│   └── onlyoffice_odoo/        # SODOOC module
├── logos/                       # SODOO branding assets (all icons generated here)
│   ├── sodoo-logo.svg          # Main logo
│   ├── sodoo-logo-favicon.svg  # Favicon source
│   ├── sodoo-favicon.ico       # Multi-size ICO (16-256px)
│   ├── sodoo-icon-*.png        # PNG icons (16-512px)
│   ├── sodooc-*.svg/png/ico    # SODOOC variants
│   └── ...
├── odoo/                        # Submodule → zzafercakar/odoo:19.0
├── odoo.code-workspace
└── sodoo_logo_font.py

https://github.com/zzafercakar/odoo (ODOO CORE - Submodule)
├── addons/                      # Odoo core modules
├── custom_addons/               # Custom modules
└── odoo-bin                     # Main executable
```

---

## 🚀 Production Deployment

### Current Production Structure

**Server:** smb-hkt.com
**Location:** `/opt/sodoo`
**Database:** `sodoo_smb`

```
/opt/sodoo/                      # Workspace root (cloned from GitHub)
├── .ai/                         # AI documentation
├── custom_addons/
│   └── onlyoffice_odoo/        # SODOOC module
├── logos/                       # All branding assets
├── odoo/                        # Odoo core (submodule)
│   ├── addons/                  # Core Odoo modules
│   ├── odoo-bin                 # Main executable
│   └── requirements.txt
└── venv/                        # Python virtual environment
```

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
cd ..

# 3. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r odoo/requirements.txt
pip install pyjwt

# 4. Configure Odoo
sudo mkdir -p /etc/odoo
sudo cp odoo/odoo.conf.example /etc/odoo/odoo.conf
sudo nano /etc/odoo/odoo.conf

# Required settings in /etc/odoo/odoo.conf:
# addons_path = /opt/sodoo/custom_addons,/opt/sodoo/odoo/addons
# http_interface = 0.0.0.0
# logfile = /var/log/odoo/odoo.log
# proxy_mode = True

# 5. Create systemd service
sudo nano /etc/systemd/system/odoo.service
```

**Systemd Service File:**
```ini
[Unit]
Description=SODOO - Odoo Community
After=network.target postgresql.service

[Service]
Type=simple
User=odoo
Group=odoo
ExecStart=/opt/sodoo/venv/bin/python3 /opt/sodoo/odoo/odoo-bin -c /etc/odoo/odoo.conf
StandardOutput=journal+console
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 6. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable odoo
sudo systemctl start odoo
```

### Updates & Maintenance

```bash
# Update workspace
cd /opt/sodoo
git pull origin master

# Update odoo submodule
cd odoo
git pull origin 19.0
cd ..

# Restart Odoo
sudo systemctl restart odoo
```

---

## ⚠️ IMPORTANT RULES

### 1. Primary Deployment Source
- ✅ **ALWAYS** deploy from `zzafercakar/sodoo` workspace
- ❌ **NEVER** deploy from `zzafercakar/odoo` directly
- The workspace contains the complete SODOO system

### 2. Logo Source
- ✅ **ALL logos** come from `/opt/sodoo/logos/`
- ✅ Generate favicons from SVG sources in logos directory
- ❌ **NEVER** create logos elsewhere

### 3. Submodule Management
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
sudo systemctl restart odoo
```

---

## 📝 Current Production State

**Server:** smb-hkt.com
**Location:** `/opt/sodoo`
**Database:** `sodoo_smb`
**URLs:**
- Main: https://smb-hkt.com/sodoo/
- Editor: https://smb-hkt.com/sodooc/editor/{id}

**Current JWT Keys (2025-12-24):**
- Doc Server: `3345e7434a9910d10dc7af04f46a869a`
- Internal: `13b434b52fce00e2e3a5c5bb7d13ada4`

---

## 🎨 Logo & Favicon Management

All logos are stored in `/opt/sodoo/logos/` and generated from SVG sources.

### Available Logos
```
logos/
├── sodoo-logo.svg              # Main SODOO logo
├── sodoo-logo-favicon.svg      # Favicon source (square)
├── sodoo-favicon.ico           # Multi-size ICO (16,32,48,64,128,256px)
├── sodoo-icon-16x16.png        # Browser tab (small)
├── sodoo-icon-32x32.png        # Browser tab (medium)
├── sodoo-icon-48x48.png        # Browser tab (large)
├── sodoo-icon-64x64.png        # High DPI
├── sodoo-icon-128x128.png      # App icon
├── sodoo-icon-192x192.png      # PWA standard
├── sodoo-icon-256x256.png      # PWA/App
├── sodoo-icon-512x512.png      # PWA high-res
├── sodoo-icon-ios-120.png      # iPhone
├── sodoo-icon-ios-152.png      # iPad
├── sodoo-icon-ios-167.png      # iPad Pro
├── sodoo-icon-ios-180.png      # iPhone Retina
├── sodooc-logo.svg             # SODOOC (OnlyOffice) logo
├── sodooc-logo-favicon.svg     # SODOOC favicon source
├── sodooc-favicon.ico          # SODOOC multi-size ICO
└── sodooc-icon-*.png           # SODOOC PNG icons
```

### Regenerating Icons from SVG
```bash
cd /opt/sodoo/logos

# Generate PNG from SVG
inkscape sodoo-logo-favicon.svg --export-type=png --export-filename=sodoo-icon-512x512.png -w 512 -h 512

# Generate multi-size ICO
convert sodoo-icon-16x16.png sodoo-icon-32x32.png sodoo-icon-48x48.png \
        sodoo-icon-64x64.png sodoo-icon-128x128.png sodoo-icon-256x256.png \
        sodoo-favicon.ico
```

---

**Maintained By:** SODOO Team
**License:** LGPL-3

