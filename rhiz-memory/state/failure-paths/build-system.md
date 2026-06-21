# Failure Paths: Build System

**Feature area**: Vite build configuration for file://, PWA, and Tauri targets.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §9 Failure 1  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-BUILD-01 — Vite Target es2020 Rejects Top-Level Await

**Feature scope**: `StorageEngine.js` uses top-level await for OPFS init. Vite must
compile with `build.target: 'es2022'` or higher.

**Approach and root cause**: Default Vite/esbuild target is `es2020`. Top-level await
(`await` at module scope, outside any function) is not supported at this target level.
esbuild either strips or rejects it. The error appears at runtime in the browser
console, not at build time:

```
Top-level await is not available in the configured target environment
```

This makes it look like a runtime browser issue rather than a build config issue,
which added a diagnostic step before the root cause was identified.

**Fix**:
```js
// vite.config.js AND vite.config.pwa.js
export default defineConfig({
  build: {
    target: 'es2022',
  }
})
```

**Confirmation status**: **Confirmed**. Build succeeded after raising the target in
both config files.

**Extracted lesson**: Any codebase using top-level await requires `build.target: 'es2022'`
minimum. Set this at project creation. The error manifests at runtime (not build time),
so CI will not catch it — only a browser load test will.

---

## F-BUILD-02 — Two Vite Config Files: Fix Both or Neither

**Feature scope**: The project has two Vite configs: `vite.config.js` (file:// and
Tauri) and `vite.config.pwa.js` (GitHub Pages PWA). Settings that must apply to both
deployment targets must appear in both files.

**Approach and root cause**: The `es2022` target fix was applied to `vite.config.js`
first. The PWA build continued failing with the identical error because
`vite.config.pwa.js` still specified `es2020`. The identical error message made it
appear the first fix had not worked, when in fact it had worked for one of two targets.

**Fix**: Applied `target: 'es2022'` to `vite.config.pwa.js` as well. Both configs
now share the same target.

**Confirmation status**: **Confirmed**. Both builds pass.

**Extracted lesson**: Treat all `vite.config*.js` files as a set. When changing a
build-level setting, grep for every config file and apply the change to all of them.
The duplication is intentional (each config produces a different bundle), but
settings that are prerequisites of the codebase (like `es2022` for top-level await)
must be consistent across all of them.

```bash
# Quick check: find all vite configs
ls vite.config*.{js,ts} 2>/dev/null
```
