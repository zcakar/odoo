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

---

## 📋 Zorunlu Görevler

### 1️⃣ Her Session Başında

AI ajanı yeni bir sohbet başlatıldığında **MUTLAKA**:

```markdown
1. .ai/context.yaml dosyasını OKU
2. Mevcut context'i ANLA
3. Kullanıcıya kısa özet VER:
   - Proje durumu nedir?
   - Son yapılan işlemler neler?
   - Bu session'ın amacı ne?
```

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
