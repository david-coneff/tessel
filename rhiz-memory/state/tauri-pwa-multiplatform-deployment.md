# Multi-Target Deployment Setup: file://, PWA, and Tauri

**Project**: Tessel VS  
**Recorded**: 2026-06-21  
**Applies to**: Any Vite-based single-file web app targeting file://, GitHub Pages PWA, and Tauri desktop

---

## Overview

Tessel VS supports three distinct deployment targets, each with different capabilities,
storage isolation guarantees, and window management behaviors. The codebase uses
runtime detection to branch into target-appropriate code paths without separate builds
for file:// and PWA. Tauri is a separate build using the same source.

| Target | Storage | Pop-out Windows | Minimize Sync | Offline |
|--------|---------|-----------------|---------------|---------|
| file:// | localStorage (shared origin) | window.open() popups | No | Yes |
| PWA (GitHub Pages) | OPFS (per-app origin) | window.open() popups | No | Yes (SW) |
| Tauri desktop | OPFS (per-app origin) | Native WebviewWindows | Yes | Yes |

---

## Part 1: Storage Layer (StorageEngine)

### Why

localStorage on GitHub Pages is shared across all apps on the same subdomain
(e.g. `david-coneff.github.io`). OPFS (Origin Private File System) is scoped
per origin path, giving true per-app isolation. file:// cannot use OPFS (Chrome
blocks it), so localStorage is the accepted fallback there.

### Implementation

`studio/src/lib/StorageEngine.js` — single module, top-level await, exports a
drop-in replacement for localStorage:

```js
export function getItem(key) { ... }
export function setItem(key, value) { ... }
export function removeItem(key) { ... }
export function getKeys(prefix) { ... }  // replaces localStorage.length/key(i) loops
export var isOpfs = _useOpfs;
```

**Key design decisions:**

- All key/value pairs stored in a single `tvs-state.json` file in the OPFS root.
  Do NOT store each key as a separate file — colons in key names (e.g. `tvs:theme`)
  are illegal in Windows filenames.
- Top-level await preloads the entire OPFS cache into a `Map` before any importing
  module's synchronous init code runs. All reads are synchronous (from cache); writes
  update the cache immediately then flush to disk async via a 300ms debounce.
- On first OPFS init, all `tvs:` prefixed keys are migrated from localStorage to
  OPFS, then removed from localStorage. This is a one-time operation.
- localStorage fallback activates automatically when `location.protocol === 'file:'`
  or when OPFS is unavailable.

**Migration pattern for existing codebase:**

```js
// Before
localStorage.getItem('tvs:theme')
localStorage.setItem('tvs:theme', id)
localStorage.removeItem('tvs:theme')

// For-loop enumeration before
for (var i = 0; i < localStorage.length; i++) {
  var k = localStorage.key(i);
  if (k && k.indexOf('tvs:') === 0) { ... }
}

// After — import once per file
import * as StorageEngine from './StorageEngine.js';

StorageEngine.getItem('tvs:theme')
StorageEngine.setItem('tvs:theme', id)
StorageEngine.removeItem('tvs:theme')
StorageEngine.getKeys('tvs:')  // returns string[]
```

**Vite build target:** Must be `es2022` or higher. Top-level await is not available
in `es2020` (the esbuild default). Set in `vite.config.js`:

```js
export default defineConfig({
  build: {
    target: 'es2022',
    ...
  }
})
```

**Key namespace:** All keys are prefixed `tvs:` (project-specific prefix). This
reduces accidental collision with other apps even in shared-origin contexts like
file:// or a shared subdomain. Tauri's per-app origin (`io.github.davidconeff.tessel`)
provides stronger isolation on top.

---

## Part 2: Runtime Target Detection

### Tauri detection

```js
// TauriBridge.js
export var isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
```

