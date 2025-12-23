# SODOO Projesi - Değişiklik Günlüğü

Bu dosya, SODOO projesi üzerinde yapılan tüm önemli değişiklikleri kronolojik olarak kaydeder.

Format: `ZC-YYYYMMDD: Değişiklik açıklaması`

---

## ZC-20251223: Favicon ve İkon Sistemi Yenileme

### 🎨 Yapılan İşlemler

#### 1. Logo Kalınlaştırma
- **Kaynak dosyalar güncellendi:**
  - `logos/sodoo-favicon.svg` - Stroke genişliği: 6.875px → 13.75px (2x)
  - `logos/sodooc-favicon.svg` - Stroke genişliği: 6.875px → 13.75px (2x)
  - Ok işareti: scale(1) → scale(2) (2x büyütme)

#### 2. Tüm Platform İkonları Oluşturuldu

**Web Favicon:**
- Multi-size ICO dosyaları (16, 24, 32, 48, 64, 128, 256px)
- PNG formatında: 16x16, 32x32, 48x48, 64x64

**PWA (Progressive Web App):**
- 192x192px (standart)
- 512x512px (yüksek çözünürlük)

**iOS:**
- 180x180px (Apple Touch Icon - ana)
- 120x120px (iPhone)
- 152x152px (iPad)
- 167x167px (iPad Pro)

**Android:**
- 72x72px (hdpi)
- 96x96px (xhdpi)
- 144x144px (xxhdpi)
- 192x192px (xxxhdpi)

#### 3. Sunucu Deployment
- Tüm ikonlar `/opt/odoo/odoo/addons/web/static/img/` konumuna yüklendi
- Odoo servisi yeniden başlatıldı
- Mevcut template dosyaları kontrol edildi (değişiklik gerekmedi)

#### 4. Dokümantasyon
- `logos/FAVICON-README.md` oluşturuldu
- Tüm ikon boyutları ve kullanım alanları dokümante edildi

### 📁 Oluşturulan Dosyalar

**SODOO (Turuncu):**
```
sodoo-favicon.ico
sodoo-icon-16x16.png
sodoo-icon-32x32.png
sodoo-icon-48x48.png
sodoo-icon-64x64.png
sodoo-icon-192x192.png
sodoo-icon-512x512.png
sodoo-icon-ios.png (180x180)
sodoo-icon-ios-120.png
sodoo-icon-ios-152.png
sodoo-icon-ios-167.png
sodoo-new-72.png (Android hdpi)
sodoo-new-96.png (Android xhdpi)
sodoo-new-144.png (Android xxhdpi)
```

**SODOOC (Yeşil/Mavi):**
```
sodooc-favicon.ico
sodooc-icon-16x16.png
sodooc-icon-32x32.png
sodooc-icon-48x48.png
sodooc-icon-64x64.png
sodooc-icon-192x192.png
sodooc-icon-512x512.png
sodooc-icon-ios.png (180x180)
sodooc-icon-ios-120.png
sodooc-icon-ios-152.png
sodooc-icon-ios-167.png
sodooc-new-72.png (Android hdpi)
sodooc-new-96.png (Android xhdpi)
sodooc-new-144.png (Android xxhdpi)
```

### 🔧 Teknik Detaylar

**Araçlar:**
- Inkscape (SVG → PNG render)
- Python PIL/Pillow (ICO oluşturma, resize)
- ImageMagick (optimize)

**Özellikler:**
- ✅ Şeffaf arka plan (RGBA)
- ✅ En-boy oranı korunmuş
- ✅ Yüksek kalite render
- ✅ Optimize edilmiş dosya boyutları

**Mevcut Entegrasyonlar:**
- `odoo/addons/web/views/webclient_templates.xml` (line 282)
  - Apple Touch Icon referansı: `sodoo-icon-ios.png`
- `odoo/addons/web/controllers/webmanifest.py` (line 54-59)
  - PWA manifest: `sodoo-icon-192x192.png`, `sodoo-icon-512x512.png`

### 📊 Dosya Boyutları

**SODOO:**
- ICO: 505 bytes
- 16x16: 541 bytes
- 192x192: 4.2 KB
- 512x512: 12 KB
- iOS 180x180: 8.9 KB

**SODOOC:**
- ICO: 507 bytes
- 16x16: 543 bytes
- 192x192: 5.3 KB
- 512x512: 16 KB
- iOS 180x180: 8.0 KB

### 🎯 Sonuç

Tüm platformlarda (Web, iOS, Android, PWA) **yenilenmiş, kalınlaştırılmış logolar** artık kullanılıyor. Kullanıcılar tarayıcı cache'ini temizledikten sonra yeni ikonları görecekler.

---

## Gelecek Değişiklikler

- [ ] Android manifest.json oluşturulması
- [ ] iOS asset catalog entegrasyonu
- [ ] Otomatik ikon oluşturma scripti
- [ ] CI/CD pipeline entegrasyonu

---

**Son güncelleme:** 2025-12-23  
**Güncelleyen:** AI Assistant (Augment Agent)

