# Development Log - Odoo OnlyOffice Project

This file tracks all **significant issues, solutions, and learnings** during development.

**Purpose:** Create a knowledge base of problems encountered and how they were solved, so future developers (human or AI) can learn from past experiences.

---

## 📖 How to Use This Log

### When to Add an Entry

Add an entry when:
- ✅ You encounter a **bug or error**
- ✅ You solve a **non-obvious problem**
- ✅ You make an **important technical decision**
- ✅ You discover a **best practice** or **gotcha**
- ✅ You find a **workaround** for a limitation

### Entry Format

```markdown
## [YYYY-MM-DD] - Short Title

**Status:** ✅ Resolved / ⚠️ Workaround / 🔄 In Progress / ❌ Blocked

**Context:**
Brief description of what you were trying to do.

**Problem:**
Detailed description of the issue.

**Root Cause:**
Why did this happen? (Technical explanation)

**Solution:**
How was it fixed? (Step-by-step)

**Learning:**
What did we learn? How to avoid this in the future?

**Related Files:**
- `path/to/file1.py`
- `path/to/file2.xml`

**Tags:** `odoo-19`, `onlyoffice`, `deployment`, `docker`, etc.
```

---

## 📝 Log Entries

### [2025-12-16] - OnlyOffice version snapshot + attachment history button

**Status:** ✅ Resolved

**Context:**
OnlyOffice edits on tasks/documents needed a clear latest version on the attachment card, with earlier versions retained (up to 10) and a quick way to open version history.

**Problem:**
- OnlyOffice callback overwrote the same attachment without keeping previous versions.
- No UI indicator of the current OnlyOffice version, and no quick link to see older versions.

**Root Cause:**
Version counter existed but no snapshot of prior content was created; UI did not expose version metadata or a history entry point.

**Solution:**
- Snapshot current attachment before saving a new OnlyOffice version, increment the version counter, and rename latest as `(vN)`; keep only the latest 10 versions.
- Expose `oo_attachment_version` to the mail attachment store so the frontend can render version info.
- Add a badge + history button on attachment cards that opens `ir.attachment` filtered to the same record/name.

**Learning:**
Keep a pre-save copy before overwriting OnlyOffice edits to preserve history; surface minimal metadata (version) to the client to avoid ambiguity for users.

**Related Files:**
- `custom_addons/onlyoffice_odoo/controllers/controllers.py`
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`
- `custom_addons/onlyoffice_odoo/static/src/models/attachment_card_onlyoffice.js`
- `custom_addons/onlyoffice_odoo/static/src/components/attachment_card_onlyoffice/attachment_card_onlyoffice.xml`

**Tags:** `odoo-19`, `onlyoffice`, `versioning`, `ui`

### [2025-12-16] - Fix OnlyOffice version history domain crash (frontend)

**Status:** ✅ Resolved

**Context:**
Opening version history could crash the Owl client with an invalid domain when attachment data lacked res_model/res_id in the JS store.

**Problem:**
Domain built with empty res_model/res_id caused `InvalidDomainError` on the client; some attachments in the list were missing these fields in the store.

**Root Cause:**
The attachment store didn't expose res_model/res_id by default; the custom domain construction assumed they existed.

**Solution:**
- Expose `res_model` and `res_id` via `_to_store_defaults`.
- Guard the version history button in JS to warn and bail when record linkage is missing.
- Add `oo_is_snapshot` flag and hide snapshot attachments from the main list (OnlyOffice versions visible via history button only).

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`
- `custom_addons/onlyoffice_odoo/static/src/models/attachment_card_onlyoffice.js`

**Tags:** `odoo-19`, `onlyoffice`, `frontend`, `bugfix`

### [2025-12-16] - Production pitfalls: venv stash + OnlyOffice snapshot visibility

**Status:** ✅ Resolved

**Context:**
During production pull, `git stash -u` removed the venv, causing missing `pyjwt/passlib` and OnlyOffice 500. Snapshot copies also appeared in the main attachment list.

**Problem:**
- Venv removal led to missing dependencies and 500 errors.
- Snapshot attachments lacked a hide flag, so multiple cards (v1/v2) appeared.

