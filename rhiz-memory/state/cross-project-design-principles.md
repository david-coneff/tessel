# Cross-Project Design Principles

These principles apply across all PAP-based projects deployed under the same GitHub account.
They exist to make per-project decisions automatic rather than requiring case-by-case thought.

---

## P-001 — OPFS as the Standard Persistence Layer

**Principle:** Use the Origin Private File System (OPFS) as the primary storage layer for
all non-volatile app state, with localStorage as a transparent fallback for `file://` contexts.

**Rationale:**
- localStorage is scoped to the origin (`david-coneff.github.io`), meaning all apps under
  the same GitHub Pages account share the same storage namespace
- Namespacing keys (e.g. `tessel-theme`) prevents accidental collision but does not prevent
  cross-app access — any app can read, write, or delete any key regardless of prefix
- OPFS is scoped to the origin AND path, providing true per-app storage isolation at zero cost
- OPFS also has larger quota and is not cleared by browser storage pressure as aggressively
  as localStorage

**Implementation pattern:**

```js
// StorageEngine — auto-selects backend based on context
const StorageEngine = {
  async get(key) { /* try OPFS, fall back to localStorage */ },
  async set(key, value) { /* try OPFS, fall back to localStorage */ },
  async remove(key) { /* try OPFS, fall back to localStorage */ },
};

function isOpfsAvailable() {
  return typeof navigator !== 'undefined'
    && navigator.storage
    && typeof navigator.storage.getDirectory === 'function'
    && location.protocol !== 'file:';
}
```

**Portability constraint:** OPFS requires a proper origin (`http://`/`https://`). It does NOT
work on `file://` protocol. Apps that must remain openable as local files (e.g. Tessel VS
`tessel-vs.html`) must keep localStorage as a fallback. The StorageEngine abstraction handles
this transparently — calling code never needs to know which backend is active.

**sessionStorage is unchanged:** Credentials and other intentionally volatile state remain in
sessionStorage (cleared on tab close). OPFS is for persistent, non-sensitive preferences and UI state.

**Browser support:** OPFS available in Chrome 86+, Firefox 111+, Safari 15.2+.

**AD reference:** AD-T-016 (Tessel), to be mirrored in each project that adopts this pattern.

---

## P-002 — GitHub Pages Deployment Pattern

**Principle:** Each project is deployed as its own GitHub Pages site from its own repo,
using a GitHub Actions workflow that builds and deploys on push to `main`.

**Rationale:**
- All repos under `david-coneff.github.io` share the same origin for localStorage
- Separate repos → separate paths (`/tessel/`, `/broodforge/`, etc.) → separate OPFS namespaces
- No custom domain cost; isolation is achieved by following P-001 (OPFS)
- GitHub Actions build-on-push means deployed version always matches `main` automatically

**Standard workflow pattern:**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Required repo settings:**
- Settings → Pages → Source: "GitHub Actions" (not "Deploy from a branch")
- `.nojekyll` at repo root (prevents Jekyll from processing files)
- `_config.yml` with `exclude:` for any markdown files containing `{{...}}` or TypeScript
  type annotations that would be misread as Liquid template syntax

**Vite base path:** If using Vite and deploying to a subdirectory (e.g. `/tessel/`), set
`base: '/reponame/'` in `vite.config.js`. Also set `scope` and `start_url` in the PWA
manifest to `/reponame/`. Without this, CSS and JS asset paths will be wrong (404).

See `rhiz-memory/state/github-pages-deployment.md` for detailed troubleshooting notes.
