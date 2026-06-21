# Failure Paths: Tauri CI — Icon Pipeline

**Feature area**: `src-tauri/icons/`, `tauri::generate_context!()` macro validation,
`.deb` bundler, `.github/workflows/tauri-build.yml` icon generation step.  
**Related state doc**: [tauri-pwa-multiplatform-deployment.md](../tauri-pwa-multiplatform-deployment.md) §9 Failures 2–3, §10 Fix B  
**Index**: [lessons-learned-synthesis.md](../lessons-learned-synthesis.md)

---

## F-ICON-01 — Icons Directory Not Committed in Initial Scaffold

**Feature scope**: `src-tauri/icons/` — required by `tauri::generate_context!()` at
compile time. The macro panics if any icon listed in `bundle.icon` is missing.

**Root cause**: The initial Tauri scaffold commit did not include the `icons/`
directory. The CI build failed on all four platforms immediately:
```
error: proc macro panicked
  message: failed to open icon .../src-tauri/icons/32x32.png: No such file or directory
```

**Confirmation status**: **Confirmed**. Adding placeholder icons resolved the compile error.

**Extracted lesson**: `src-tauri/icons/` is not optional. It must be committed
alongside the initial Tauri scaffold. Placeholder icons are acceptable for CI.
Required files per `tauri.conf.json bundle.icon`:
- `icons/32x32.png` (32×32 RGBA PNG)
- `icons/128x128.png` (128×128 RGBA PNG)
- `icons/128x128@2x.png` (256×256 RGBA PNG)
- `icons/icon.icns` (macOS icon bundle)
- `icons/icon.ico` (Windows icon)

---

## F-ICON-02 — Placeholder PNGs Not RGBA (Color Type 2 Instead of 6)

**Feature scope**: Same icon pipeline. `tauri::generate_context!()` validates PNG color
type at compile time, requiring RGBA (color type 6).

**Root cause**: The first placeholder icons were generated as RGB (color type 2, no alpha
channel). The macro rejected them:
```
error: proc macro panicked
  message: icon .../src-tauri/icons/32x32.png is not RGBA
```

**Fix**: Regenerate all PNGs as RGBA using Python with the correct IHDR chunk:
```python
import struct, zlib

def make_rgba_png(w, h, r=0x1a, g=0x1b, b=0x1e, a=255):
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', c)
    raw = b''.join(b'\x00' + bytes([r,g,b,a]) * w for _ in range(h))
    png  = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    #                                                        ^ color type 6 = RGBA
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    return png
```

**Confirmation status**: **Confirmed**. RGBA icons compile without error on all platforms.

**Extracted lesson**: Tauri icon PNGs must be RGBA (color type 6). The IHDR chunk's
fifth byte is the color type: `2` = RGB, `6` = RGBA. Any PNG generation library or
script must explicitly specify RGBA, as RGB is often the default.

---

## F-ICON-03 — mcp__github__push_files Stores Binary as Literal Base64 Text

**Feature scope**: Committing binary PNG files via the MCP GitHub tool.

**Root cause**: `mcp__github__push_files` accepts file content as a string parameter.
When a base64-encoded binary is passed as the content string, the tool stores the
base64 string literally — it does not decode it. The resulting file on GitHub is ASCII
text, not binary PNG data. The committed "PNG" files had valid-looking sizes (140–1140
bytes) but failed the PNG magic signature check (`\x89PNG\r\n\x1a\n`).

Both `tauri-codegen` (at compile time) and the `.deb` bundler (at bundle time) read and
decode these files. The compile step may have been more lenient, but the `.deb` bundler
failed explicitly:
```
Failed to create icon files: Format error decoding Png: Invalid PNG signature.
```

**Fix**: Generate binary files on the CI runner using a workflow step, not via MCP commit:
```yaml
- name: Generate placeholder icons
  shell: python3 {0}
  run: |
    # Python generates valid RGBA PNGs directly to disk on the runner
    # (see make_rgba_png() above)
```

**Confirmation status**: **Confirmed** as the source of corrupt files. Binary generation
on the runner bypasses the MCP encoding limitation entirely.

**Extracted lesson**: Never use `mcp__github__push_files` to commit binary files
(PNGs, ICOs, ICNs, compiled artifacts, fonts, audio). The tool encodes content as
base64 for transport and GitHub stores it as binary — but only if the GitHub API
call sets the content type correctly. When content is passed as a plain string,
it is stored as-is. For binary files: generate them on CI, or commit locally via
`git` and push with `git push`.

---

## F-ICON-04 — File Size Check Missed Larger Corrupt PNG Files

**Feature scope**: Python icon generation step in `.github/workflows/tauri-build.yml`.

**Root cause**: The initial Python step used `os.path.getsize(p) < 200` to decide
whether to regenerate an icon. This failed because:

| File | Corrupt size | Valid size | Regenerated? |
|------|-------------|-----------|--------------|
| 32x32.png | 140 bytes (base64 text) | ~150 bytes (real PNG) | ✅ Yes (< 200) |
| 128x128.png | 480 bytes (base64 text) | ~500 bytes (real PNG) | ❌ No (> 200) |
| 128x128@2x.png | 1140 bytes (base64 text) | ~1200 bytes (real PNG) | ❌ No (> 200) |

The 128×128 and 128×128@2x icons remained corrupt. macOS and Windows builds passed
because they use `.icns` and `.ico` respectively (not the corrupt PNGs). The Linux
`.deb` bundler decodes all three PNG files and failed on the larger corrupt ones.

**Fix**: Check the actual PNG magic signature, not file size:
```python
PNG_SIG = b'\x89PNG\r\n\x1a\n'
def is_valid_png(path):
    try:
        with open(path, 'rb') as f:
            return f.read(8) == PNG_SIG
    except:
        return False

if not is_valid_png(p):
    # regenerate
```

**Confirmation status**: **Hypothetical** (Linux specifically). Fix committed `180d798`,
merged to main `d0d2d33`. macOS and Windows already passed; Linux Ubuntu build not yet
confirmed after this fix.

**Extracted lesson**: File size is not a proxy for file validity. A 1140-byte file can
be completely invalid. Always validate binary files by their format's magic signature.
For PNG: first 8 bytes must equal `b'\x89PNG\r\n\x1a\n'`. This is the only reliable
check that does not require fully decoding the file.

---

## F-ICON-05 — CI Workflow Fix Committed to Feature Branch, Not Main

**Feature scope**: `.github/workflows/tauri-build.yml` — triggered on `main`.

**Root cause**: The Python icon generation step (fixes for F-ICON-03 and F-ICON-04)
was committed to branch `claude/focused-johnson-qbhnmb`. The CI workflow's `on:` block
triggers on tag pushes and `workflow_dispatch` — both of which run against `main`, not
the feature branch. Multiple CI runs were triggered from main, none of which included
the fix, burning run credits and diagnostic time.

**Confirmation status**: **Confirmed** as a process failure. Merging the branch to main
is the resolution.

**Extracted lesson**: Before committing a CI workflow fix, read the `on:` section of the
workflow file to determine which branch the workflow runs on. For this repo:
```yaml
on:
  push:
    tags: ['v*']     # runs on whatever commit is tagged
  workflow_dispatch:  # runs on HEAD of selected branch (default: main)
```
CI workflow fixes must land on `main` before the next CI run. Either commit directly
to main, or merge the feature branch, before triggering a new run.
