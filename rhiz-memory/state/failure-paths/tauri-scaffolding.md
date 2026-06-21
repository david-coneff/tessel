# Failure Paths: Tauri Rust Scaffolding

**Feature area**: `src-tauri/src/lib.rs`, `Cargo.toml`,
`src-tauri/capabilities/default.json`, GitHub Actions release permissions.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §4, §9 Failures 4–5  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-RUST-01 — tauri_plugin_shell Referenced in lib.rs Without Cargo.toml Entry

**Feature scope**: `src-tauri/src/lib.rs` — the Tauri builder setup. The initial
scaffold included boilerplate for the shell plugin.

**Root cause**: The generated scaffold included `.plugin(tauri_plugin_shell::init())`
in `lib.rs` but `tauri-plugin-shell` was not added to `Cargo.toml`. Rust cannot
resolve the crate at compile time:
```
error[E0433]: cannot find module or crate `tauri_plugin_shell` in this scope
  --> src/lib.rs:4:17
```

The app does not need shell access. Removing the line entirely is the correct fix.

**Fix** — minimal `lib.rs`:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Tessel VS");
}
```

**Confirmation status**: **Confirmed**. All four platforms compile after removal.

**Extracted lesson**: Do not copy scaffold boilerplate that includes plugin references
without verifying each plugin is declared in `Cargo.toml`. Every Tauri plugin used in
`lib.rs` needs a matching `[dependencies]` entry. If the app does not need a plugin,
remove it from `lib.rs` rather than adding the dependency.

---

## F-RUST-02 — GitHub Token Missing contents:write for Release Creation

**Feature scope**: `tauri-apps/tauri-action@v0` in `.github/workflows/tauri-build.yml`.
This action creates a GitHub Release and attaches installer artifacts.

**Root cause**: The workflow had no explicit `permissions` block. `GITHUB_TOKEN`'s
default permissions do not include `contents: write`. The action built all four
platform binaries successfully but failed at the release creation step:
```
##[error]Resource not accessible by integration
```
All compilation work was successful — only the release step failed.

**Fix**: Add at the top level of the workflow:
```yaml
permissions:
  contents: write
```

**Side note on workflow_dispatch testing**: When triggered manually (not via a `v*`
tag), `github.ref_name` resolves to `main`. The action creates a release tagged `main`.
This is not an error; it creates an oddly-named draft release that can be deleted.

**Confirmation status**: **Confirmed**. Release creation succeeds with the permission.

**Extracted lesson**: Add `permissions: contents: write` to any workflow that creates
GitHub Releases or writes to repository contents via the Actions token. Add it at
workflow creation time. The default token is read-only for `contents`, which is
correct security posture — the exception must be explicit.

---

## F-RUST-03 — Tauri 2.x Capabilities Not Created at Scaffold Time

**Feature scope**: `src-tauri/capabilities/default.json` — Tauri 2.x's permission
system governing which JS → Rust IPC operations are allowed.

**Root cause**: The initial scaffold did not include a `capabilities/` directory.
`new WebviewWindow(label, options)` called from JS requires
`core:webview:allow-create-webview-window`. Without the capabilities file, the IPC
call is silently rejected — no error in the JS console, no error in Tauri logs at
the default level. The pop-out button appeared to do nothing.

**Fix** — `src-tauri/capabilities/default.json`:
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for Tessel VS",
  "windows": ["main", "satellite-*"],
  "permissions": [
    "core:default",
    "core:webview:allow-create-webview-window",
    "core:window:allow-create",
    "core:window:allow-close",
    "core:window:allow-set-focus",
    "core:window:allow-set-title"
  ]
}
```

The `windows` array uses a glob pattern (`satellite-*`) to cover dynamically-labeled
satellite windows without enumerating them.

**Confirmation status**: **Confirmed** as necessary for WebviewWindow creation.
Satellite windows are created correctly with this file present.

**Extracted lesson**: In Tauri 2.x, every JS → IPC operation requires an explicit
capability grant. Silent rejection (no error, no log at default verbosity) is the
failure mode when a capability is absent. Create `capabilities/default.json` as part
of the initial scaffold — include at minimum `core:default` plus any window management
permissions the app needs. The `satellite-*` glob pattern avoids having to register
each dynamically-created window by label.
