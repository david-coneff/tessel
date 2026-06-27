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

---

## F-BUILD-04 — esbuild PWA / Service Worker (no Vite, no Workbox)

**Feature scope**: The PWA build (`build:pwa`, deployed to `/tessel/` by
`deploy-pwa.yml`) moved from `vite-plugin-pwa` to a hand-rolled esbuild build,
`studio/build-pwa.mjs` + `studio/tessel-pwa/sw.js`. Vite is retained as a
`build:pwa:vite` fallback.

**Is a service worker migratable off Vite? Yes — no technical limitation.** A SW
is just JS that esbuild bundles. `vite-plugin-pwa` automated three things, all of
which become a few lines of explicit code:

1. **Workbox precache manifest + per-asset revisioning** — replaced by a single
   `sha256(index.html)` content hash, because the esbuild single-file build
   inlines the *entire* app into one `index.html`. One shell to precache, one
   hash to bust the cache. (A multi-asset app would precache a small explicit
   list with the same per-build hash, or call `workbox-build` from Node — also
   Vite-independent — if Workbox's revisioning is wanted.)
2. **Web app manifest emission** — a static `manifest.webmanifest` written from
   the same config object the Vite plugin took.
3. **SW registration** — a 3-line `navigator.serviceWorker.register('sw.js')`
   injected into `index.html`.

**Gotchas (web-platform facts, not esbuild ones):**

- **A SW only registers in a secure context** — `https` or `http://localhost`,
  **never `file://`**. So unlike the single-file studio build, the PWA can't be
  smoke-tested by opening the file; it must be *served*. Verification served
  `dist/` under `/tessel/` on localhost and drove it headless.
- **A PWA is intentionally multi-file** — the SW caches discrete URLs
  (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/icon.svg`), the opposite
  of single-file inlining. The *app* is still one inlined `index.html`; the SW +
  manifest + icon sit beside it as separately-cacheable resources. This is why
  the old config noted "the PWA build cannot use vite-plugin-singlefile."
- **`skipWaiting` + `clients.claim`** reproduce the old `registerType: 'autoUpdate'`
  so a new deploy takes over immediately.
- **Add an explicit `<link rel="icon">`** or the browser's default `/favicon.ico`
  probe 404s (harmless, but it shows up as a console error in tests).

**Confirmation status**: **Confirmed**. `npm run build:pwa` emits
`studio/tessel-pwa/dist/{index.html,sw.js,manifest.webmanifest,icons/icon.svg}`.
Served on localhost and driven headless: the SW reaches `activated`, controls the
page, the manifest is linked and valid, and after `setOffline(true)` a reload
**still boots the app** (toolbar, status "Ready") with **0 console errors**.

**Extracted lesson**: "Can't run the service worker build without Vite" is false —
Vite/Workbox were doing precache-manifest bookkeeping, not anything esbuild lacks.
For a single-file app the whole precache table collapses to one content hash. The
only genuine constraint is the secure-context rule: test a SW over localhost, not
`file://`.
