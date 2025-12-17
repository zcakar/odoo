# Session Log: 2025-12-17 - Draw.io SVG PoC

**Başlangıç:** 2025-12-17
**Durum:** ⚠️ Devam Ediyor

## Amaç
OnlyOffice draw.io eklentisinde PNG yerine SVG + embedXml ile doküman içine vektörel diyagram yerleştirip edit edilebilirliği korumak; PDF çıktısında kaliteyi artırmak.

## Karar: Custom Plugin Yaklaşımı
Marketplace draw.io plugin'i bulunamadığından, **sıfırdan custom OnlyOffice plugin** geliştirme kararı alındı.

## Custom Plugin Geliştirme (DRAW-SMB)

### Plugin Yapısı
```
/var/www/onlyoffice/documentserver/sdkjs-plugins/{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}/
├── config.json          # Plugin manifest
├── index.html           # Plugin UI (iframe container)
├── scripts/
│   └── plugin.js        # Ana plugin logic
└── resources/
    ├── img/
    │   ├── icon.png     # Resmi draw.io ikonu
    │   └── icon@2x.png
    └── translations/
        ├── langs.json
        ├── en-US.json
        └── tr-TR.json
```

### Lokal Geliştirme Dizini
```
/home/embed/Dev/ODOO/onlyoffice-drawio-help/custom_drawio_svg_plugin/
```

### Plugin Özellikleri
- **İsim:** DRAW-SMB
- **GUID:** `asc.{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}` (sonda sıralanması için Z ile başlıyor)
- **İkon:** Resmi draw.io ikonu (`/home/embed/Dev/ODOO/drawio-icon-official.png`)
- **Boyut:** 1200x800 modal
- **Desteklenen Editörler:** Word, Cell, Slide

### Teknik Akış
1. Plugin tıklandığında modal açılır
2. Modal içinde `embed.diagrams.net` iframe'i yüklenir
3. draw.io `init` event'i gelince boş diagram yüklenir
4. Kullanıcı "Kaydet" tıklayınca `save` event'i gelir
5. Plugin SVG export ister (`format: svg`, `embedXml: true`)
6. draw.io `export` event'i ile base64 SVG gönderir
7. Plugin OnlyOffice API ile SVG'yi dokümana ekler
8. Modal kapanır

### Yapılanlar (Bu Session)
- [x] Custom plugin iskeleti oluşturuldu
- [x] embed.diagrams.net iframe entegrasyonu
- [x] postMessage iletişim altyapısı
- [x] SVG export akışı (format: svg, embedXml: true)
- [x] Plugin GUID formatı düzeltildi (dizin adı `{GUID}` formatında olmalı)
- [x] Dosya izinleri düzeltildi (403 Forbidden hatası çözüldü)
- [x] Resmi draw.io ikonu eklendi
- [x] Plugin adı "DRAW-SMB" olarak ayarlandı
- [x] GUID "ZZZZZ-..." ile sonda sıralanması sağlandı

### Açık Sorunlar
- [ ] SVG dokümana eklenmiyor (executeCommand "command" çalışmıyor olabilir)
- [ ] Modal resize özelliği yok (OnlyOffice sınırlaması)
- [ ] Mevcut SVG'yi yeniden düzenleme (selection hook devre dışı)

### JWT Secret Geçmişi (Her restart'ta değişiyor!)
- `skdpMrV1MEFmpJXbBxBQbyBFgMARgqxe`
- `A0vNF2qaBUZ9hjai6E86RMCERpk5TCdM`
- `iUf5AS2Oa9rd1sIkkNJHlhMkjCWeLiVI`
- `vG8wp2B7rdrlfFPnyWW6F4puntoF0PWV`
- `X1WnEnfWKB5jr8vjVDNTbZX5MszTtbAT`
- `Nji0SEiAiQonN6jlwXmPj0NC1cVAhVcN`
- `q6kTIvlTziySUlTCyyz4YkQ68M6LFWDN` (en son)

### Debug Logları
Console'da `[DRAW-IO-SVG]` prefix'i ile loglar görünür:
```
[DRAW-IO-SVG] === Plugin Initialized ===
[DRAW-IO-SVG] Loading draw.io editor...
[DRAW-IO-SVG] Message received: init
[DRAW-IO-SVG] Save triggered, requesting SVG export...
[DRAW-IO-SVG] Export received, format: svg
[DRAW-IO-SVG] Inserting SVG into document...
```

## Sonraki Adımlar
1. SVG insert sorununu debug et (OnlyOffice API kullanımını kontrol et)
2. Modal resize araştır (isResizable parametresi?)
3. Mevcut diyagramı düzenleme özelliği ekle (selection hook)
4. Test: DOCX unzip → word/media/image*.svg kontrolü
5. Test: PDF export kalitesi (400% zoom)

## Deployment Komutları

### Plugin Deploy
```bash
# Plugin'i container'a kopyala
docker cp /home/embed/Dev/ODOO/onlyoffice-drawio-help/custom_drawio_svg_plugin/. \
  'onlyoffice-documentserver:/var/www/onlyoffice/documentserver/sdkjs-plugins/{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}/'

# İzinleri düzelt
docker exec onlyoffice-documentserver bash -c '
  chown -R ds:ds "/var/www/onlyoffice/documentserver/sdkjs-plugins/{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}"
  find "/var/www/onlyoffice/documentserver/sdkjs-plugins/{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}" -type f -exec chmod 644 {} \;
  find "/var/www/onlyoffice/documentserver/sdkjs-plugins/{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}" -type d -exec chmod 755 {} \;
'

# Container restart
docker restart onlyoffice-documentserver
```

### JWT Secret Alma
```bash
docker exec onlyoffice-documentserver grep -oP '"string": "\K[^"]+' /etc/onlyoffice/documentserver/local.json | head -1
```

## İlgili Dosyalar
- Plugin kaynak: `/home/embed/Dev/ODOO/onlyoffice-drawio-help/custom_drawio_svg_plugin/`
- Resmi ikon: `/home/embed/Dev/ODOO/drawio-icon-official.png`
- Referans: `/home/embed/Dev/ODOO/docspace-plugins-master/draw.io/`
- Session log: `.ai/sessions/2025-12-17_drawio_svg_poc.md`

## Notlar
- OnlyOffice Document Server her restart'ta yeni JWT secret üretiyor - Odoo ayarlarında güncellenmeli
- Plugin dizin adı `{GUID}` formatında olmalı (süslü parantezler dahil)
- Dosya izinleri `644` (dosyalar) ve `755` (dizinler) olmalı, owner `ds:ds`
- CSP için `cspDomains: ["https://embed.diagrams.net"]` gerekli
