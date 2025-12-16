# 🚀 Deployment and Usage Guide - Simple & Clear

**Last Updated:** 2025-12-16
**Version:** 1.0.0
**Target Audience:** Anyone (technical or non-technical)

---

## 📖 What Is This Project?

**Odoo 19.0 Community Edition** - A complete business management system (ERP) with:
- Customer Management (CRM)
- Sales & Invoicing
- Inventory Management
- Accounting
- **OnlyOffice Integration** - Edit Word/Excel/PowerPoint files directly in browser

---

## 🎯 Quick Overview

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Users → Web Browser → Odoo → Database             │
│                          ↓                          │
│                     OnlyOffice                      │
│                   (Document Editor)                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📦 What's Included

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Odoo** | Main application | Python 3.10 |
| **OnlyOffice** | Document editor | Docker container |
| **PostgreSQL** | Database | PostgreSQL 16 |
| **Nginx** | Web server (production) | Nginx + SSL |

---

## 🖥️ Deployment Guide

### A. Development Environment (Local Testing)

**Location:** `/home/embed/Dev/ODOO/odoo`

#### Step 1: Install Dependencies
```bash
# Install Python packages
cd /home/embed/Dev/ODOO/odoo
source .venv/bin/activate
pip install -r requirements.txt
pip install pyjwt  # For OnlyOffice
```

#### Step 2: Configure Database
```bash
# PostgreSQL should be running on port 5433
# Database name: odoo_smb
# Check configuration in: odoo.conf
```

#### Step 3: Start Odoo
```bash
# Development mode (with debugging)
python3 odoo-bin -c odoo.conf --dev=all

# Normal mode
python3 odoo-bin -c odoo.conf
```

#### Step 4: Install OnlyOffice Container
```bash
# Install Docker (if not installed)
sudo apt install docker.io

# Start OnlyOffice Document Server
docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver

# Get JWT secret
docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 2 '"secret"'
```

#### Step 5: Access Odoo
```
URL: http://localhost:8069
Database: odoo_smb
```

---

### B. Production Environment (smb-hkt.com)

**Location:** `/opt/odoo/odoo` on production server

#### Step 1: Initial Server Setup
```bash
# SSH to production server
ssh root@smb-hkt.com

# Install system packages
sudo apt update
sudo apt install -y python3.10 python3-pip postgresql-16 nginx docker.io
```

#### Step 2: Deploy Odoo
```bash
# Clone or copy Odoo
cd /opt/odoo
git clone https://github.com/zcakar/odoo.git
cd odoo
git checkout 19.0

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pyjwt
```

#### Step 3: Configure Odoo
```bash
# Copy and edit configuration
sudo cp odoo.conf.example /etc/odoo/odoo.conf
sudo nano /etc/odoo/odoo.conf

# Required settings:
[options]
db_name = odoo_smb
addons_path = /opt/odoo/odoo/custom_addons,/opt/odoo/odoo/addons
http_interface = 0.0.0.0  # CRITICAL for OnlyOffice
logfile = /var/log/odoo/odoo.log
proxy_mode = True
```

#### Step 4: Setup Database
```bash
# Create PostgreSQL user and database
sudo -u postgres createuser -s odoo
sudo -u postgres createdb odoo_smb
```

#### Step 5: Install OnlyOffice
```bash
# Start Docker container
sudo docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver

# Wait 30 seconds for container to start
sleep 30

# Check health
curl http://localhost:8080/healthcheck
# Should return: true

# Get JWT secret (IMPORTANT - save this!)
sudo docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 2 '"secret"'
```

#### Step 6: Create Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/odoo.service
```

**Service file content:**
```ini
[Unit]
Description=Odoo Community
After=network.target postgresql.service

[Service]
Type=simple
User=odoo
Group=odoo
ExecStart=/opt/odoo/odoo/venv/bin/python3 /opt/odoo/odoo/odoo-bin -c /etc/odoo/odoo.conf
StandardOutput=journal+console
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable odoo
sudo systemctl start odoo
sudo systemctl status odoo
```

#### Step 7: Configure Nginx (SSL)
```bash
# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/odoo
```

**Nginx config:**
```nginx
upstream odoo {
    server 127.0.0.1:8069;
}