**Root Cause:**
- Stashing untracked files (including venv).
- No `oo_is_snapshot` marker; mail AttachmentList rendered all copies.

**Solution:**
- Recreate venv, install requirements/pyjwt; enforce using `./venv/bin/python`/`pip` on server.
- Added `oo_is_snapshot`/`oo_origin_attachment_id`; hide snapshots from main list, accessible via history.

**Prevention:**
- On production, avoid `git stash -u`; keep venv outside repo (e.g., `/opt/odoo/venv`) or never stash it.
- Always run Odoo commands with venv Python; verify `pyjwt` present.

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`
- `custom_addons/onlyoffice_odoo/static/src/components/attachment_card_onlyoffice/attachment_card_onlyoffice.xml`

**Tags:** `odoo-19`, `onlyoffice`, `venv`, `production`, `ui`

### [2025-12-16] - Attachment Activity Logs + Co-editing Verified

**Status:** ✅ Resolved

**Context:**
Added chatter visibility for attachment lifecycle (add/update/delete) and validated OnlyOffice co-editing in Odoo task screen.

**Problem:**
Users could not see file add/update/delete events directly in the chatter; needed confirmation that co-editing works with the current setup.

**Root Cause:**
No logging hooks on `ir.attachment`; co-editing had not been exercised end-to-end after OnlyOffice deployment.

**Solution:**
- Extended `ir.attachment` in `custom_addons/onlyoffice_odoo` to post chatter notes on create/write/unlink.
- Deployed and upgraded module on production, then validated in a task: attachment add/update logs appear in chatter; two users edited the same document simultaneously in OnlyOffice (Fast mode) successfully.

**Learning:**
- Chatter hooks give immediate visibility without touching core code.
- Co-editing works out of the box once OnlyOffice and JWT are correctly configured; no extra flags needed in Odoo.

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`
- `.ai/context.yaml` (metadata/changelog updated)

**Tags:** `odoo-19`, `onlyoffice`, `chatter`, `co-editing`

### [2025-12-16] - Lightweight Attachment Version Counter for OnlyOffice

**Status:** ✅ Resolved

**Context:**
OnlyOffice callback already attempted to increment `oo_attachment_version` but the field did not exist. Needed a minimal, storage-friendly version marker.

**Problem:**
Version increments would fail or be `False` because `oo_attachment_version` was missing, blocking reliable version labeling.

**Root Cause:**
Field not defined in `ir.attachment`; existing records had no default.

**Solution:**
- Added integer field `oo_attachment_version` (default 1, copy=False) on `ir.attachment`.
- Added init SQL to backfill NULLs to 1 for existing attachments.
- Ensured create sets a default when payload omits the field.

**Learning:**
- A simple counter is enough for OnlyOffice callbacks to label prior versions without heavy storage.
- Backfilling NULLs avoids TypeError on first increment.

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`

**Tags:** `odoo-19`, `onlyoffice`, `versioning`

### [2025-12-16] - Prune OnlyOffice Versions to Last 10 Copies

**Status:** ✅ Resolved

**Context:**
Needed lightweight retention: keep only the latest 10 versions per attachment to avoid storage bloat.

**Problem:**
OnlyOffice saves full copies; frequent edits would grow storage linearly.

**Root Cause:**
No retention policy for OnlyOffice-generated attachment versions.

**Solution:**
- Added `_prune_old_versions(limit=10)` on `ir.attachment` to delete older versions (same record/name) beyond the last 10.
- Invoked pruning from the OnlyOffice callback after incrementing `oo_attachment_version`.

**Learning:**
- Simple retention cap prevents unbounded growth while keeping recent history.
- Matching by base filename and extension avoids deleting unrelated attachments on the same record.

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/ir_attachment.py`
- `custom_addons/onlyoffice_odoo/controllers/controllers.py`

**Tags:** `odoo-19`, `onlyoffice`, `versioning`, `retention`

### [2025-12-16] - Odoo 19.0 OnlyOffice Module Compatibility Patches

**Status:** ✅ Resolved

**Context:**
OnlyOffice official module (from GitHub) targets Odoo 18.0. We're using Odoo 19.0, which has breaking API changes.

