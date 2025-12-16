# Session Log: 2025-12-17 - Draw.io SVG PoC

**Başlangıç:** 2025-12-17  
**Durum:** ⚠️ Devam Ediyor  

## Amaç
OnlyOffice draw.io eklentisinde PNG yerine SVG + embedXml ile doküman içine vektörel diyagram yerleştirip edit edilebilirliği korumak; PDF çıktısında kaliteyi artırmak.

## Yapılanlar
- DOCX unzip edildi, `word/media/` altında yalnızca PNG dosyaları (SVG yok).
- PNG içinde `mxfile` gömüsü `strings` ile arandı, bulunamadı.
- Document Server konteynerinde `sdkjs-plugins` dizini incelendi; draw.io eklentisine ait klasör yok (yalnızca OCR, YouTube, translator vb.).
- Help dosyalarında draw.io referansları bulundu (`.../web-apps/apps/documenteditor/main/resources/help/.../Drawio.htm`) ancak gerçek eklenti dosyası mevcut değil.
- `docker ps` ile `onlyoffice-documentserver` ve `drawoffice-nginx` çalıştığı görüldü; draw.io’nun ayrı bir servis olarak (drawoffice) geldiği, editör eklentisinin ise paketlenmiş olmadığından şüpheleniliyor.
- DocumentServer tarafında `basic.zip`, `sdkjs`, `/etc/onlyoffice` içinde draw.io izi bulunmadı; `find` ile `/var/www/onlyoffice` ve `/var` altında sonuç yok. `sdkjs-plugins` altındaki tüm plugin config’leri listelendi, draw.io yok.
- `drawoffice-nginx` konteyneri şu an restart loop’ta; içine girilemedi.
- Lokal kaynaklar incelemesi: `/home/embed/Dev/ODOO/docspace-plugins-master/draw.io` (plugin v1.2.0) TypeScript kaynak kodu bulundu; embed.diagrams.net iframe’i ile `proto=json&embed=1` kullanıyor, `.drawio` veya `.png` dosyalarını `format: xml/xmlpng` parametreleriyle açıyor, `export` mesajında PNG/XML base64’ü yakalayıp API’ye PUT ediyor. Yeni dosya oluştururken boş bir `mxfile` şablonu yüklenip `.drawio` kaydediliyor. Admin ayarları `url/lang/off/lib` şeklinde JSON olarak tutuluyor. SDK sürümü `@onlyoffice/docspace-plugin-sdk@^2.0.0`.
- Repo kopyaları: `sdkjs-plugins-master/` (OnlyOffice plugin örnekleri) ve `docspace-plugins-master/` (draw.io dâhil DocSpace plugin’leri) workspace’e indirildi; draw.io için gerçek kaynaklar docspace paketinde mevcut, sdkjs paketinde draw.io yok.
- 2025-12-17 keşif scripti (docker exec) çalıştırıldı: `onlyoffice-documentserver` konteyneri ayakta, `sdkjs-plugins` altında marketplace + varsayılan eklentiler (Photo Editor, YouTube, OCR, Translator, AI, Mendeley, Thesaurus, Highlight code, Zotero, Speech, Speech input) görüldü; draw.io plugin dizini/manifesti yok. Nginx loglarında draw.io izi bulunmadı. `drawoffice-nginx` hâlâ restart loop’ta.
- 2025-12-17 (user bildirimi): Plugin Manager üzerinden draw.io kurulduğu ve editör şeridinde göründüğü teyit edildi; ekranda yeni draw.io butonu mevcut, basit bir ekleme yapıldı. Ancak konteyner içinde yeniden yapılan taramada (find/grep) draw.io’ya ait dosya veya manifest hâlâ bulunamadı; plugin yüklemesinin farklı bir ortamda/VM’de olması veya kalıcılığın başka path’te tutulması olası.
- 2025-12-17 yeniden tarama: `find_drawio_plugin.sh` tekrar çalıştırıldı; `/var/www/onlyoffice/documentserver` ve `/var/lib/onlyoffice/documentserver` altında `drawio`/`diagrams.net` aramaları sonuçsuz. Marketplace klasöründe de draw.io paketi yok. Olası sebep: Odoo’nun bağlandığı Document Server bu konteyner değil veya Plugin Manager cache’i başka bir mount/VM’de tutuluyor; doğru DS/host doğrulanmalı.
- Marketplace ve tartışma kaynakları not edildi: ONLYOFFICE public repo `onlyoffice.github.io` (https://github.com/ONLYOFFICE/onlyoffice.github.io/tree/master) ve Plugin Manager store içeriği (https://github.com/ONLYOFFICE/onlyoffice.github.io/tree/master/store); benzer konu tartışması: https://github.com/ONLYOFFICE/onlyoffice.github.io/issues/356.

## Sorunlar ve Açık Sorular
- Draw.io eklentisinin gerçek dosya yolu henüz bulunamadı; Plugin Manager indirme/cache dizini tespit edilmedi.
- PNG üretimini SVG’ye çevirmek için export/save kodu henüz bulunamadı.
- Drawoffice konteyneri restart ettiği için içeriği incelenemiyor; plugin dosyaları muhtemelen o konteynerde.
- Odoo hangi Document Server’a bağlanıyor? (odoo.conf’taki ONLYOFFICE URL ile editörde açılan host aynı mı?)

## Sonraki Adımlar
- Konteyner içinde geniş arama ile draw.io eklentisinin indirildiği olası dizinleri taramak (`/var`, plugin cache).
- Eklenti kaynak dosyasında export çağrısını `format: 'svg', embedXml: true` ve `image/svg+xml` insert ile güncellemek; gerekirse fallback PNG eklemek.
- Yeni diyagram oluşturup DOCX unzip, ardından PDF export ile vektör çıktısını doğrulamak.
- Drawoffice konteyneri stabil hale gelirse içinde `/usr/share/nginx/html` veya benzeri yolda draw.io plugin/assetlerini aramak; gerekirse yeniden başlatma sebebini loglardan görmek.
- Eğer doğru DS erişilemiyorsa: Marketplace rehberini izleyerek (`onlyoffice.com/blog/2022/10/how-to-publish-your-own-plugin-in-onlyoffice-marketplace`) `docspace-plugins-master/draw.io` veya `jgraph/drawio` tabanlı özelleştirilmiş plugin’i elle derleyip `sdkjs-plugins` altına yerleştirmek.

## Notlar
- Help içeriği mevcut olduğundan eklenti destekleniyor; dosya sistemi yolunun farklı bir cache/marketplace konumunda olması muhtemel.
