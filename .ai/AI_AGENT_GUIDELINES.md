# AI Agent Guidelines - Continuous Documentation Protocol

Bu dosya, AI ajanlarının (Claude Code, GitHub Copilot, ChatGPT vb.) projede çalışırken **sürekli dokümantasyon** yapmasını sağlayan kuralları içerir.

## 🎯 Ana Prensipler

### 1. Documentation Principle
> **Her önemli adım, karar ve çıktı MUTLAKA .ai/ klasöründeki ilgili dosyalara kaydedilmelidir.**

AI ajanları sadece kod yazmaz - aynı zamanda **proje hafızasını** da oluşturur. Gelecekteki sohbetlerde context kaybı olmaması için her session'da yapılanlar dokümante edilmelidir.

### 2. Educational Principle ⭐
> **AI ajanları sadece kod yazıcı DEĞİL, EĞİTMEN rolündedir.**

**KRITIK:** Her işlemi yaparken kullanıcıya ÖĞRETİN:
- ❓ **WHY** (Neden bu işlemi yapıyoruz?)
- 🔍 **WHAT** (Ne yapıyoruz, detaylı açıklama)
- ⚙️ **HOW** (Nasıl çalışıyor, arkasındaki mekanizma)
- 💡 **IMPLICATIONS** (Bu değişikliğin etkileri neler?)

**Örnekler:**

❌ **YANLIŞ (Sadece Kod):**
```
AI: pip install pyjwt
AI: Done.
```

✅ **DOĞRU (Eğitici Yaklaşım):**
```
AI: PyJWT paketini kuruyorum.

NEDEN: OnlyOffice modülü JWT (JSON Web Token) authentication kullanıyor.
NE: JWT, iki sistem arasında güvenli veri alışverişi için kullanılan bir standart.
NASIL: PyJWT kütüphanesi token'ları oluşturur ve doğrular.
ETKİ: Bu olmadan OnlyOffice ile Odoo arasında güvenli iletişim olmaz.

Komut: pip install pyjwt
```

✅ **DOĞRU (Hata Açıklama):**
```
AI: ❌ Hata aldık: "Module not found"

NEDEN: Odoo, custom_addons klasörünü göremedi
ROOT CAUSE: odoo.conf dosyasında addons_path yanlış yapılandırılmış
ÇÖZÜM:
1. odoo.conf'u düzelteceğim
2. Odoo'yu yeniden başlatacağım
3. Modül tekrar yüklenecek

ÖĞRENME: Odoo modül yüklerken addons_path'e bakar. Her yeni
custom klasör eklendiğinde bu path'i güncellemelisiniz.
```

### 3. Code Quality Principle
> **Tüm kod ve yorumlar İNGİLİZCE, ama açıklamalar kullanıcının dilinde.**

- Code comments: **ENGLISH** (evrensel, profesyonel)
- AI explanations: **Turkish** (if user writes in Turkish)
- Function/variable names: **ENGLISH**
- Documentation: **ENGLISH**

### 4. Command Delivery Protocol
> **Kullanıcıya verdiğin komutlar her zaman kopyala-çalıştır formatında olmalı.**

- Komutları sıralı, kopyalanabilir bloklar halinde ver (```` ```bash ... ``` ````).
- Çalışma dizinini belirt: ör. `cd /home/embed/Dev/ODOO/odoo && git pull origin 19.0`.
- Git işlemleri (özellikle `git pull`) daima depo kökünde (`/home/embed/Dev/ODOO/odoo`) çalıştırılmalı; yanlış dizin riskine karşı komutu bu yolla ver.
- Komutlarda gereksiz anlatım yok; açıklamalar blok dışında kısa ve net olsun.
- Her komutun hangi ortamda çalışacağı net yazılmalı (örn. “Lokal shell”, “Production sunucusu”, “QA VM”); farklı ortamlar için ayrı bloklar kullan.

