# AI Context Directory

Bu dizin, AI asistanları (Claude Code, GitHub Copilot, Codex vb.) için **kalıcı proje bağlamı** sağlar.

## 📋 Amaç

Uzun vadeli projeler geliştirirken AI asistanları ile çalışırken her yeni sohbette bağlamın kaybolması sorununu çözer. Bu dosyalar:

- ✅ Proje yapısını açıklar
- ✅ Teknik kararları belgeler
- ✅ Geliştirme standartlarını tanımlar
- ✅ Server bilgilerini ve konfigürasyonları saklar
- ✅ Sohbetler arası sürekliliği sağlar

## 📄 Dosyalar

### `context.yaml`
Ana proje bağlam dosyası. Makine-okunur (YAML) ve insan-okunur format.

**İçerik:**
- Proje bilgileri (Odoo 19.0 Community)
- Altyapı detayları (OS, Python, PostgreSQL)
- Dizin yapısı ve dosya yolları
- Git durumu ve commit geçmişi
- Custom modüller (OnlyOffice)
- Geliştirme kuralları ve konvansiyonları
- Teknik kısıtlamalar
- Deployment bilgileri
- Troubleshooting kılavuzu
- AI asistan yönergeleri

## 🚀 Nasıl Kullanılır?

### Her Yeni AI Sohbetinin Başında:

```
Lütfen .ai/context.yaml dosyasındaki proje bağlamını oku ve kullan.
```

veya

```
Use the project context from .ai/context.yaml as your memory.
```

### Örnekler:

#### ❌ YANLIŞ (Bağlam yok):
```
User: "OnlyOffice modülüne yeni özellik ekle"
AI: "OnlyOffice nedir? Hangi proje?"
```

#### ✅ DOĞRU (Bağlam var):
```
User: ".ai/context.yaml'ı oku. OnlyOffice modülüne yeni özellik ekle"
AI: "Anladım. custom_addons/onlyoffice_odoo/ içinde çalışacağım.
      Odoo 19.0 Community uyumlu kod yazıyorum..."
```

## 🔄 Güncelleme

Context dosyası şu durumlarda güncellenmelidir:

- ✏️ Yeni modül eklendiğinde
- ✏️ Önemli mimari karar alındığında
- ✏️ Server/database bilgileri değiştiğinde
- ✏️ Yeni teknik kısıt eklendiğinde
- ✏️ Deployment süreci değiştiğinde

**Manuel güncellemek için:**
```bash
# Tarih ve changelog'u güncelle
nano .ai/context.yaml
```

## 🎯 Faydaları

### Sohbet Sürekliliği
Her yeni sohbette **sıfırdan başlamak yerine** context'i yükleyerek devam edin.

### IDE Bağımsızlık
Bu dosya:
- ✅ VS Code içinde kullanılabilir
- ✅ Cursor IDE'de kullanılabilir
- ✅ Terminal'de Claude ile kullanılabilir
- ✅ Web'de ChatGPT ile kullanılabilir
- ✅ **Herhangi bir AI aracı ile çalışır**

### Takım Çalışması
Tüm geliştiriciler aynı context'i kullanarak AI ile çalışabilir.

### Dokümantasyon
İnsan-okunur format sayesinde **proje dokümantasyonu** görevi de görür.

## 🔐 Güvenlik

⚠️ **DİKKAT:** Production ortamı için:

- `context.yaml` içinde hassas bilgiler (passwords) varsa `.gitignore`'a ekleyin
- Veya production bilgilerini `context.production.yaml` gibi ayrı dosyada tutun
- Repo'yu public yapıyorsanız **mutlaka** hassas bilgileri temizleyin

**Önerilen Yapı:**
```
.ai/
├── context.yaml          # Genel proje bilgisi (versiyonlanır)
├── context.local.yaml    # Yerel dev bilgileri (gitignore)
└── context.production.yaml  # Production (gitignore)
```

## 💡 Best Practices

### 1️⃣ Feature-Based Sessions
Her feature için **ayrı sohbet**, ama **aynı context**.

```
Session 1: CRM Customization + context.yaml
Session 2: Invoice Module + context.yaml
Session 3: Bug Fix + context.yaml
```

### 2️⃣ Context Versiyonlama
Her major değişiklikte `metadata.version` ve `changelog`'u güncelleyin.

### 3️⃣ Minimal Ama Yeterli
Gereksiz detaylardan kaçının, ama AI'ın bilmesi gereken her şeyi ekleyin.

### 4️⃣ Güncel Tutun
Deprecated bilgileri silin, yeni kararları ekleyin.

## 🛠️ Entegrasyon

### Claude Code (VS Code Extension)
```bash
# Sohbet başında:
"@.ai/context.yaml'ı oku"
```

### GitHub Copilot
```bash
# Dosyayı açık tutarak Copilot'a context sağlayın
code .ai/context.yaml
```

### ChatGPT/Claude Web
```bash
# Dosya içeriğini copy-paste edin veya:
"Şu context'i kullan: [yapıştır]"
```

## 📚 Daha Fazla Bilgi

- [Odoo Documentation](https://www.odoo.com/documentation/19.0/)
- [Odoo GitHub](https://github.com/odoo/odoo)
- Proje Wiki: [Internal Link]

---

**Son Güncelleme:** 2025-12-16
**Maintainer:** Project Team
**Version:** 1.0.0
