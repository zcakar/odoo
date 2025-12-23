# SODOO URL Change Analysis: /odoo → /sodoo

**Date:** 2025-12-23  
**Task:** Change all `/odoo` URLs to `/sodoo` for SODOO rebranding

---

## 📋 Affected Files Analysis

### 1. **Core Web Controllers** (Priority: HIGH)

#### `addons/web/controllers/home.py`
- **Line ~40**: `@http.route(['/web', '/odoo', '/odoo/<path:subpath>', '/scoped_app/<path:subpath>']`
- **Line ~35**: `return request.redirect_query('/odoo', query=request.params)`
- **Impact**: Main web client routing - CRITICAL

#### `addons/web/controllers/webmanifest.py`
- **Lines 47-48**: 
  ```python
  'scope': '/odoo',
  'start_url': '/odoo',
  ```
- **Line ~80**: `('Service-Worker-Allowed', '/odoo')`
- **Impact**: PWA manifest and service worker scope

#### `addons/web/controllers/database.py`
- **Line ~XX**: `return request.redirect('/odoo')`
- **Impact**: Database manager redirects

#### `addons/web/controllers/utils.py`
- **Line ~XX**: `return redirect or ('/odoo' if is_user_internal...`
- **Impact**: Login redirect logic

#### `addons/web/controllers/session.py`
- **Line ~XX**: `def logout(self, redirect='/odoo'):`
- **Impact**: Logout redirect

---

### 2. **Test Files** (Priority: MEDIUM)
- `addons/web/tests/test_db_manager.py`
- `addons/web/tests/test_assets.py`
- `addons/web/tests/test_login.py`
- **Impact**: Tests will fail if not updated

---

### 3. **Static Files & JavaScript** (Priority: HIGH)
Need to search:
- `*.js` files in `addons/web/static/src/`
- Service worker files
- Manifest files

---

### 4. **Nginx Configuration** (Priority: CRITICAL)
**Location:** Production server `/etc/nginx/sites-available/smb-hkt.com`

Expected changes:
```nginx
# OLD
location /odoo {
    proxy_pass http://127.0.0.1:8069;
}

# NEW
location /sodoo {
    proxy_pass http://127.0.0.1:8069;
}
```

---

### 5. **Database Parameters** (Priority: HIGH)
Check `ir.config_parameter` table for any `/odoo` references:
- `web.base.url`
- Other URL-related parameters

---

## ⚠️ RISKS & CONSIDERATIONS

1. **Breaking Changes**: 
   - Existing bookmarks will break
   - External integrations may break
   - Mobile PWA installations will need reinstall

2. **Backward Compatibility**:
   - Consider keeping `/odoo` as redirect to `/sodoo` temporarily
   - Add route: `/odoo` → `redirect('/sodoo')`

3. **OnlyOffice Integration**:
   - Check if OnlyOffice has hardcoded `/odoo` paths
   - JWT callback URLs may need update

4. **Session Cookies**:
   - Cookie paths may need adjustment
   - Check `session.py` for cookie path settings

---

## 📝 RECOMMENDED APPROACH

### Phase 1: Code Changes (Development)
1. Update all Python controllers
2. Update JavaScript/static files
3. Update tests
4. Test locally

### Phase 2: Dual-Path Support (Transition)
1. Keep both `/odoo` and `/sodoo` working
2. `/odoo` redirects to `/sodoo`
3. Deploy to production
4. Monitor for issues

### Phase 3: Full Migration (After Testing)
1. Remove `/odoo` routes
2. Update nginx config
3. Update documentation

---

## 🎯 NEXT STEPS

1. Complete file search for all `/odoo` references
2. Create comprehensive change list
3. Implement changes with backward compatibility
4. Test thoroughly in development
5. Deploy to production with monitoring