### 5. Production venv & OnlyOffice Playbook
- Production’da venv’i **stash’leme/untracked olarak gizleme** (`git stash -u`) – venv repo dışına taşımayı (örn. `/opt/odoo/venv`) veya stashesiz çalışmayı tercih et.
- Production komutları daima venv Python/pip ile: `sudo -u odoo ./venv/bin/python ./odoo-bin ...`, `sudo -u odoo ./venv/bin/pip install ...`; sistem Python/pip kullanma.
- OnlyOffice sürümlemede snapshot’lar `oo_is_snapshot=True` ile işaretlenir ve ana listede gizlidir; tarihçe butonu için metadata (`res_model`, `res_id`, `oo_attachment_version`) eksiksiz gönderildiğini kontrol et.

---

## 📋 Zorunlu Görevler

### 1️⃣ Her Session Başında

AI ajanı yeni bir sohbet başlatıldığında **MUTLAKA**:

```markdown
1. .ai/context.yaml dosyasını OKU
2. .ai/DEPLOYMENT_AND_USAGE.md'yi OKU (deployment/usage işi varsa)
3. Mevcut context'i ANLA
4. Kullanıcıya kısa özet VER:
   - Proje durumu nedir?
   - Son yapılan işlemler neler?
   - Bu session'ın amacı ne?
```

**ÖZEL NOT:** `DEPLOYMENT_AND_USAGE.md` Dosyası

**AMAÇ:** Basit, açık, herkes tarafından anlaşılabilir deployment ve kullanım kılavuzu.

**ZORUNLU GÜNCELLEME DURUMLARI:**
- ✅ Deployment adımları değiştiğinde
- ✅ Konfigürasyon değiştiğinde
- ✅ Yeni sorun çözüldüğünde (troubleshooting bölümü)
- ✅ Yazılım güncellendiğinde (Odoo, OnlyOffice, etc.)
- ✅ Güvenlik best practice'leri değiştiğinde
- ✅ Kullanıcı yeni özellik kullanmaya başladığında

**GÜNCELLEME PROTOKOLÜ:**
```markdown
1. Dosyayı güncelle
2. "Last Updated" tarihini güncelle
3. "Update History" tablosuna entry ekle
4. Git commit + push
5. Kullanıcıyı bilgilendir
```

**Format Kuralları:**
- ✅ Basit dil (teknik olmayan kişiler anlayabilmeli)
- ✅ Adım adım talimatlar
- ✅ Kod blokları netçe formatlı
- ✅ Troubleshooting section güncel
- ✅ Screenshot referansları (gelecekte eklenebilir)

**Örnek:**
```
Merhaba! Context dosyasını okudum.

Proje Durumu:
- Odoo 19.0 Community (odoo_smb database)
- OnlyOffice modülü local'de test edildi, GitHub'a push edildi
- Şimdi production deployment aşamasındayız

Bu session'da ne yapmak istiyorsun?
```

---

### 2️⃣ Her Önemli İşlem Sonrası

Aşağıdaki durumlarda **MUTLAKA** context.yaml dosyasını güncelle:

#### A) Yeni Modül Eklendi
```yaml
custom_modules:
  new_module_name:
    name: "Module Display Name"
    version: "1.0.0"
    description: "Ne yapıyor"
    dependencies: [...]
    added_date: "2025-12-16"
    status: "Active/Testing/Production"
```

#### B) Önemli Teknik Karar Alındı
```yaml
decisions:
  decision_name:
    decision: "Ne karar verildi"
    reason: "Neden bu karar alındı"
    alternatives: "Diğer seçenekler nelerdi"
    commit: "abc123def" # Git commit hash
    date: "2025-12-16"
```

#### C) Yeni Sorun Bulundu ve Çözüldü
```yaml
troubleshooting:
  new_issue_name:
    problem: "Sorun neydi"
    cause: "Neden oluştu"
    solution: "Nasıl çözüldü"
    files_affected: ["path/to/file.py"]
    date_resolved: "2025-12-16"
```

