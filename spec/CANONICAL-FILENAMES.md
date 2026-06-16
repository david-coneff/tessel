# Tessel — Canonical File Naming Specification

This document defines the Canonical File Convention (CFC) as applied
within the Tessel project. For the full specification including
rationale, UI requirements, and multi-language reference
implementations, see
[PAP-FileNaming](https://github.com/david-coneff/PAP/blob/main/pap/modules/PAP-FileNaming/PAP-FileNaming.md).

---

## 1. Convention

Auto-suggested filenames for Tessel-produced artifacts follow:

```
<title>_<YYYY-MM-DD_HH-MM>_<CID-SHORT>[.<ext>]
```

| Component | Description |
|-----------|-------------|
| `title` | Document slug (snake_case or kebab-case, lowercase, no spaces) |
| `YYYY-MM-DD_HH-MM` | UTC timestamp to the minute |
| `CID-SHORT` | First 8 lowercase hex characters of SHA-256(file bytes) |
| `ext` | File extension without leading dot (`zip`, `tessel`, `html`, `json`) |

**Examples:**

```
proxmox-bootstrap_2026-06-16_14-30_a3f89b21.zip
tessel-export_2026-06-16_09-00_c4d2e1f0.tessel
notes_2026-06-15_22-15_88f3c2a1.md
```

---

## 2. Hash Algorithm

```
CID    = SHA-256(canonical_bytes)
CID-SHORT = CID[0:8]  (first 8 lowercase hex chars)
```

**Canonical bytes by file type:**

| Type | Canonical bytes |
|------|-----------------|
| Plain text / Markdown | Raw UTF-8 with `\r\n` and `\r` normalized to `\n` |
| JSON | Raw UTF-8 as-stored (no re-serialization) |
| ZIP / archive | Raw bytes of the archive |
| HTML | Raw UTF-8 as-stored |
| Session folder | SHA-256 of `session.json` content (raw UTF-8, LF-normalized) |

---

## 3. Machine-Readable Schema

### 3.1 Filename validation (JSON Schema Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "tessel-canonical-filename",
  "title": "Tessel Canonical Filename",
  "description": "Validates a Tessel canonical filename: title_YYYY-MM-DD_HH-MM_cidshort[.ext]",
  "type": "string",
  "pattern": "^[a-z0-9][a-z0-9_-]*_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}_[0-9a-f]{8}(\\.[a-zA-Z0-9]+)?$",
  "examples": [
    "proxmox-bootstrap_2026-06-16_14-30_a3f89b21.zip",
    "tessel-export_2026-06-16_09-00_c4d2e1f0.tessel",
    "notes_2026-06-15_22-15_88f3c2a1.md"
  ]
}
```

### 3.2 Parsed component structure (JSON Schema Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "tessel-canonical-filename-parsed",
  "title": "Tessel Canonical Filename — Parsed Components",
  "type": "object",
  "required": ["title", "timestamp", "cid_short"],
  "additionalProperties": false,
  "properties": {
    "title": {
      "type": "string",
      "pattern": "^[a-z0-9][a-z0-9_-]*$",
      "description": "Document slug portion"
    },
    "timestamp": {
      "type": "string",
      "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}$",
      "description": "UTC timestamp, YYYY-MM-DD_HH-MM"
    },
    "cid_short": {
      "type": "string",
      "pattern": "^[0-9a-f]{8}$",
      "description": "First 8 hex chars of SHA-256(canonical_bytes)"
    },
    "extension": {
      "type": ["string", "null"],
      "pattern": "^[a-zA-Z0-9]+$",
      "description": "File extension without leading dot; null if absent"
    }
  }
}
```

---

## 3.5 Self-Reference Exclusion Rule

File content must not embed its own canonical filename or CID-SHORT. The
canonical filename is external metadata — identity assigned from outside,
not from within. When this rule is followed (the common case), no special
handling is needed.

**If a format genuinely needs a self-referential field** (e.g. a
`manifest.json` that records its own canonical path, or a `session.json`
with a `canonical_name` field):

1. Set the self-referential field(s) to the placeholder string:
   `__CID_PENDING__`
2. Compute the CID-SHORT of the content with the placeholder in place
   (per §2)
3. Replace `__CID_PENDING__` with the actual CID-SHORT
4. Write the file

**Verification** of self-referential files: re-substitute the placeholder
before re-hashing. The verifier must know which fields are self-referential;
conformant implementations document this.