**Problem:**
Three compatibility issues:
1. `ir.actions.act_window` no longer supports `target='inline'`
2. Mail attachment card DOM structure changed (class names)
3. Attachment API changed: `validate_access()` replaced with `_can_return_content()`

**Root Cause:**
Odoo 19.0 introduced breaking changes in:
- Action window rendering system
- Mail module frontend components
- Attachment access control API

**Solution:**

**Patch 1: views/res_config_settings_views.xml (line 117)**
```xml
<!-- OLD (Odoo 18.0) -->
<field name="target">inline</field>

<!-- NEW (Odoo 19.0) -->
<field name="target">current</field>
```

**Patch 2: views/attachment_card_onlyoffice.xml**
```xml
<!-- OLD (Odoo 18.0) -->
<xpath expr="//div[hasclass('o-mail-AttachmentCard-aside')]" position="inside">

<!-- NEW (Odoo 19.0) -->
<xpath expr="//div[hasclass('o-mail-AttachmentButtons')]" position="inside">
```

**Patch 3: controllers/controllers.py (line ~179)**
```python
# OLD (Odoo 18.0)
attachment.validate_access(access_token)

# NEW (Odoo 19.0)
attachment._can_return_content(access_token=access_token)
```

**Learning:**
- Always check Odoo release notes for breaking API changes
- Test modules thoroughly after major version upgrades
- Keep patches documented for future reference
- Consider contributing fixes back to official repo

**Related Files:**
- `custom_addons/onlyoffice_odoo/views/res_config_settings_views.xml`
- `custom_addons/onlyoffice_odoo/views/attachment_card_onlyoffice.xml`
- `custom_addons/onlyoffice_odoo/controllers/controllers.py`

**Tags:** `odoo-19`, `onlyoffice`, `compatibility`, `breaking-changes`

**Commit:** `e2afe488036`

---

### [2025-12-16] - OnlyOffice Docker Container Cannot Access Odoo on localhost

**Status:** ✅ Resolved

**Context:**
OnlyOffice Document Server runs in Docker container. It needs to callback to Odoo to download/save files.

**Problem:**
OnlyOffice shows error: "Error while downloading the document file"

**Root Cause:**
Docker container network isolation:
- `localhost` inside container != `localhost` on host
- Odoo configured with `http_interface = 127.0.0.1` (localhost only)
- Docker container on separate network bridge cannot reach 127.0.0.1

**Technical Explanation:**
```
┌────────────────────────────────────────┐
│ Host Machine (192.168.181.130)        │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Odoo (127.0.0.1:8069)            │ │ ← Only localhost can access
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Docker Bridge (172.17.0.0/16)    │ │
│  │                                  │ │
│  │  ┌────────────────────────────┐ │ │
│  │  │ OnlyOffice Container       │ │ │
│  │  │ (172.17.0.2)               │ │ │
│  │  └────────────────────────────┘ │ │
│  └──────────────────────────────────┘ │
│         ↑                              │
│         └─ Cannot reach 127.0.0.1     │
└────────────────────────────────────────┘
```

**Solution:**
Change Odoo to listen on all interfaces:

```ini
# /etc/odoo/odoo.conf or odoo.conf
[options]
http_interface = 0.0.0.0  # Listen on all interfaces
```

**Security Consideration:**
- Production: **MUST** use Nginx reverse proxy with SSL
- Nginx listens on 80/443 (public)
- Odoo on 0.0.0.0:8069 (internal network only via firewall)
- Firewall blocks external access to 8069

**Learning:**
- Docker containers are network-isolated
- Always test Docker-to-host communication
- `0.0.0.0` required for Docker callbacks, but secure with firewall + proxy
- Document network architecture for future reference

**Related Files:**
- `/etc/odoo/odoo.conf`
- `.ai/context.yaml` (network_requirements section)

**Tags:** `docker`, `networking`, `onlyoffice`, `production`, `security`

---

### [2025-12-16] - Production Deployment: Docker and OnlyOffice Container Setup

**Status:** ✅ Resolved

**Context:**
Deploying OnlyOffice integration to production server (smb-hkt.com) for the first time.

**Problem:**
Multiple steps required:
1. Docker not installed on production
2. OnlyOffice Document Server setup
3. JWT secret extraction
4. Odoo module installation
5. Configuration in Odoo UI