`window.__TAURI_INTERNALS__` is injected by the Tauri runtime into the WebView.
It is undefined in all browser contexts (file://, PWA, plain browser).

### WebView engine detection (for CSS rendering variance)

```js
// main.js — runs before initApp()
(function() {
  var ua = navigator.userAgent;
  var engine = /Chrome\/|Chromium\/|EdgA?\/|OPR\//.test(ua) ? 'chromium'
             : /AppleWebKit/.test(ua)                        ? 'webkit'
             : 'other';
  document.documentElement.setAttribute('data-engine', engine);
})();
```

**Critical:** Chromium check MUST precede WebKit check. Chrome's UA string contains
"AppleWebKit" — if you check WebKit first, Chrome is misidentified.

**Rendering variance by target:**
- Windows Tauri → WebView2 (Chromium-based) → `data-engine="chromium"`
- macOS Tauri → WKWebView (WebKit) → `data-engine="webkit"`
- Linux Tauri → WebKitGTK (WebKit) → `data-engine="webkit"`
- PWA (Chrome/Edge) → `data-engine="chromium"`
- file:// (Safari) → `data-engine="webkit"`

**Known CSS divergence points to handle:**

```css
/* scrollbar-gutter: stable — unsupported in WebKit */
@supports not (scrollbar-gutter: stable) {
  .ctrl-pane-body,
  #outline-list,
  #props-body,
  #opts-content { padding-right: 7px; }
}

/* backdrop-filter — needs -webkit- prefix */
-webkit-backdrop-filter: blur(var(--float-panel-blur, 0px));
backdrop-filter: blur(var(--float-panel-blur, 0px));
```

---

## Part 3: Tauri-Specific Window Management (TauriBridge)

### Why

In a browser, `window.open()` creates a popup. In Tauri, you should use
`WebviewWindow` from `@tauri-apps/api/webviewWindow` to open satellite panes as
native OS windows. This enables OS-level window behaviors like minimize sync,
which is impossible with browser popups.

### TauriBridge.js

Full path: `studio/src/lib/TauriBridge.js`

```js
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export var isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

// Opens a satellite pane as a native Tauri window.
// Returns a handle shaped like window.open() so existing poll/close code works.
export async function openTauriSatellite(panelId, url, w, h) {
  if (!isTauri) return null;
  var label = 'satellite-' + panelId.replace(/[^a-zA-Z0-9_-]/g, '-');
  var webview = new WebviewWindow(label, { url, width: w, height: h });
  var handle = { closed: false, _win: webview };
  handle.close = function() { webview.close(); };
  webview.once('tauri://destroyed', function() { handle.closed = true; });
  return handle;
}

// Minimize sync: when main window minimizes, all open satellite windows minimize too.
export function initTauriWindowSync(getSatelliteHandles) {
  if (!isTauri) return;
  getCurrentWindow().onWindowEvent(function(event) {
    var type = event.payload;
    var handles = getSatelliteHandles();
    Object.keys(handles).forEach(function(id) {
      var entry = handles[id];
      if (!entry || !entry.isTauri || !entry.pipWin || entry.pipWin.closed) return;
      if (type === 'Minimized') entry.pipWin._win.minimize();
      else if (type === 'Restored' || type === 'Focused') entry.pipWin._win.unminimize();
    });
  });
}
```

### Wiring into DockSystem.js

The `openSatellite()` function branches on `isTauri`:

```js
import { isTauri, openTauriSatellite } from './TauriBridge.js';

function openSatellite(panelId) {
  // ... compute url, w, h ...

  function _onWindowReady(winRef) {
    if (!winRef) return;
    // mark pip-active, hide panel, set up close polling — same for both paths
    pipPanels[panelId] = { pipWin: winRef, isSatellite: true, isTauri: isTauri, panel: panel };
    var iv = setInterval(function() {
      if (winRef.closed) { clearInterval(iv); /* cleanup */ }
    }, 500);
  }

  if (isTauri) {
    openTauriSatellite(panelId, url, w, h).then(_onWindowReady).catch(function() {});
  } else {
    _onWindowReady(window.open(url, '_blank', 'width='+w+',height='+h+',popup=1'));
  }
}
```

Export `pipPanels` from DockSystem so AppInit can pass it to the sync:

```js
var _pipPanels = {};
export function getPipPanels() { return _pipPanels; }
// ... inside initDockSystem():
var pipPanels = _pipPanels;  // local alias so existing code is unchanged
```

### Wiring into AppInit.js

```js
import { isTauri, initTauriWindowSync } from './TauriBridge.js';
import { getPipPanels } from './DockSystem.js';

// After initDockSystem():
if (isTauri) initTauriWindowSync(getPipPanels);
```

---

## Part 4: Tauri Project Scaffolding

### Directory structure

```
src-tauri/
  tauri.conf.json     — app config, bundle identifier, window defaults
  Cargo.toml          — Rust package manifest
  build.rs            — Tauri build script hook
  src/
    main.rs           — entry point (just calls lib::run())
    lib.rs            — Tauri builder setup
```

### tauri.conf.json (Tauri 2.x)

```json
{
  "productName": "Tessel VS",
  "version": "0.1.0",
  "identifier": "io.github.davidconeff.tessel",
  "build": {
    "frontendDist": "../studio",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{ "title": "Tessel VS", "width": 1280, "height": 800, "url": "tessel-vs.html" }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

**Bundle identifier** (`io.github.davidconeff.tessel`) is the key to per-app storage
isolation. Use reverse-DNS format. Each app must have a unique identifier — this
scopes OPFS, localStorage, and OS keychain entries to that app exclusively.

### Cargo.toml

```toml
[package]
name = "tessel-vs"
version = "0.1.0"
edition = "2021"

[lib]
name = "tessel_vs_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### main.rs / lib.rs

```rust
// src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { tessel_vs_lib::run(); }

// src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Tessel VS");
}
```

---

## Part 5: Dev Environment Setup

### Windows (local compilation for dev/test)

```powershell
# 1. Install Rust via winget
winget install Rustlang.Rustup

# 2. Open new terminal, install stable toolchain
rustup toolchain install stable

# 3. Install MSVC Build Tools (required by Rust on Windows)
winget install Microsoft.VisualStudio.2022.BuildTools
# Then open Visual Studio Installer → Modify → check "Desktop development with C++"

# 4. Install WebView2 runtime (usually already present on Win10/11)
winget install Microsoft.EdgeWebView2Runtime

# 5. Install Tauri CLI via npm (no separate cargo install needed)
npm install -g @tauri-apps/cli@^2

# 6. Install project dependencies
npm install
```

**Dev loop:**
```powershell
npm run tauri:dev    # hot-reload dev build targeting your local OS
npm run tauri:build  # production build for your local OS only
```

### macOS

```bash
# Rust (includes cargo)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Xcode command line tools (provides linker)
xcode-select --install

npm install -g @tauri-apps/cli@^2
npm install
npm run tauri:dev
```

### Linux (Ubuntu/Debian)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf

npm install -g @tauri-apps/cli@^2
npm install
npm run tauri:dev
```

---

## Part 6: GitHub Actions — Cross-Platform Distribution Builds

Tauri cannot cross-compile between OS platforms. Cross-platform distribution builds
are achieved by running the Tauri build on three separate GitHub Actions runners
simultaneously.

### Trigger

Push a `v*` tag to trigger a release build:

```bash
git tag v0.1.0
git push --tags
```

Or trigger manually via Actions → "Build Tauri App" → "Run workflow".

### Workflow: `.github/workflows/tauri-build.yml`

```yaml
name: Build Tauri App

on:
  push:
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: write   # required for tauri-apps/tauri-action to create GitHub Releases

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }  # use 22+; 20 deprecated on Actions runners
      - uses: dtolnay/rust-toolchain@stable
        with: { targets: '${{ matrix.target }}' }
      - name: Install Linux dependencies
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
      - run: npm ci
      - run: npm run build
      - uses: tauri-apps/tauri-action@v0
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }
        with:
          tagName: '${{ github.ref_name }}'
          releaseName: 'Tessel VS ${{ github.ref_name }}'
          releaseDraft: true
          args: --target ${{ matrix.target }}
