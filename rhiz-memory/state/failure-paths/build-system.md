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

---

## F-BUILD-03 — esbuild Single-File Studio Build (Vite → esbuild migration)

**Feature scope**: The single-file studio ship build moved from
`vite build` + `vite-plugin-singlefile` to a self-contained esbuild roll-up
(`studio/build.mjs`) — an AI-agent-runnable, config-free `npm run build` that
emits the same `studio/tessel-vs.html`. This is rhiz-Partition modality B /
[DS-002](https://github.com/david-coneff/rhizome). Vite is retained for the PWA
build (`build:pwa`, service worker + manifest), for `dev` (HMR), and as the
`build:studio:vite` fallback.

**The dependency-tree change**: esbuild has no HTML-entry concept and cannot see
CSS pulled in by the shell's `<link>` tags. A new entry `studio/src/build-entry.js`
reroutes the four stylesheets (`variables`/`base`/`themes`/`tessel-ui`, in cascade
order) **into the JS module graph**, then imports `main.js` — so a JS module is
the single root esbuild walks. `studio/build.mjs` derives its inline-ready shell
from `studio/src/tessel-vs.html` itself (stripping the `<link>` + `<script src>`
tags), keeping one shell source of truth shared with the Vite path.

**Gotchas hit and fixed (verify the EMITTED file, not just that it compiled):**

1. **Top-level await breaks `format: 'iife'`.** `StorageEngine.js` uses TLA for
   OPFS init. esbuild cannot lower TLA into an IIFE — it errors at build time.
   **Fix**: `format: 'esm'`, inlined as `<script type="module">`. Everything is
   inlined, so the `file://` "no module fetch" restriction never bites. (Same
   TLA root cause as F-BUILD-01, different surface.)
2. **The legacy `dist/tessel.bundle.js` was NOT self-contained under Vite.** The
   shell's `<script src="../../dist/tessel.bundle.js">` points *outside* the Vite
   root, so `vite-plugin-singlefile` left it as an external reference — the
   "single file" actually 404'd that script from a bare `file://` open. The
   esbuild build **inlines** it as a classic `<script>` before the module
   (preserving the `window.Tessel` global the produced-forms path expects), so
   the output is genuinely self-contained. (Studio runtime itself uses the
   modular `TesselCompiler.js`, not the global — the inlined bundle is vestigial
   for the studio but kept for parity; dropping it is a possible future ~160 KB
   saving once produced-forms independence is confirmed.)
3. **`</script>` / `</style>` escaping.** The inliner escapes both in the emitted
   artifact so the inline tags can't terminate early.

**Confirmation status**: **Confirmed**. `node tools/rollup.cjs && node studio/build.mjs`
produces a 513 KB self-contained `studio/tessel-vs.html`; a headless Chromium
load boots the app (title, `#toolbar`, dock panes, status bar "Ready", pop-out
buttons present) with **0 console errors and 0 external/network requests**.

**Extracted lesson**: When swapping a single-file bundler, the HTML shell stops
being the asset root — reroute CSS (and any `<link>`ed asset) into the JS module
graph so the new bundler can see it. Pick `esm` over `iife` whenever the codebase
has top-level await. And re-grep the *emitted* file for external `src`/`href`:
the old "single file" may have been silently leaking an external reference the
new build can fix.