**Solution:**

**Step 1: Docker Installation**
```bash
sudo apt update
sudo apt install -y docker.io curl
sudo systemctl start docker
sudo systemctl enable docker
```

**Step 2: OnlyOffice Document Server**
```bash
sudo docker run -i -t -d -p 8080:80 --restart=always \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver
```

**Step 3: JWT Secret Extraction**
```bash
sudo docker exec onlyoffice-documentserver \
  cat /etc/onlyoffice/documentserver/local.json | grep -A 5 '"secret"'
```
Secret found: `G36qo7JjKtYlBCZqOkXOL4NSCwhIIGjh`

**Step 4: Python Dependencies**
```bash
sudo -u odoo /opt/odoo/odoo/venv/bin/pip install pyjwt
```

**Step 5: Fix Ownership (module was copied as root)**
```bash
sudo chown -R odoo:odoo /opt/odoo/odoo/custom_addons/onlyoffice_odoo
```

**Step 6: Install Module in Odoo**
```bash
sudo systemctl stop odoo
sudo -u odoo /opt/odoo/odoo/venv/bin/python3 /opt/odoo/odoo/odoo-bin \
  -c /etc/odoo/odoo.conf \
  -d odoo_smb \
  -i onlyoffice_odoo \
  --stop-after-init
sudo systemctl start odoo
```

**Result:**
- ✅ Docker installed: v28.2.2
- ✅ OnlyOffice container running (healthcheck: true)
- ✅ JWT secret extracted
- ✅ PyJWT installed successfully
- ✅ Module installed in Odoo (0.74s load time)
- ⏳ Next: UI configuration needed

**Learning:**
- Production deployment requires system-level changes (Docker)
- Always verify file ownership after copying modules
- JWT authentication enabled by default in OnlyOffice v7.2+
- Test each step before proceeding to next

**Related Files:**
- `.ai/ONLYOFFICE_PRODUCTION_CHECKLIST.md`
- `.ai/context.yaml` (deployment section)

**Tags:** `production`, `deployment`, `docker`, `onlyoffice`, `first-time-setup`

---

### [2025-12-16] - Warning: Models Have No Access Rules

**Status:** ⚠️ Acceptable (Non-Critical)

**Context:**
During OnlyOffice module installation, Odoo logged a warning about missing access rules.

**Problem:**
```
WARNING odoo_smb odoo.modules.loading: The models ['onlyoffice.odoo'] have
no access rules in module onlyoffice_odoo, consider adding some
```

**Root Cause:**
The OnlyOffice module defines a model but doesn't specify security access rules (ir.model.access).

**Technical Explanation:**
- Odoo's security system requires explicit access rules for each model
- Without rules, model is inaccessible to all users by default
- Warning suggests adding a CSV file: `security/ir.model.access.csv`

