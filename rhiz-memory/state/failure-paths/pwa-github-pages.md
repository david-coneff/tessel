# Failure Paths: PWA — GitHub Pages Deployment

**Feature area**: GitHub Pages hosting, CDN cache behavior, Jekyll processing,
`vite.config.pwa.js`, `public/` static assets.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §5, §9  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-PWA-01 — GitHub Pages CDN Serves Stale Build After Push

**Feature scope**: GitHub Pages deployment at `david-coneff.github.io/tessel`.
The PWA is a Vite-built SPA; the `dist-pwa/` output is pushed to the `gh-pages`
branch on every deploy.

**Root cause**: GitHub Pages is served from a CDN. After a push to `gh-pages`,
the CDN does not invalidate all edges simultaneously. A hard refresh (`Ctrl+Shift+R`)
sometimes returned cached files from before the push. The issue was particularly
visible for `index.html` (small, frequently cached with a short TTL) vs. JS bundles
(hash-named, effectively cache-busted by Vite).

The symptom was: the deployed build appeared unchanged even though git showed the
new commit was on `gh-pages`. Source-of-truth was the raw GitHub CDN URL, not the
browser cache.

**Diagnosis sequence**:
1. Wait 60–90 seconds after the Pages deployment action shows green.
2. Open the raw CDN URL directly (`https://david-coneff.github.io/tessel/`) in
   an incognito window.
3. If stale: the CDN is lagging — not a code or build issue.
4. If current: clear browser cache and reload.

**Confirmation status**: **Confirmed** as a recurring operational pattern.
No code fix; operational awareness only.

**Extracted lesson**: GitHub Pages CDN propagation is not instantaneous.
Allow 60–120 seconds after a Pages deployment goes green before concluding
a fix "didn't work." Always verify in an incognito window to eliminate browser
cache as a variable. Use hash-named JS bundles (Vite default) to guarantee
cache-busting on content changes; `index.html` will lag but JS/CSS will not.

---

## F-PWA-02 — Jekyll Processes Files in gh-pages Branch

**Feature scope**: `gh-pages` branch root — the output of `vite build --config vite.config.pwa.js`.

**Root cause**: GitHub Pages runs Jekyll by default on any branch it serves,
unless a `.nojekyll` file is present at the root. Jekyll skips files and
directories beginning with `_`. Vite sometimes emits chunks or asset directories
that begin with `_` (e.g., `_assets/`, `_plugin-vue_xxx.js`). Jekyll silently
omitted these files, causing 404s for hashed JS chunks at runtime.

**Fix**: Add a `.nojekyll` file to the `gh-pages` branch root. In the deploy
workflow or Vite config postbuild step:
```bash
touch dist-pwa/.nojekyll
```
Then include it in the gh-pages push. Alternatively, use the `actions/configure-pages`
GitHub Action which handles this automatically.

**Confirmation status**: **Confirmed**. 404s for `_`-prefixed assets resolved
after `.nojekyll` was added.

**Extracted lesson**: Any GitHub Pages site that is not a plain Jekyll blog needs
`.nojekyll` in the branch root. Add it to the build output directory as part of
the deploy step, not as a one-time manual commit. Vite's output can include
`_`-prefixed filenames depending on plugin naming conventions; Jekyll silently
drops them without `.nojekyll`.