server {
    listen 80;
    server_name smb-hkt.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smb-hkt.com;

    ssl_certificate /etc/letsencrypt/live/smb-hkt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smb-hkt.com/privkey.pem;

    location / {
        proxy_pass http://odoo;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/odoo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d smb-hkt.com
```

#### Step 8: Install OnlyOffice Module
```bash
# Stop Odoo
sudo systemctl stop odoo

# Install module
sudo -u odoo /opt/odoo/odoo/venv/bin/python3 /opt/odoo/odoo/odoo-bin \
  -c /etc/odoo/odoo.conf \
  -d odoo_smb \
  -i onlyoffice_odoo \
  --stop-after-init

# Start Odoo
sudo systemctl start odoo
```

---

## ⚙️ Configuration Guide

### 1. First Login

```
URL: https://smb-hkt.com (production) or http://localhost:8069 (development)
```

1. Open URL in browser
2. Choose database: **odoo_smb**
3. Create admin user:
   - Email: your@email.com
   - Password: (strong password)
   - Company name: Your Company

### 2. Configure OnlyOffice

1. **Go to:** Settings → General Settings
2. **Scroll down to:** ONLYOFFICE section
3. **Fill in:**

| Field | Value |
|-------|-------|
| ONLYOFFICE Docs address | `http://YOUR_IP:8080/` or `https://onlyoffice.yourdomain.com/` |
| ONLYOFFICE Docs secret key | (JWT secret from OnlyOffice container) |
| JWT Header | `Authorization` |
| ONLYOFFICE Docs address for internal requests from the server | `https://yourodoo.com/` |

4. **Click:** Save

### 3. Verify OnlyOffice Works

1. Go to **Contacts** module
2. Open any contact (e.g., "My Company")
3. Click **📎 Attachment** icon
4. Upload a .docx file
5. Hover over the file
6. Click **✏️ Edit in ONLYOFFICE**
7. Editor should open! ✅

---

## 📚 Usage Guide

### For Regular Users

#### How to Edit Documents

1. **Find your document:**
   - In any module (Contacts, Sales, Projects, etc.)
   - Look for attachments

2. **Open editor:**
   - Hover over document
   - Click "Edit in ONLYOFFICE"

3. **Edit:**
   - Document opens in browser
   - Edit like Microsoft Office
   - Auto-saves every few seconds

4. **Collaborate:**
   - Multiple users can edit simultaneously
   - See other users' cursors in real-time
   - Built-in chat and comments

#### Supported File Types

- **Text:** .docx, .doc, .odt
- **Spreadsheet:** .xlsx, .xls, .ods
- **Presentation:** .pptx, .ppt, .odp

### For Administrators

#### Check System Status

**Development:**
```bash
# Odoo status
ps aux | grep odoo-bin

# OnlyOffice status
docker ps | grep onlyoffice

# Database status
psql -l | grep odoo_smb
```

**Production:**
```bash
# Odoo service
sudo systemctl status odoo

# OnlyOffice container
sudo docker ps | grep onlyoffice

# Nginx
sudo systemctl status nginx

# View logs
sudo journalctl -u odoo -f  # Odoo logs
sudo docker logs onlyoffice-documentserver | tail -50  # OnlyOffice logs
```

#### Update Odoo

**Development:**
```bash
cd /home/embed/Dev/ODOO/odoo
git pull origin 19.0
source .venv/bin/activate
pip install -r requirements.txt
python3 odoo-bin -c odoo.conf -u all
```

**Production:**
```bash
# Stop service
sudo systemctl stop odoo

# Pull updates
cd /opt/odoo/odoo
sudo -u odoo git pull origin 19.0

# Update dependencies
sudo -u odoo /opt/odoo/odoo/venv/bin/pip install -r requirements.txt

# Update modules
sudo -u odoo /opt/odoo/odoo/venv/bin/python3 /opt/odoo/odoo/odoo-bin \
  -c /etc/odoo/odoo.conf \
  -d odoo_smb \
  -u all \
  --stop-after-init

# Start service
sudo systemctl start odoo
```

#### Backup & Restore

**Backup:**
```bash
# Database backup
sudo -u postgres pg_dump odoo_smb > backup_$(date +%Y%m%d).sql

# Filestore backup (attachments)
tar -czf filestore_backup_$(date +%Y%m%d).tar.gz /opt/odoo/odoo/.local/share/Odoo/filestore/
```

**Restore:**
```bash
# Restore database
sudo -u postgres psql odoo_smb < backup_20251216.sql

# Restore filestore
tar -xzf filestore_backup_20251216.tar.gz -C /
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Odoo Won't Start

**Check:**
```bash
# View logs
sudo journalctl -u odoo -n 50

# Common issues:
# - Database not running
# - Port 8069 already in use
# - Wrong config file path
```

**Fix:**
```bash
# Start database
sudo systemctl start postgresql

# Kill process on port 8069
sudo kill $(sudo lsof -t -i:8069)

# Verify config
sudo nano /etc/odoo/odoo.conf
```

#### 2. OnlyOffice Cannot Be Reached

**Check:**
```bash
# Container running?
docker ps | grep onlyoffice

# Healthcheck
curl http://localhost:8080/healthcheck
```

**Fix:**
```bash
# Start container
docker start onlyoffice-documentserver

# Restart container
docker restart onlyoffice-documentserver

# Check Odoo config has: http_interface = 0.0.0.0
grep http_interface /etc/odoo/odoo.conf
```

#### 3. Edit Button Not Showing

**Cause:** Odoo 19.0 compatibility patches missing

**Fix:**
Check these files have Odoo 19.0 patches:
- `custom_addons/onlyoffice_odoo/views/res_config_settings_views.xml`
- `custom_addons/onlyoffice_odoo/views/attachment_card_onlyoffice.xml`
- `custom_addons/onlyoffice_odoo/controllers/controllers.py`

See: `.ai/DEVELOPMENT_LOG.md` for patch details

#### 4. Authorization Error

**Cause:** Wrong JWT secret

**Fix:**
```bash
# Get correct secret
docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 2 '"secret"'

# Update in Odoo: Settings → ONLYOFFICE → Secret key
```

---

## 🔐 Security Checklist

### Production Security (MANDATORY)

- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured:
  - Port 80/443: Open (Nginx)
  - Port 8069: Closed externally (localhost only)
  - Port 8080: Closed externally (OnlyOffice internal)
- [ ] Strong admin password
- [ ] Database password set
- [ ] Regular backups automated
- [ ] JWT secret unique and strong
- [ ] Odoo updated regularly

### Firewall Rules

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Block Odoo direct access (use Nginx instead)
# Port 8069 only accessible via localhost

# Block OnlyOffice direct access
# Port 8080 only accessible via localhost

# Enable firewall
sudo ufw enable
```

---

## 📊 Performance Tips

### For Small Teams (1-20 users)

```ini
# odoo.conf
workers = 4
limit_memory_hard = 2684354560  # 2.5 GB
limit_memory_soft = 2147483648  # 2 GB
limit_time_cpu = 600
limit_time_real = 1200
```

### For Medium Teams (20-100 users)

```ini
# odoo.conf
workers = 8
limit_memory_hard = 4294967296  # 4 GB
limit_memory_soft = 3221225472  # 3 GB
limit_time_cpu = 600
limit_time_real = 1200
```

**Server Requirements:**
- RAM: 8GB minimum (16GB recommended)
- CPU: 4 cores minimum
- Disk: 50GB SSD minimum

---

## 📞 Getting Help

### Resources

1. **Project Documentation:**
   - `.ai/context.yaml` - Project state
   - `.ai/PROJECT_ARCHITECTURE.md` - System architecture
   - `.ai/DEVELOPMENT_LOG.md` - Known issues & solutions

2. **Official Documentation:**
   - [Odoo 19.0 Docs](https://www.odoo.com/documentation/19.0/)
   - [OnlyOffice API Docs](https://api.onlyoffice.com/editors/basic)

3. **Community:**
   - [Odoo Forum](https://www.odoo.com/forum)
   - [OnlyOffice Forum](https://forum.onlyoffice.com/)

### Common Commands Quick Reference

```bash
# Restart Odoo (production)
sudo systemctl restart odoo

# View Odoo logs
sudo journalctl -u odoo -f

# Restart OnlyOffice
docker restart onlyoffice-documentserver

# Check system status
sudo systemctl status odoo nginx postgresql
docker ps
```

---

## 📝 Maintenance Schedule

### Daily
- Monitor logs for errors
- Check disk space

### Weekly
- Database backup
- Security updates

### Monthly
- Full system backup
- Review user access
- Check for Odoo updates

---

## 🔄 Update History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-16 | 1.0.0 | Initial deployment guide created |

---

## 🤖 For AI Agents

**CRITICAL:** This file must be kept up-to-date!

**When to Update:**
- After deployment steps change
- After configuration changes
- When troubleshooting new issues
- After software updates (Odoo, OnlyOffice, etc.)
- When best practices change

**Update Protocol:**
1. Make changes to this file
2. Update "Last Updated" date at top
3. Add entry to "Update History" table at bottom
4. Commit to Git with clear message
5. Inform user of changes

---

**Document Version:** 1.0.0
**Maintainer:** AI Agents + Project Team
**License:** Internal Use