**Placeholder string** (normative): `__CID_PENDING__`

Full rationale and reference implementations: PAP-FileNaming §2.4.

---

## 4. Reference Implementation (JavaScript — normative for Tessel)

```javascript
/**
 * Compute SHA-256 of file content and return the first 8 hex chars.
 *
 * @param {Uint8Array} bytes  — raw file bytes
 * @param {"text"|"binary"}  fileType — "text" normalizes LF; others hash raw
 * @returns {Promise<string>} 8-char lowercase hex CID-SHORT
 */
async function cidShort(bytes, fileType = "binary") {
  if (fileType === "text") {
    const s = new TextDecoder("utf-8").decode(bytes)
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    bytes = new TextEncoder().encode(s);
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

/**
 * Build a canonical filename.
 *
 * @param {string}  title     — document slug (will be lowercased + slug-cleaned)
 * @param {Uint8Array} bytes  — content to hash
 * @param {string}  ext       — extension without dot (e.g. "zip")
 * @param {"text"|"binary"} fileType
 * @param {Date}    [ts]      — defaults to now (UTC)
 * @returns {Promise<string>}
 */
async function canonicalFilename(title, bytes, ext, fileType = "binary", ts = new Date()) {
  const slug = title.replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").toLowerCase();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${ts.getUTCFullYear()}-${pad(ts.getUTCMonth()+1)}-${pad(ts.getUTCDate())}_${pad(ts.getUTCHours())}-${pad(ts.getUTCMinutes())}`;
  const cid = await cidShort(bytes, fileType);
  return `${slug}_${stamp}_${cid}.${ext}`;
}

/**
 * Parse a canonical filename into its components.
 * Returns null if the filename does not match the pattern.
 *
 * @param {string} filename
 * @returns {{ title: string, timestamp: string, cid_short: string, extension: string|null } | null}
 */
function parseCanonicalFilename(filename) {
  const pattern = /^([a-z0-9][a-z0-9_-]*)_([0-9]{4}-[0-9]{2}-[0-9]{2})_([0-9]{2}-[0-9]{2})_([0-9a-f]{8})(?:\.([a-zA-Z0-9]+))?$/;
  const m = filename.match(pattern);
  if (!m) return null;
  return {
    title: m[1],
    timestamp: `${m[2]}_${m[3]}`,
    cid_short: m[4],
    extension: m[5] ?? null,
  };
}

/**
 * Verify a canonical filename against file content.
 * Returns true if the embedded CID-SHORT matches the actual content hash.
 *
 * @param {string}     filename
 * @param {Uint8Array} bytes
 * @param {"text"|"binary"} fileType
 * @returns {Promise<boolean>}
 */
async function verifyCanonicalFilename(filename, bytes, fileType = "binary") {
  const parsed = parseCanonicalFilename(filename);
  if (!parsed) return false;
  const actual = await cidShort(bytes, fileType);
  return parsed.cid_short === actual;
}
```

---

## 5. Where the CFC Applies in Tessel

| Action | Applies CFC? | Notes |
|--------|-------------|-------|
| ZIP export (session package) | ✅ | `<doc-slug>_<ts>_<CID>.zip` |
| Encrypted export package | ✅ | Same, `.tessel` or `.enc.zip` |
| Local path session folder name | ✅ | `<ts>_<CID>/` (CID of session.json) |
| Git commit session path | ✅ | `sessions/<slug>/<ts>_<CID>/` |
| Compiled `.html` download | ✅ | `<slug>_<ts>_<CID>.html` |
| Source `.md` file (living doc) | ❌ | Stable human-readable name |
| Spec files (ROADMAP.md, etc.) | ❌ | Stable human-readable name |
| Temporary compiler output | ❌ | Overwritten; not a named artifact |

---

## 6. UX Requirements (summary)

1. **Auto-suggest on save.** Compute the hash from the content before writing, construct the filename, present it as the default save name.
2. **Update on content change.** If the user modifies content after the suggestion appears, recompute and update the suggestion before the save action completes.
3. **Verify on load.** When opening a file whose name matches the CFC pattern, recompute the hash and compare. Show a verification indicator (✓) on match or a warning on mismatch.
4. **Override allowed.** The user may rename freely. If the CID-SHORT component is absent on next open, show a one-line advisory.

---

*This specification is a Tessel-scoped application of PAP-FileNaming. For changes to the algorithm, schema, or rationale, propose changes upstream in PAP-FileNaming; update this file to reflect.*
