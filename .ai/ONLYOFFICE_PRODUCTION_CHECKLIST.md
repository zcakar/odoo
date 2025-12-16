# OnlyOffice Production Deployment Checklist

Bu döküman, OnlyOffice modülünü production sunucuya (smb-hkt.com) deploy etmek için gereken adımları içerir.

## 📋 Ön Hazırlık (Production Sunucuda)

### 1. OnlyOffice Document Server Kurulumu

**Seçenek A: Docker (Önerilen)**
```bash
# Docker kurulu değilse
sudo apt update && sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# OnlyOffice Document Server container'ı
sudo docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver
```

**Seçenek B: Subdomain ile (daha profesyonel)**
```bash
# onlyoffice.smb-hkt.com için Nginx config
# /etc/nginx/sites-available/onlyoffice.smb-hkt.com

upstream onlyoffice {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name onlyoffice.smb-hkt.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name onlyoffice.smb-hkt.com;

    ssl_certificate /etc/letsencrypt/live/onlyoffice.smb-hkt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/onlyoffice.smb-hkt.com/privkey.pem;

    location / {
        proxy_pass http://onlyoffice;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# SSL sertifikası
sudo certbot --nginx -d onlyoffice.smb-hkt.com

# Nginx restart
sudo systemctl restart nginx
```

### 2. JWT Secret Key Al

```bash
# Docker container'dan secret'ı al
sudo docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 2 '"secret"'

# Çıktı:
# "secret": {
#   "browser": {
#     "string": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Bu secret'ı not edin!
```

### 3. Firewall Kuralları

```bash
# OnlyOffice port'u (sadece localhost'tan erişilebilir olmalı - Nginx reverse proxy kullanıyorsak)
# Eğer subdomain kullanmıyorsak ve direkt IP:8080 erişimi gerekiyorsa:
sudo ufw allow 8080/tcp
```

---

## 🚀 Odoo Modülü Deployment

### 1. Dosyaları Production Sunucuya Kopyala

**Development'tan:**
```bash
# Custom addons klasörünü tar'la
cd /home/embed/Dev/ODOO/odoo
tar -czf onlyoffice_module.tar.gz custom_addons/onlyoffice_odoo

# Production'a kopyala
scp onlyoffice_module.tar.gz root@smb-hkt.com:/tmp/
```

**Production'da:**
```bash
# Extract
cd /opt/odoo/odoo
sudo tar -xzf /tmp/onlyoffice_module.tar.gz

# Ownership düzelt
sudo chown -R odoo:odoo custom_addons/onlyoffice_odoo
```

### 2. Odoo 19.0 Uyumluluk Yamalarını Kontrol Et

**ÖNEMLI: Bu yamalar development'ta uygulandı, production'a kopyalandı, ama yine de kontrol edin!**

```bash
# 1. views/res_config_settings_views.xml (satır 117)
sudo nano /opt/odoo/odoo/custom_addons/onlyoffice_odoo/views/res_config_settings_views.xml

# Satır 117'de:
# <field name="target">current</field>  ✅ (inline değil!)

# 2. views/attachment_card_onlyoffice.xml
sudo nano /opt/odoo/odoo/custom_addons/onlyoffice_odoo/views/attachment_card_onlyoffice.xml

# XPath şu şekilde olmalı:
# <xpath expr="//div[hasclass('o-mail-AttachmentButtons')]" position="inside">  ✅

# 3. controllers/controllers.py (satır ~179)
sudo nano /opt/odoo/odoo/custom_addons/onlyoffice_odoo/controllers/controllers.py

# Şu satır olmalı:
# attachment._can_return_content(access_token=access_token)  ✅
# (validate_access değil!)
```

### 3. Python Bağımlılıklarını Kur

```bash
# Production venv'i aktifleştir
cd /opt/odoo/odoo
source venv/bin/activate  # veya source .venv/bin/activate

# PyJWT kur
pip install pyjwt
```

### 4. Odoo Config Güncelle

```bash
sudo nano /etc/odoo/odoo.conf
```

**Ekle:**
```ini
[options]
...
addons_path = /opt/odoo/odoo/odoo/addons,/opt/odoo/odoo/custom_addons
...
# OnlyOffice callback'leri için (Nginx arkasında ise)
http_interface = 0.0.0.0
```

**⚠️ ÖNEMLİ:** `http_interface = 0.0.0.0` gerekli ama güvenlik riski!
- Nginx reverse proxy **MUTLAKA** kullanılmalı
- Firewall sadece 80/443 portlarını açık tutmalı
- 8069 portu sadece localhost'tan erişilebilir olmalı

### 5. Modülü Kur

```bash
# Odoo servisini durdur
sudo systemctl stop odoo

# Modülü kur
cd /opt/odoo/odoo
sudo -u odoo /opt/odoo/odoo/venv/bin/python3 odoo-bin \
  -c /etc/odoo/odoo.conf \
  -d odoo_smb \
  -i onlyoffice_odoo \
  --stop-after-init

# Hata yoksa devam et
```

### 6. Odoo Servisini Başlat

```bash
sudo systemctl start odoo
sudo systemctl status odoo

# Log kontrol
sudo tail -f /var/log/odoo/odoo.log
```

