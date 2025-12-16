# 🤖 Yeni AI Sohbeti Başlatma Şablonu

Her yeni AI sohbeti başlatırken bu mesajı **ilk mesaj olarak** kullanın.

---

## 📋 Türkçe Versiyon

```
Merhaba! Bu Odoo 19.0 Community projesi üzerinde çalışıyoruz.

Lütfen .ai/context.yaml dosyasındaki proje bağlamını oku ve tüm sohbet boyunca bunu referans al.

Bu sohbetin amacı: [BURAYA YAZ]

Örnek:
- "OnlyOffice modülüne dosya paylaşım özelliği eklemek"
- "CRM modülünü özelleştirmek"
- "Invoice template'i değiştirmek"
- "PostgreSQL performans sorununu çözmek"
```

---

## 📋 English Version

```
Hi! We're working on an Odoo 19.0 Community project.

Please read and use the project context from .ai/context.yaml throughout this entire conversation.

The purpose of this session: [WRITE HERE]

Examples:
- "Add file sharing feature to OnlyOffice module"
- "Customize CRM module"
- "Modify invoice template"
- "Fix PostgreSQL performance issue"
```

---

## 🎯 Alternatif Kullanımlar

### Hızlı Başlangıç (Minimal)
```
Context: .ai/context.yaml
Task: [ne yapmak istiyorsun]
```

### Detaylı Başlangıç
```
Project: Odoo 19.0 Community (odoo_smb database)
Context: Load from .ai/context.yaml
Branch: 19.0

Current task:
- [Ana görev]
- [Alt görev 1]
- [Alt görev 2]

Constraints:
- [Varsa özel kısıtlar]
```

### Feature Development
```
Read context: .ai/context.yaml

Feature: [Feature adı]
Module: [Hangi modül - ör: custom_addons/onlyoffice_odoo]
Requirements:
1. [Gereksinim 1]
2. [Gereksinim 2]
3. [Gereksinim 3]

Please propose an implementation plan first.
```

---

## ✅ İyi Örnekler

### Örnek 1: Yeni Modül Geliştirme
```
Context: .ai/context.yaml
Task: Müşteri portal modülü geliştirmek istiyorum.

Requirements:
- Müşteriler kendi siparişlerini görebilsin
- PDF fatura indirebilsinler
- Odoo 19.0 Community uyumlu olmalı
- custom_addons/customer_portal dizininde olmalı

Önce mimari planı oluştur, sonra implement edelim.
```

### Örnek 2: Bug Fix
```
Context: .ai/context.yaml
Problem: OnlyOffice modülünde dosya açılırken 500 hatası alıyorum.

Error log:
[hata mesajını buraya yapıştır]

Lütfen sorunu tespit et ve düzelt.
```

### Örnek 3: Performans Optimizasyonu
```
Context: .ai/context.yaml
Issue: PostgreSQL sorguları çok yavaş (5+ saniye)

Current state:
- Database: odoo_smb (20GB)
- Records: ~100K invoices
- Slow queries: account.move searches

Önce analiz yap, sonra optimizasyon öner.
```

---

## ❌ Kötü Örnekler (Kullanma)

### ❌ Bağlam Yok
```
OnlyOffice'e özellik ekle
```
*Problem: AI hangi proje, hangi OnlyOffice modülü, hangi Odoo versiyonu bilmiyor.*

### ❌ Belirsiz
```
Bir şeyler yap
```
*Problem: Ne yapılacak belli değil.*

### ❌ Context Yüklenmemiş
```
Server adresi nedir?
```
*Problem: Context yüklenmeden sorulmuş, AI bilemez.*

---

## 💡 Pro Tips

### 1. Session Scope Belirle
Her sohbet **tek bir feature/bug/task** için olsun. Karışık görevleri ayır.

✅ İYİ:
- Session 1: Invoice modülü
- Session 2: CRM özelleştirme

❌ KÖTÜ:
- Session 1: Invoice + CRM + bug fix + performans + docs

### 2. Context Her Zaman İlk Mesajda
Context yükleme işini **ilk mesajda** yap. Sonra eklersen AI bazı kararları contextsiz almış olur.

### 3. Ara Özet İste
Uzun sohbetlerde (20+ mesaj) ara özet iste:
```
Şimdiye kadar ne yaptık? Kısa özet.
```

### 4. Context Güncelleme
Sohbet sırasında önemli kararlar alındıysa:
```
Bu kararı .ai/context.yaml dosyasına ekle:
[karar detayı]
```

---

## 🔄 Workflow Özeti

```
┌─────────────────────────────────────────┐
│ 1. YENİ SOHBET BAŞLAT                   │
│    → Bu template'i kullan                │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. CONTEXT YÜKLENDİ                     │
│    → AI artık proje detaylarını biliyor │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. GÖREV ÜZERİNDE ÇALIŞ                 │
│    → Context'e göre kod/plan üret       │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. SOHBET BİTTİ / UZADI                 │
│    → Yeni feature için YENİ SOHBET      │
│    → Context tekrar yükle               │
└─────────────────────────────────────────┘
```

---

## 📚 Ek Kaynaklar

- Context dosyası: [.ai/context.yaml](.ai/context.yaml)
- Kullanım kılavuzu: [.ai/README.md](.ai/README.md)
- Odoo docs: https://www.odoo.com/documentation/19.0/

---

**Not:** Bu template'i kopyala-yapıştır yaparak kullan. Her yeni sohbette ilk mesajın bu olsun.

**Son Güncelleme:** 2025-12-16
