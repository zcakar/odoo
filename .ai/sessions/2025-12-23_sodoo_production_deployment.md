# SODOO Production Deployment - 2025-12-23

**Server:** smb-hkt.com
**Task:** Deploy SODOO rebranding to production
**GitHub Commit:** 4edd9bda056
**Note:** This session was before the path migration to `/opt/sodoo`. Current path is `/opt/sodoo`.

---

## 📋 Deployment Steps

### 1. SSH to Production Server
```bash
ssh root@smb-hkt.com
```

### 2. Navigate to SODOO Directory
```bash
cd /opt/sodoo
```

### 3. Pull Latest Changes from GitHub
```bash
git pull origin master
cd odoo && git pull origin 19.0 && cd ..
```

### 4. Check Changes
```bash
git log -1 --stat
```

### 5. Restart Odoo Service
```bash
systemctl restart odoo
```

### 6. Check Service Status
```bash
systemctl status odoo
```

### 7. View Logs (if needed)
```bash
journalctl -u odoo -f
```

### 8. Update Nginx Configuration (IMPORTANT!)

Edit nginx config:
```bash
nano /etc/nginx/sites-available/smb-hkt.com
```

Add `/sodoo` location and redirect `/odoo`:
```nginx
server {
    listen 443 ssl http2;
    server_name smb-hkt.com;

    # ... existing SSL config ...

    # SODOO - New primary URL
    location /sodoo {
        proxy_pass http://127.0.0.1:8069;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Legacy /odoo redirect (backward compatibility)
    location /odoo {
        return 301 https://smb-hkt.com/sodoo$request_uri;
    }

    # ... rest of config ...
}
```

### 9. Test Nginx Configuration
```bash
nginx -t
```

### 10. Reload Nginx
```bash
systemctl reload nginx
```

---

## ✅ Verification Checklist

- [ ] Git pull successful
- [ ] Odoo service restarted
- [ ] Service status: active (running)
- [ ] Nginx config updated
- [ ] Nginx reloaded successfully
- [ ] https://smb-hkt.com/sodoo/ accessible
- [ ] https://smb-hkt.com/odoo/ redirects to /sodoo
- [ ] Login page shows SODOO logo
- [ ] Version number visible in footer
- [ ] OnlyOffice integration still works

---

## 🔍 Testing URLs

1. **New URL:** https://smb-hkt.com/sodoo/
2. **Legacy URL (should redirect):** https://smb-hkt.com/odoo/
3. **Database Manager:** https://smb-hkt.com/web/database/manager

---

## 🚨 Rollback Plan (if needed)

```bash
cd /opt/odoo/odoo
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
systemctl restart odoo
```

---

## 📝 Notes

- All `/odoo` URLs automatically redirect to `/sodoo` (301 permanent)
- Existing bookmarks will update automatically
- No database changes required
- OnlyOffice callback URLs should still work (using domain, not /odoo path)