---

## ⚙️ Odoo UI'da Konfigürasyon

1. **Odoo'ya giriş yap:** https://smb-hkt.com
2. **Settings → General Settings** sayfasına git
3. **ONLYOFFICE** bölümünü bul
4. **Alanları doldur:**

| Alan | Değer |
|------|-------|
| **ONLYOFFICE Docs address** | `https://onlyoffice.smb-hkt.com/` (subdomain kullanıyorsan)<br>veya<br>`http://91.99.22.41:8080/` (direkt IP) |
| **ONLYOFFICE Docs secret key** | Docker'dan aldığın JWT secret |
| **JWT Header** | `Authorization` |
| **ONLYOFFICE Docs address for internal requests from the server** | `https://smb-hkt.com/` (Odoo'nun kendi URL'i) |
| **Server address for internal requests from ONLYOFFICE Docs** | BOŞ BIRAK veya `https://onlyoffice.smb-hkt.com/` |

5. **SAVE** butonuna bas
6. **Hata gelmediğini kontrol et**

---

## ✅ Test

### 1. Bağlantı Testi

```bash
# OnlyOffice healthcheck
curl https://onlyoffice.smb-hkt.com/healthcheck
# Beklenen: true

# Odoo erişim
curl https://smb-hkt.com/web
# Beklenen: HTML içeriği
```

### 2. UI Testi

1. **Contacts** modülüne git
2. Bir contact aç (ör: My Company)
3. **📎 Attachment** ikonuna tıkla
4. Bir Office dosyası yükle (.docx, .xlsx, .pptx)
5. Dosya üzerine mouse götür
6. **✏️ Edit in ONLYOFFICE** butonuna tıkla
7. OnlyOffice editörü açılmalı!
8. Belgeyi düzenle
9. Otomatik kayıt olmalı

---

## 🔧 Troubleshooting

### "ONLYOFFICE cannot be reached"

**Kontrol et:**
```bash
# OnlyOffice çalışıyor mu?
sudo docker ps | grep onlyoffice

# Healthcheck
curl http://localhost:8080/healthcheck  # Sunucu içinden

# Dışarıdan
curl https://onlyoffice.smb-hkt.com/healthcheck

# Firewall
sudo ufw status

# Nginx
sudo nginx -t
sudo systemctl status nginx
```

### "Authorization error"

**Sebep:** JWT secret yanlış veya eksik

**Çözüm:**
```bash
# Secret'ı tekrar al
sudo docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 2 '"secret"'

# Odoo UI'da güncelle
```

### "500 Internal Server Error"

**Sebep:** Odoo 19.0 uyumluluk yamalarından biri eksik

**Çözüm:**
```bash
# Odoo log'larına bak
sudo tail -100 /var/log/odoo/odoo.log | grep -i error

# validate_access hatası varsa:
sudo nano /opt/odoo/odoo/custom_addons/onlyoffice_odoo/controllers/controllers.py
# Satır 179'u kontrol et: _can_return_content() olmalı

# Modülü güncelle
sudo systemctl stop odoo
sudo -u odoo /opt/odoo/odoo/venv/bin/python3 odoo-bin \
  -c /etc/odoo/odoo.conf \
  -d odoo_smb \
  -u onlyoffice_odoo \
  --stop-after-init
sudo systemctl start odoo
```

### "Edit button not appearing"

**Sebep:** attachment_card_onlyoffice.xml yaması eksik

**Çözüm:**
```bash
sudo nano /opt/odoo/odoo/custom_addons/onlyoffice_odoo/views/attachment_card_onlyoffice.xml

# XPath kontrol: o-mail-AttachmentButtons olmalı
```

---

## �� Production Monitoring

### OnlyOffice Container

```bash
# Status
sudo docker ps | grep onlyoffice

# Logs
sudo docker logs onlyoffice-documentserver | tail -100

# Resource usage
sudo docker stats onlyoffice-documentserver
```

### Odoo

```bash
# Service status
sudo systemctl status odoo

# Logs
sudo tail -f /var/log/odoo/odoo.log

# Module status
# Odoo UI → Apps → ONLYOFFICE → Installed
```

---

## 🔐 Güvenlik Notları

1. **Firewall:**
   - Port 8069: Sadece localhost (Nginx reverse proxy kullanıyoruz)
   - Port 8080: Sadece localhost (OnlyOffice Docker)
   - Port 80/443: Public (Nginx)

2. **SSL/TLS:**
   - MUTLAKA HTTPS kullan (Let's Encrypt)
   - Mixed content uyarılarını engellemek için her iki servis de HTTPS'de olmalı

3. **JWT Secret:**
   - Production secret'ı kimseyle paylaşma
   - Düzenli olarak rotate et

4. **Nginx:**
   - Rate limiting ekle
   - DDoS koruması aktif et

---

## 📚 Referanslar

- Context dosyası: `.ai/context.yaml` (tam konfigürasyon detayları)
- OnlyOffice docs: https://api.onlyoffice.com/editors/basic
- Odoo docs: https://www.odoo.com/documentation/19.0/

---

**Son Güncelleme:** 2025-12-16
**Versiyon:** 1.0
**Hazırlayan:** Claude Code
