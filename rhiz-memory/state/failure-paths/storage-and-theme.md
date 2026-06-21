# Failure Paths: Storage Architecture and Theme System

**Feature area**: `StorageEngine.js` (OPFS), localStorage migration, `ThemeManager.js`  
**Related state docs**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) Parts 1, 9  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-STORE-01 — OPFS Single-File Design: Colons Illegal in Windows Filenames

**Feature scope**: `StorageEngine.js` — OPFS-backed key/value store. All storage keys
use the `tvs:` prefix (e.g. `tvs:active-theme`, `tvs:dock:props-panel`).

**Approach and root cause**: An early design stored each key as a separate file in OPFS,
using the key name as the filename. Colons (`:`) are legal in POSIX filenames and in JSON
keys, but are illegal in Windows filesystem paths. `getFileHandle('tvs:active-theme')`
fails on Windows (Tauri target) without a meaningful error — it either throws or silently
produces a broken handle.

**Fix**: All key/value pairs are stored in a single `tvs-state.json` file. The entire
cache is serialized to JSON on flush. Colons are legal in JSON object keys. Example:
```json
{ "tvs:active-theme": "dark", "tvs:dock:props-panel": "float" }
```

**Confirmation status**: **Confirmed**. OPFS works on Windows (Tauri), macOS (Tauri),
and GitHub Pages PWA without issues.

**Extracted lesson**: OPFS filenames must be legal on all target OS filesystems, not
just the development machine. Characters legal in URLs, JSON, or POSIX that are illegal
on Windows (`:`, `<`, `>`, `*`, `?`, `\`, `/`, `|`, `"`) must not appear in filenames.
Use a single aggregated JSON file for key/value stores rather than one-file-per-key.

---

## F-STORE-02 — One-Time Migration Carries Forward Stale localStorage Values

**Feature scope**: `StorageEngine.js` — `_migrateFromLocalStorage()`, called on the
first OPFS-enabled load, guarded by the absence of `tvs-state.json`.

**Approach and root cause**: The migration copies all `tvs:` prefixed keys from
`localStorage` to the OPFS cache, then removes them from `localStorage`. It runs once
(presence of `tvs-state.json` prevents re-migration). It cannot distinguish between
"user's current intended state" and "stale development artifact from a prior session."

On `david-coneff.github.io`, `localStorage` was shared across all apps on that origin.
Previous development sessions had written `tvs:theme-a='light'`, `tvs:theme-b='dark'`,
and a `tvs:active-theme` value pointing to a theme combination that looked "extra dark"
when applied. The migration promoted these stale values to OPFS, where they persisted
permanently.

**Symptom**: PWA loaded with unexpected/wrong theme after the OPFS migration was first
deployed. Clearing site data in DevTools resolved it (wipes OPFS, forces a clean init).

**Confirmation status**: **Confirmed** as the root cause of the stale-theme symptom.
The user confirmed that clearing site data resolved the issue.

**Extracted lesson**: The localStorage migration is a one-way door. Before the first
deployment that includes OPFS migration, ensure `localStorage` on the target origin
is known-good — or run a pre-migration cleanup pass that removes known-stale keys.
Document the "clear site data" reset path prominently for users who encounter wrong
state post-migration.

---

## F-THEME-01 — applyTheme() Silent Return on Unknown Theme ID

**Feature scope**: `ThemeManager.js` — `applyTheme(themeId)`, called at init and on
theme changes. Applies CSS custom properties to `:root` via a `<style>` injection.

**Approach and root cause**: The guard `if (!theme) return;` exited silently when
`getThemeById(themeId)` returned null. This left `:root` with no CSS custom properties,
causing all `var(--bg)`, `var(--text)`, `var(--accent)` etc. references to resolve to
their unset fallback values — an appearance darker and more unstyled than any theme.

**Root cause sequence**:
1. User creates or uses a custom theme → `tvs:active-theme = 'custom-xyz'`
2. OPFS is wiped (site data clear, storage eviction, or migration reset)
3. The custom theme definition is gone; `tvs:active-theme` key is restored from
   localStorage migration with the stale custom ID
4. `applyTheme('custom-xyz')` → `getThemeById('custom-xyz')` → `null` → silent return
5. No CSS applied → unthemed "extra dark" appearance

**Fix**:
```js
export function applyTheme(themeId) {
  var theme = getThemeById(themeId);
  if (!theme) {
    if (themeId !== 'dark') applyTheme('dark');  // safe recursive fallback, terminates
    return;
  }
  // ... rest unchanged
}

// In init block:
var activeId = StorageEngine.getItem('tvs:active-theme') || 'dark';
if (!getThemeById(activeId)) {
  activeId = 'dark';
  StorageEngine.setItem('tvs:active-theme', 'dark');
}
applyTheme(activeId);
```

**Confirmation status**: **Hypothetical**. Fix committed `790771e`, merged to main
`d0d2d33`. User has not yet confirmed the PWA no longer shows the extra-dark state
after clearing site data and reloading.

**Extracted lesson**: Any function that maps a user-stored ID to a registry entry
must handle the missing-entry case explicitly. Silent returns that leave the UI in
an indeterminate visual state are worse than a visible fallback — the user cannot
understand why the UI looks broken. Default to the safest known-good value (`'dark'`)
and persist the corrected value so it does not recur on the next load.