#### D) Konfigürasyon Değişti
```yaml
configuration:
  setting_name:
    old_value: "eski değer"
    new_value: "yeni değer"
    reason: "Neden değiştirildi"
    date: "2025-12-16"
```

#### E) Production Deployment
```yaml
deployment:
  production_server:
    host: "smb-hkt.com"
    deployed_modules: ["onlyoffice_odoo"]
    deployment_date: "2025-12-16"
    deployment_status: "Success/Failed/In Progress"
    notes: "Önemli notlar"
```

---

### 3️⃣ Session Sonu (Zorunlu!)

Her session bittiğinde **MUTLAKA** context.yaml'ın `metadata` bölümünü güncelle:

```yaml
metadata:
  last_updated: "2025-12-16"
  version: "1.X.0" # Semantic versioning

  changelog:
    - date: "2025-12-16"
      version: "1.X.0"
      change: "Kısa başlık"
      details:
        - "Detay 1"
        - "Detay 2"
      status: "Completed/In Progress/Blocked"
      author: "AI Agent Name"
      session_duration: "2 hours"
      files_modified:
        - "path/to/file1.py"
        - "path/to/file2.xml"
```

### 4️⃣ Git Version Control (Zorunlu!)

**ÖNEMLI:** .ai/ klasöründeki değişiklikler de version kontrolünde olmalı!

#### Git Commit Kuralları

**Ne Zaman Commit Yapılmalı:**
- ✅ Session sonunda (tüm değişiklikler birlikte)
- ✅ Önemli milestone tamamlandığında (major feature, deployment, etc.)
- ✅ context.yaml version bump yapıldığında
- ✅ Yeni dokümantasyon dosyası eklendiğinde
- ✅ Kritik bug fix sonrasında

**Commit Mesajı Formatı:**
```bash
git commit -m "Short description

Detailed explanation:
- Change 1
- Change 2

Files modified:
- .ai/context.yaml (v1.2.0 → v1.3.0)
- .ai/DEVELOPMENT_LOG.md (added issue #5)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Git Push Kuralları

**KRITIK:** Her commit sonrası **MUTLAKA GitHub'a push et!**

```bash
# Commit sonrası
git push origin 19.0  # veya current branch
```

**NEDEN:**
- Backup için (local disk failure koruması)
- Ekip paylaşımı için
- Deployment için (production pull yapar)
- History tracking için

**Workflow:**
```
1. Değişiklik yap (.ai/ dosyaları dahil)
2. git add .ai/
3. git commit -m "descriptive message"
4. git push origin 19.0  ← UNUTMA!
5. Kullanıcıya bildir: "Changes pushed to GitHub"
```

#### .ai/ Klasörü için Özel Kurallar

**Commit Sıklığı:**
- Her session sonunda push
- Önemli dokümantasyon güncellemelerinde push
- Version bump'larda push

**Push Kontrolü:**
```bash
# Push gerekli mi kontrol et
git status
# Eğer "Your branch is ahead" görünüyorsa → PUSH YAP!
```

**Commit Grupları:**
```bash
# İyi: İlgili değişiklikleri birlikte commit et
git add .ai/context.yaml .ai/DEVELOPMENT_LOG.md
git commit -m "Update context and log issue #3"
git push origin 19.0

# Kötü: Her dosya için ayrı commit (gereksiz noise)
```

---

## 🔄 Sürekli Dokümantasyon Workflow

```
┌─────────────────────────────────────────────┐
│ 1. SESSION BAŞLADI                          │
│    → .ai/context.yaml OKU                   │
│    → Mevcut durumu ANLA                     │
│    → Kullanıcıya özet VER                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. İŞLEM YAPILIYOR                          │
│    → Her adımı KAYDET                       │
│    → Önemli kararları BELGELE               │
│    → Hatalar ve çözümler DOKÜMANTE ET       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. SESSION BİTİYOR                          │
│    → context.yaml GÜNCELLE                  │
│    → metadata.changelog EKLE                │
│    → Version BUMP (1.1.0 → 1.2.0)          │
│    → Git commit (opsiyonel ama önerilen)   │
└─────────────────────────────────────────────┘
```

---

## 📝 Özel Durum: Uzun Session'lar

Eğer session **20+ mesaj** sürüyorsa:

1. **Ara kayıt yap** (her 10 işlemde bir)
2. **Session log dosyası oluştur**: `.ai/sessions/YYYY-MM-DD_session_name.md`
3. Detaylı kronolojik kayıt tut

### Session Log Template:

```markdown
# Session Log: YYYY-MM-DD - Feature Name