**Solution:**
**Short-term:** Acceptable - module still works (doesn't expose user-facing models)

**Long-term (Optional Improvement):**
Create `security/ir.model.access.csv`:
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_onlyoffice_odoo,access_onlyoffice_odoo,model_onlyoffice_odoo,base.group_user,1,0,0,0
```

**Learning:**
- Not all warnings are critical
- Access rules are best practice but optional for internal models
- Consider security implications before allowing model access
- Document decisions to accept warnings vs fix them

**Related Files:**
- `custom_addons/onlyoffice_odoo/models/`
- (Missing) `custom_addons/onlyoffice_odoo/security/ir.model.access.csv`

**Tags:** `odoo`, `security`, `warning`, `non-critical`

---

### [2025-12-16] - Certbot Fails When Nginx Has SSL Block Without Certificates

**Status:** ✅ Resolved

**Context:**
Running `scripts/onlyoffice-subdomain-setup.sh` on production host to publish `onlyoffice.smb-hkt.com` via Nginx and obtain a Let's Encrypt certificate.

**Problem:**
`nginx -t` failed with `no "ssl_certificate" is defined for the "listen ... ssl" directive` because the generated config contained an HTTPS server block before certificates existed.

**Root Cause:**
Nginx requires certificate paths whenever `listen ... ssl` is present. The script emitted an HTTPS server without cert paths, so config validation failed before certbot could run and populate them.

**Solution:**
- Generate an HTTP-only reverse proxy config first (no `listen ... ssl` block).
- Let `certbot --nginx` inject the HTTPS server, certificate paths, and redirects after validation.
- Updated `scripts/onlyoffice-subdomain-setup.sh` accordingly; rerun the script to regenerate `/etc/nginx/sites-available/onlyoffice` before invoking certbot.

**Learning:**
When using certbot's Nginx installer, start from a valid HTTP config; let certbot own the HTTPS server stanza and certificate references.

**Related Files:**
- `scripts/onlyoffice-subdomain-setup.sh`

**Tags:** `deployment`, `nginx`, `certbot`, `onlyoffice`, `production`

---

### [2025-12-16] - File Upload Fails with "File too large" (8.9 MB)

**Status:** ✅ Resolved

**Context:**
Uploading `PowerPoint-Object-In-Docs-MS365-20251208.docx` (~8.9 MB) in Odoo UI raised "File too large".

**Problem:**
Nginx reverse proxy for `smb-hkt.com` lacked `client_max_body_size`, so the default (1 MB) caused HTTP 413, surfaced to the frontend as "File too large".

**Root Cause:**
Main Odoo vhost `/etc/nginx/sites-enabled/smb-hkt` had no upload size override; OnlyOffice vhost had 100M, but main site didn't.

**Solution:**
- Set `client_max_body_size 100M;` in `/etc/nginx/sites-enabled/smb-hkt`.
- Validate and reload Nginx: `nginx -t && systemctl reload nginx`.
- Result: uploads up to 100 MB now accepted.

**Learning:**
Configure `client_max_body_size` on all relevant vhosts (Odoo + OnlyOffice). Default Nginx 1 MB is too small for documents.

**Related Files:**
- `/etc/nginx/sites-enabled/smb-hkt` (server block)

**Tags:** `nginx`, `upload`, `odoo`, `production`

---

### [2025-12-16] - Production Snapshot Created (Hetzner)

**Status:** ✅ Recorded

**Context:**
Hetzner console shows a snapshot taken for production host `ubuntu-8gb-nbg1-1` (91.99.22.41).

**Details:**
- Snapshot name: `ubuntu-8gb-nbg1-1-1765908042-odoo-ce-onlyoffice-preprod-2025-12-16-2100`
- Created: 2025-12-16 (console shows “less than a minute ago” at capture time)
- Provider: Hetzner (CPX32)
- Screenshot reference: Hetzner Console → Servers → ubuntu-8gb-nbg1-1 → Snapshots (ID `341540964`)

**Purpose / Note:**
Backup point after enabling HTTPS for OnlyOffice and increasing upload limits. Useful restore point before further changes.

**Tags:** `snapshot`, `backup`, `hetzner`, `production`

---

### [2025-12-17] - OnlyOffice Draw.io Plugin Discovery & SVG Plan

**Status:** ✅ Documented

**Context:**
OnlyOffice Document Server ships without draw.io by default; plugin is installed from the in-editor Marketplace. We need SVG export (with embedded mxfile) to improve diagram quality/PDF output and reduce file size. Claude’s prep package lives at `/home/embed/Dev/ODOO/onlyoffice-drawio-help`.

**Findings:**
- Plugin bundles live under `/var/www/onlyoffice/documentserver/sdkjs-plugins/` inside the container; marketplace and multiple GUID-named dirs present (see `drawio_plugin_analysis.txt`).
- Discovery script available: `onlyoffice-drawio-help/find_drawio_plugin.sh` → writes `drawio_plugin_analysis.txt`.
- Implementation guidance and code samples: `implementation_guide.md`, `plugin_modified_svg.js`, `png_vs_svg_comparison_testing.md`, `drawio_svg_analysis.md`, `executive_summary_recommendations.md`.
- Target change set: export format `png → svg`, `embedXml true`, MIME `image/svg+xml`, store mxfile in SVG metadata, ensure edit flow extracts mxfile from SVG with PNG fallback.
- Current container state: draw.io plugin binaries are **not present** under `sdkjs-plugins` (only default plugins listed in `config.json` dumps); no files found via `find ... '*drawio*'` or string search. Draw.io must be installed via Plugin Manager first to materialize its GUID directory under `sdkjs-plugins` or marketplace cache.
- Upstream sources located: DocSpace plugin `docspace-plugins-master/draw.io` (v1.2.0, uses `@onlyoffice/docspace-plugin-sdk@^2.0.0`) embeds `https://embed.diagrams.net?proto=json&embed=1` and handles `.drawio` + `.png` via formats `xml`/`xmlpng`; new files seeded from a blank `mxfile` and saves/export use DocSpace REST endpoints. sdkjs example pack under `sdkjs-plugins-master/` contains no draw.io implementation.
- 2025-12-17 discovery run (docker exec): `onlyoffice-documentserver` container healthy, `sdkjs-plugins` hosts default plugins (Photo Editor, YouTube, OCR, Translator, AI, Mendeley, Thesaurus, Highlight code, Zotero, Speech, Speech input); no draw.io manifest or directory present. `drawoffice-nginx` container is in restart loop. Nginx logs show no draw.io activity.
- 2025-12-17 user confirmation: draw.io Plugin Manager install completed in the local OnlyOffice UI (button visible on ribbon, test insertion done). Container scans still show no draw.io files, implying either a different VM/container hosts the installed plugin or persistence lives outside the scanned paths—need to locate the actual plugin directory before SVG patching.
- 2025-12-17 rescans: repeated `find_drawio_plugin.sh` + `grep draw.io/diagrams.net` across `/var/www/onlyoffice/documentserver` and `/var/lib/onlyoffice/documentserver` still return nothing; marketplace dir has no draw.io package. Hypothesis: Odoo is connected to another Document Server instance/VM or plugin cache is mounted elsewhere. As fallback, we can build/publish our own plugin per marketplace guide using `docspace-plugins-master/draw.io` or `jgraph/drawio`.
- Marketplace references logged: public marketplace repo `onlyoffice.github.io` (https://github.com/ONLYOFFICE/onlyoffice.github.io/tree/master) and Plugin Manager store assets under `/store`; related discussion: https://github.com/ONLYOFFICE/onlyoffice.github.io/issues/356.

**Action Items (next steps):**
1) Run discovery script against the live Document Server container to confirm plugin path and manifest.  
2) Backup container, then apply `plugin_modified_svg.js` changes to the draw.io plugin entry (expected path under sdkjs-plugins).  
3) Clear caches, restart container, and execute SVG vs PNG test plan (DOCX unzip check for `image*.svg`, PDF zoom at 400%).  
4) Update `.ai/context.yaml` once deployed (plugin path, change summary, backup image/tag), add session log.