```

**Outputs a draft GitHub Release** with installers attached:
- Windows: `.msi` + `.exe` (NSIS)
- macOS Intel: `.dmg`
- macOS Apple Silicon: `.dmg`
- Linux: `.deb` + `.AppImage`

Review the draft before publishing.

### Required GitHub token scope

The token used by this session/PAT must have the `workflow` scope to push changes
to `.github/workflows/`. Add it at: GitHub → Settings → Developer settings →
Personal access tokens → edit token → check `workflow`.

For fine-grained tokens: Repository permissions → Actions → Read and write.

---

## Part 7: Package.json Scripts Summary

```json
{
  "scripts": {
    "build": "node tools/rollup.cjs && vite build",
    "build:bundle": "node tools/rollup.cjs",
    "build:studio": "vite build",
    "build:pwa": "node tools/rollup.cjs && vite build --config vite.config.pwa.js",
    "dev": "vite",
    "watch:bundle": "node tools/rollup.cjs --watch",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

- `npm run build` — rebuilds `studio/tessel-vs.html` (single-file, for file:// testing)
- `npm run build:pwa` — rebuilds PWA dist for GitHub Pages
- `npm run tauri:dev` — local dev build with hot reload (targets your OS)
- `npm run tauri:build` — local production build (targets your OS)
- Distribution for all platforms → push a `v*` tag, let GitHub Actions do it

---

## Part 8: Cross-Project Applicability

When starting a new Vite-based app targeting the same three deployment modes:

1. Copy `StorageEngine.js` verbatim, change the key prefix (`tvs:` → your prefix)
   and the OPFS filename (`tvs-state.json` → your filename).
2. Copy `TauriBridge.js` verbatim — no project-specific content.
3. In `tauri.conf.json`, set a unique `identifier` in reverse-DNS format.
4. Copy the GitHub Actions workflow verbatim — change `releaseName` only.
5. Set `build.target: 'es2022'` in `vite.config.js`.
6. Add engine detection IIFE to `main.js` before any init calls.
7. Add WebKit CSS fixes (`-webkit-backdrop-filter`, `@supports not (scrollbar-gutter)`).
8. Wire `initTauriWindowSync` after dock/window system init.

The storage isolation hierarchy from weakest to strongest:
- `file://` → localStorage, shared across all local HTML files in Chrome
- PWA (GitHub Pages) → OPFS, scoped to `username.github.io/appname`
- Tauri → OPFS, scoped to bundle identifier, isolated from all other apps

---

## Part 9: CI/CD Failure Log — What Went Wrong and How It Was Fixed

This section records every build failure encountered during the initial Tauri CI setup
so future sessions don't repeat them.

---

### Failure 1 — Top-level await rejected by Vite (`es2020` target)

**Error:**
```
[vite] Top-level await is not available in the configured target environment
```

**Cause:** StorageEngine.js uses top-level await for OPFS init. The default esbuild
target in Vite is `es2020`, which does not support top-level await.

**Fix:** Set `build.target: 'es2022'` in **both** `vite.config.js` and
`vite.config.pwa.js`. The PWA config is a separate file — forgetting it caused the
same error on the second build after the main config was fixed.

```js
// vite.config.js AND vite.config.pwa.js
export default defineConfig({
  build: {
    target: 'es2022',  // required for top-level await
    ...
  }
})
```

---

### Failure 2 — Tauri icons missing (`No such file or directory`)

**Error (CI):**
```
error: proc macro panicked
  = help: message: failed to open icon .../src-tauri/icons/32x32.png: No such file or directory
```

**Cause:** The `src-tauri/icons/` directory was not committed to the repo along
with the initial Tauri scaffold commit.

**Fix:** Generate placeholder icon files and commit them to `src-tauri/icons/`.
Required files per `tauri.conf.json` bundle.icon array:
- `icons/32x32.png` (32×32 RGBA PNG)
- `icons/128x128.png` (128×128 RGBA PNG)
- `icons/128x128@2x.png` (256×256 RGBA PNG)
- `icons/icon.icns` (macOS icon bundle)
- `icons/icon.ico` (Windows icon, can contain multiple sizes)

**IMPORTANT — see Failure 3**: Icons must be RGBA (color type 6), not RGB.

---

### Failure 3 — Icons not RGBA

**Error (CI, run after Failure 2 fix):**
```
error: proc macro panicked
  = help: message: icon .../src-tauri/icons/32x32.png is not RGBA
```

**Cause:** The placeholder PNGs were generated as RGB (color type 2) without an
alpha channel. Tauri's `tauri::generate_context!()` macro requires all PNG icons
to have color type 6 (RGBA).

**Fix:** Regenerate all placeholder PNGs as RGBA using Python:

```python
import struct, zlib

def make_rgba_png(width, height, r, g, b, a=255):
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', c)
    raw = b''
    for y in range(height):
        raw += b'\x00'          # filter type none per row
        for x in range(width):
            raw += bytes([r, g, b, a])
    png  = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0]))
    # color type 6 ^ = RGBA
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    return png
```

Regenerate with dark background `#1a1b1e` and full alpha, then push to the repo.
Replace with real app artwork before any public release.

---

### Failure 4 — `tauri_plugin_shell` referenced but not in Cargo.toml

**Error:**
```
error[E0433]: cannot find module or crate `tauri_plugin_shell` in this scope
  --> src/lib.rs:4:17
```

**Cause:** The initial `lib.rs` scaffold included `.plugin(tauri_plugin_shell::init())`
but `tauri-plugin-shell` was never added to `Cargo.toml`.

**Fix:** Remove `.plugin(tauri_plugin_shell::init())` from `lib.rs` entirely.
The app does not need shell access. Keep `lib.rs` minimal:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Tessel VS");
}
```

---

### Failure 5 — Release creation fails (`Resource not accessible by integration`)

**Error (Windows job, which compiled successfully):**
```
##[error]Resource not accessible by integration
```

**Cause:** `tauri-apps/tauri-action@v0` tries to create a GitHub Release using
`GITHUB_TOKEN`, but the workflow had no explicit `permissions` block. The default
GITHUB_TOKEN permissions do not include `contents: write`.

Additionally, when the build is triggered via `workflow_dispatch` (not a `v*` tag),
`github.ref_name` is `main`, so the action tries to create a release tagged `main`.
This is not an error per se but the release name is wrong for test runs.

**Fix:** Add `permissions: contents: write` at the top level of the workflow:

```yaml
permissions:
  contents: write
```

Note: The actual compiled binaries (`.msi`, `.exe`, `.dmg`, `.deb`, `.AppImage`)
are produced before the release step runs — compilation itself succeeded on all
platforms once Failures 2–4 were resolved.

---

### Failure 6 — GitHub Pages 404 after clearing site data

**Symptom:** PWA was returning 404 at `https://username.github.io/reponame/`
in both regular and incognito Chrome, even though the deploy-pages workflow had
completed successfully.

**Cause (most likely):** GitHub Pages CDN entered a stale/stuck state. The
deployment artifact was correctly built and deployed (`actions/deploy-pages`
reported success), but the CDN did not propagate it to the edge.

**Fix:** Re-run `workflow_dispatch` on `deploy-pwa.yml` to force a fresh
deployment. After the new deployment completed, the URL became accessible
without any other configuration changes.

**Diagnostic steps taken first:**
1. Confirmed Pages source in repo Settings → Pages = "GitHub Actions" ✓
2. Confirmed last deploy job showed: `Evaluated environment url: https://...` ✓
3. Confirmed artifact contained `index.html` at root ✓
4. Tried `https://username.github.io/reponame/index.html` — also 404 ✓ (confirmed CDN issue, not routing)

**Note:** `index.html` directly also needed to work before the bare path worked.
Both resolved after the fresh deploy.

---

### Failure 7 — Stale localStorage migrated to OPFS with wrong theme

**Symptom:** After Phase 10 (OPFS migration), the PWA loaded with a wrong/extra-dark
theme that didn't match what was expected.

**Cause:** The one-time migration in StorageEngine.js read whatever was in localStorage
on `david-coneff.github.io` and copied it into OPFS. The localStorage on that origin
contained stale keys from previous sessions (`tvs:theme-a='light'`, `tvs:theme-b='dark'`,
wrong `tvs:active-theme` value) that were never properly cleaned up.

**Fix (for the user):** Clear site data in Chrome DevTools (Application → Storage →
Clear site data). This wipes OPFS and forces a clean init on next load.

**Fix (to prevent recurrence):** The migration only runs once (guarded by a
`tvs:opfs-migrated` flag written to OPFS). If the stored theme state is wrong after
a migration, the user can reset via Options → Themes or by clearing site data.

---

### Build attempt timeline

| Attempt | Commit | Error | Fixed by |
|---------|--------|-------|----------|
| Run 1 attempt 1 | `1a95e95b` | Icons missing (file not found) | Added icons in PR #15 |
| Run 1 attempt 2 | `25f1fcb0` | Icons missing + plugin_shell (ran on stale commit) | — |
| Run 2 | `2ea7e239` | Icons not RGBA + plugin_shell still present (wrong commit again) | Re-triggered after noticing commit mismatch |
| Run 3 | `2ea7e239` | Icons not RGBA (plugin_shell now fixed) | Regenerated icons as RGBA |
| Run 4 | `ca5ff914` | Windows: release permission error (compilation succeeded) | Added `contents: write` permission |
| Run 5 | `ca5ff914` | Expected to pass all 4 platforms | Pending |

**Key lesson:** Always verify which commit the workflow ran on before diagnosing
a failure. If a `workflow_dispatch` is triggered before a fix commit is pushed,
it runs on the old code. Check the run's "head_sha" against the latest commit on main.
