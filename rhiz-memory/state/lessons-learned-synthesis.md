# Tessel VS — Lessons Learned: Index

**Compiled**: 2026-06-21  
**Governs**: rhiz-State §6.7 — Failure Path and Lesson Governance  

Per-feature failure histories are split into focused documents. Each covers:
qualitative intent, implementation, failure paths with root causes, confirmation
status, and extracted lessons. See rhiz-State §6.7 for the schema.

---

## Document Map

| File | Feature Area | Confirmed Failures | Hypothetical |
|------|-------------|-------------------|--------------|
| [build-system.md](failure-paths/build-system.md) | Vite config, es2022, two-config trap | 2 | 0 |
| [storage-and-theme.md](failure-paths/storage-and-theme.md) | OPFS design, localStorage migration, theme fallback | 2 | 1 |
| [tauri-ci-icons.md](failure-paths/tauri-ci-icons.md) | Icon pipeline: missing, not RGBA, MCP binary, size check, branch targeting | 4 | 1 |
| [tauri-scaffolding.md](failure-paths/tauri-scaffolding.md) | Rust scaffold, plugin_shell, contents:write, capabilities | 3 | 0 |
| [tauri-window-management.md](failure-paths/tauri-window-management.md) | PiP silent fail, satellite-hidden timing, window.close() frame, capabilities | 1 | 3 |
| [pwa-github-pages.md](failure-paths/pwa-github-pages.md) | CDN stale state, Jekyll conflicts | 2 | 0 |
| [process-lessons.md](failure-paths/process-lessons.md) | CI branch targeting, commit verification, Node deprecation | cross-cutting | — |

---

## Open Hypothetical Fixes — Pending Confirmation

| ID | Feature | Commit | What to verify |
|----|---------|--------|----------------|
| B | Linux .deb PNG signature check | `180d798` → `d0d2d33` | Trigger tauri-build.yml on main; Ubuntu build passes |
| C | Floating panel hidden on satellite open | `fceb246` → `d0d2d33` | Click ⧉ on floating panel in Windows Tauri; panel disappears from main window |
| D | Satellite return/close closes OS frame | `6b1b2f0` → `d0d2d33` | Click ↩ or ✕ in satellite; frame closes, not just blanks |
| E | PWA "extra dark" theme fallback | `790771e` → `d0d2d33` | Clear site data, reload PWA; dark theme applies correctly |

Update the relevant `failure-paths/` document when confirmation arrives.

---

## What Is Working Well (Evidence-Backed)

- **StorageEngine** — OPFS + localStorage fallback stable on all three targets
- **isTauri detection** — `!!window.__TAURI_INTERNALS__` reliable, no false positives
- **Engine detection order** — Chromium before WebKit in UA IIFE; correct on all targets
- **DockSystem** — dock/float/undock with single `dockPanel()` entry point; no regressions
- **BroadcastChannel satellite sync** — block state main→satellite, property changes satellite→main
- **Theme CSS injection** — `<style id="tvs-theme-style">` injection stable; light detection correct