**Tags:** `onlyoffice`, `drawio`, `plugin`, `svg`, `quality`, `documentation`

---

## 🔍 Quick Reference: Common Issues

### Issue: Module Not Found
**Cause:** Not in addons_path
**Fix:** Check `odoo.conf` → `addons_path` includes module directory

### Issue: Permission Denied
**Cause:** Wrong file ownership
**Fix:** `sudo chown -R odoo:odoo /path/to/module`

### Issue: OnlyOffice Cannot Reach Odoo
**Cause:** Network isolation (Docker) or wrong URL
**Fix:** Set `http_interface = 0.0.0.0` + use host IP/domain (not localhost)

### Issue: JWT Authorization Error
**Cause:** Wrong or missing secret
**Fix:** Extract secret from container, paste in Odoo settings

---

## 📊 Statistics

- **Total Issues Logged:** 5
- **Resolved:** 4 ✅
- **Acceptable/Workaround:** 1 ⚠️
- **In Progress:** 0 🔄
- **Blocked:** 0 ❌

---

## 🏷️ Tags Index

- `odoo-19`: Odoo 19.0 specific issues
- `onlyoffice`: OnlyOffice module related
- `docker`: Docker container issues
- `production`: Production deployment
- `compatibility`: Version compatibility
- `breaking-changes`: API breaking changes
- `security`: Security considerations
- `networking`: Network configuration

---

**Last Updated:** 2025-12-17
**Maintained By:** AI Agent + Project Team
**Version:** 1.0.0