**Başlangıç:** 14:00
**Bitiş:** 16:30
**Durum:** ✅ Tamamlandı / ⚠️ Devam Ediyor / ❌ Bloke

## Amaç
Bu session'da ne yapılacaktı?

## Yapılanlar
- [ ] İşlem 1
- [x] İşlem 2
- [x] İşlem 3

## Önemli Kararlar
1. **Karar 1:** Açıklama
2. **Karar 2:** Açıklama

## Sorunlar ve Çözümler
| Sorun | Çözüm | Durum |
|-------|-------|-------|
| Problem X | Çözüm Y | ✅ Çözüldü |

## Değiştirilen Dosyalar
- `path/to/file1.py`
- `path/to/file2.xml`

## Sonraki Adımlar
- [ ] TODO 1
- [ ] TODO 2

## Notlar
Önemli notlar...
```

---

## 🚫 Yapılmaması Gerekenler

### ❌ YANLIŞ:
```
AI: "Modülü kurdum, test et."
→ Hiçbir dokümantasyon yok!
```

### ✅ DOĞRU:
```
AI: "OnlyOffice modülünü production'a kurdum.

context.yaml güncellendi:
- deployment.production_server.deployed_modules: ["onlyoffice_odoo"]
- metadata.version: 1.2.0 → 1.3.0
- changelog: Production deployment tamamlandı

Test için: https://smb-hkt.com/web"
```

---

## 📊 Dokümantasyon Kalite Kontrol

Her session sonunda AI ajanı kendine şu soruları sormalı:

- [ ] context.yaml güncellendi mi?
- [ ] metadata.changelog'a entry eklendi mi?
- [ ] Version number artırıldı mı?
- [ ] Yeni kararlar decisions altına eklendi mi?
- [ ] Yeni sorunlar troubleshooting'e eklendi mi?
- [ ] Kullanıcı gelecekte bu session'ı anlayabilir mi?

---

## 🎯 Hedef: Zero Context Loss

> Bir AI ajanı 6 ay sonra projeye döndüğünde, sadece .ai/ klasörünü okuyarak **TÜM** proje geçmişini ve mevcut durumu anlamalı.

---

## 🔐 Güvenlik Notu

**ÖNEMLİ:**
- Hassas bilgileri (passwords, API keys) context.yaml'a **YAZMA**
- Production credentials'ları **PAYLAŞMA**
- Eğer hassas bilgi gerekiyorsa: `[REDACTED - See secure vault]` yaz

---

## 📚 Referanslar

- Ana context: `.ai/context.yaml`
- Session template: `.ai/NEW_CHAT_TEMPLATE.md`
- README: `.ai/README.md`

---

## 🤖 AI Agent Checklist

Her session başında:
- [x] context.yaml okudum
- [x] Mevcut durumu anladım
- [x] Kullanıcıya özet verdim

Her işlem sonrası:
- [x] Önemli adımları kaydettim
- [x] Kararları belgeledim

Session bitiminde:
- [x] context.yaml güncelledim
- [x] Version bump yaptım
- [x] Changelog ekledim
- [x] Kullanıcıya özet verdim

---

**Son Güncelleme:** 2025-12-16
**Versiyon:** 1.0.0
**Hazırlayan:** Claude Code
**Durum:** ✅ Aktif
