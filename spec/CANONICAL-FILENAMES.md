# Tessel — Canonical File Naming Specification

This document defines the Canonical File Convention (CFC) as applied
within the Tessel project. For the full specification including
rationale, UI requirements, and multi-language reference
implementations, see
[PAP-FileNaming](https://github.com/david-coneff/PAP/blob/main/pap/modules/PAP-FileNaming/PAP-FileNaming.md).

**CFC Version ID:** Each CFC algorithm version is identified by a
content-addressed ID of the form `cfc-v_<YYYY-MM-DD_HH-MM_SS>_<CID-SHORT>`,
derived by applying the version's own algorithm to its normative spec blob.
The current version is `cfc-v_2026-06-16_20-02_00_49b99195`. See §7 for
the versioning scheme and how the version ID is embedded in artifacts.

---

## 1. Convention

Auto-suggested filenames for Tessel-produced artifacts follow:

```
<title>_<YYYY-MM-DD_HH-MM_SS>_<CID-SHORT>[.<ext>]
```

| Component | Description |
|-----------|-------------|
| `title` | Document slug (snake_case or kebab-case, lowercase, no spaces) |
| `YYYY-MM-DD_HH-MM_SS` | UTC timestamp to the second |
| `CID-SHORT` | First 8 lowercase hex characters of SHA-256(file bytes) |
| `ext` | File extension without leading dot (`zip`, `tessel`, `html`, `json`) |

**Examples:**

```
proxmox-bootstrap_2026-06-16_14-30_00_a3f89b21.zip
tessel-export_2026-06-16_09-00_15_c4d2e1f0.tessel
notes_2026-06-15_22-15_42_88f3c2a1.md
```

---

## 2. Hash Algorithm

```
CID    = SHA-256(canonical_bytes)
CID-SHORT = CID[0:8]  (first 8 lowercase hex chars)
```

**Canonical bytes by file type:**

| Type | Canonical bytes |
|------|------------------|
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
  "description": "Validates a Tessel canonical filename: title_YYYY-MM-DD_HH-MM_SS_cidshort[.ext]",
  "type": "string",
  "pattern": "^[a-z0-9][a-z0-9_-]*_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}_[0-9]{2}_[0-9a-f]{8}(\\\\.[a-zA-Z0-9]+)?$",
  "examples": [
    "proxmox-bootstrap_2026-06-16_14-30_00_a3f89b21.zip",
    "tessel-export_2026-06-16_09-00_15_c4d2e1f0.tessel",
    "notes_2026-06-15_22-15_42_88f3c2a1.md"
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
      "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}_[0-9]{2}$",
      "description": "UTC timestamp, YYYY-MM-DD_HH-MM_SS"
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
  const stamp = `${ts.getUTCFullYear()}-${pad(ts.getUTCMonth()+1)}-${pad(ts.getUTCDate())}_${pad(ts.getUTCHours())}-${pad(ts.getUTCMinutes())}_${pad(ts.getUTCSeconds())}`;
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
  const pattern = /^([a-z0-9][a-z0-9_-]*)_([0-9]{4}-[0-9]{2}-[0-9]{2})_([0-9]{2}-[0-9]{2})_([0-9]{2})_([0-9a-f]{8})(?:\.([a-zA-Z0-9]+))?$/;
  const m = filename.match(pattern);
  if (!m) return null;
  return {
    title: m[1],
    timestamp: `${m[2]}_${m[3]}_${m[4]}`,
    cid_short: m[5],
    extension: m[6] ?? null,
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

/**
 * IntegrityEngine — badge state computation for the document viewer and Studio.
 *
 * @param {string}     filename        — filename of the artifact
 * @param {Uint8Array} bytes           — raw bytes of the artifact as loaded
 * @param {string}     cfcVersionId    — version ID read from tessel-cfc-version meta tag
 * @param {"text"|"binary"} fileType
 * @returns {Promise<{state: "verified"|"mismatch"|"not-canonical"|"unknown-version",
 *                    parsed_cid: string|null,
 *                    recomputed_cid: string|null,
 *                    cfc_version_id: string}>}
 */
async function computeBadgeState(filename, bytes, cfcVersionId, fileType = "binary") {
  const parsed = parseCanonicalFilename(filename);
  if (!parsed) {
    return { state: "not-canonical", parsed_cid: null, recomputed_cid: null, cfc_version_id: cfcVersionId };
  }

  // Known CFC version IDs — extend this set when new versions are defined (§7.4)
  const KNOWN_CFC_VERSIONS = new Set([
    "cfc-v_2026-06-16_20-02_00_49b99195",
    // append future version IDs here
  ]);

  if (!KNOWN_CFC_VERSIONS.has(cfcVersionId)) {
    return { state: "unknown-version", parsed_cid: parsed.cid_short, recomputed_cid: null, cfc_version_id: cfcVersionId };
  }

  // v1 algorithm: SHA-256, LF-normalize text
  const recomputed = await cidShort(bytes, fileType);
  return {
    state: recomputed === parsed.cid_short ? "verified" : "mismatch",
    parsed_cid: parsed.cid_short,
    recomputed_cid: recomputed,
    cfc_version_id: cfcVersionId,
  };
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

## 6. UX Requirements

1. **Auto-suggest on save.** Compute the hash from the content before writing, construct the filename, present it as the default save name.
2. **Update on content change.** If the user modifies content after the suggestion appears, recompute and update the suggestion before the save action completes.
3. **Verify on load.** When opening a file whose name matches the CFC pattern, recompute the hash and compare. Show a verification indicator (✓) on match or a warning on mismatch.
4. **Override allowed.** The user may rename freely. If the CID-SHORT component is absent on next open, show a one-line advisory.
5. **Integrity badge — always visible.** The document viewer (compiled HTML toolbar) and Tessel Studio both display a persistent integrity badge. Badge states:

   | State | Indicator | Meaning |
   |-------|-----------|--------|
   | Verified | ✓ green | Hash matches CID-SHORT in filename |
   | Mismatch | ⚠ amber | Hash does not match — content may have changed after naming |
   | Not canonical | — grey | Filename has no CID-SHORT (not a CFC filename) |
   | Pending | ⏳ | Verification in progress |
   | Unknown version | ? amber | `tessel-cfc-version` in metadata is not recognized |

6. **Badge detail panel (on click).** Clicking the badge opens a popover showing: full filename, parsed CID-SHORT, recomputed CID-SHORT, match status, CFC version ID used. Includes a "Suggest canonical filename" action for mismatch or non-canonical files.
7. **Versioned verification.** The badge reads `tessel-cfc-version` from the file's metadata and selects the correct algorithm (see §7). Files with unknown version IDs display the "unknown version" state rather than a false pass or false fail.
8. **File system access for compiled HTML.** When loaded from `file://` (local disk without a server), the runtime offers a "Verify this file" button that uses `showOpenFilePicker()`. When loaded over HTTP(S), `fetch(location.href)` is used automatically. When neither is available, the badge shows "—" with a tooltip explaining why.

---

## 7. CFC Schema Versioning

### 7.1 Version identification (content-addressed)

CFC algorithm versions are identified by a **content-addressed version ID**:

```
cfc-v_<YYYY-MM-DD_HH-MM_SS>_<CID-SHORT>
```

where:
- `YYYY-MM-DD_HH-MM_SS` — UTC timestamp (to the second) when the version was formally defined
- `CID-SHORT` — first 8 lowercase hex characters of SHA-256(spec blob), computed using **the version's own algorithm**, with the spec blob treated as a text file (LF-normalized UTF-8)

**The spec blob does not embed its own version ID.** This avoids the circular dependency described in §3.5. The version ID is derived from the spec blob's content, not embedded in it.

**Schema folder layout:** Each CFC version lives in its own self-contained folder:

```
spec/schemas/cfc/<version-id>/
├── spec-blob.txt      — normative algorithm description (what is hashed; no version ID embedded)
├── implementation.js  — normative JS implementation (same as §4 of this document)
├── implementation.py  — Python reference implementation
└── manifest.json      — {"schema_id": "<version-id>", "defined": "<ISO-8601>",
                          "cfc_version": "<version-id>"}
                          (for CFC: cfc_version == schema_id — it is self-hashing)
```

This folder is sufficient for any verifier to reproduce the algorithm exactly, without reference to the current version of this document. Non-CFC schemas that use CFC for their version ID computation reference the specific CFC version in their own `manifest.json`.

**Self-hashing for v1:** Because v1 is the first CFC version, there is no predecessor algorithm. v1's spec blob is hashed using v1's own algorithm (SHA-256, LF-normalize text). This is not circular — the version ID is not embedded in the blob. For CFC, `manifest.json` sets `cfc_version` to the schema's own ID to indicate self-hashing.

**Current version:** `cfc-v_2026-06-16_20-02_00_49b99195`

- Hash function: SHA-256
- CID-SHORT length: 8 lowercase hex characters (first 8 of 64)
- Text normalization: LF normalization for `.md`, `.txt`, `.csv`; raw bytes for all other types
- Filename pattern: `<title>_<YYYY-MM-DD_HH-MM_SS>_<CID-SHORT>[.<ext>]`
- Spec blob: `spec/schemas/cfc/cfc-v_2026-06-16_20-02_00_49b99195/spec-blob.txt`
- Spec blob CID-SHORT: `49b99195` (verifiable: SHA-256(LF-normalize(spec-blob.txt)))
- Defined: 2026-06-16 20:02:00 UTC

### 7.2 How the version is embedded in Tessel artifacts

Each artifact type records the CFC version ID at creation time:

| Artifact | Version field |
|----------|---------------|
| Compiled `.html` | `<meta name="tessel-cfc-version" content="cfc-v_2026-06-16_20-02_00_49b99195">` in `<head>` |
| Session `manifest.json` | `"cfc_version": "cfc-v_2026-06-16_20-02_00_49b99195"` top-level field |
| Encrypted package `meta.json` | `"cfc_version": "cfc-v_2026-06-16_20-02_00_49b99195"` top-level field |
| ZIP export | `manifest.json` inside the ZIP, `"cfc_version": "cfc-v_2026-06-16_20-02_00_49b99195"` |

The version field is part of the artifact content and is **included in the CID-SHORT computation** — it is not excluded from hashing.

### 7.3 Verifier behavior

When the integrity badge verifies a file:

1. Parse the CID-SHORT from the filename (per §3.1).
2. Read `tessel-cfc-version` from the artifact's metadata.
3. Look up the algorithm for that version ID in the registry (§7.4).
4. **Known version:** recompute using that version's algorithm; compare to parsed CID-SHORT.
5. **Unknown version:** display the "unknown version" badge state. Do not display a false pass or false fail.
6. **Version field absent:** default to `cfc-v_2026-06-16_20-02_00_49b99195` (v1).

### 7.4 Algorithm registry

| Version ID | Hash function | CID-SHORT length | Text normalization | Spec blob | Defined |
|------------|--------------|-----------------|-------------------|-----------|--------|
| `cfc-v_2026-06-16_20-02_00_49b99195` | SHA-256 | 8 hex chars | LF-normalize `.md` `.txt` `.csv`; raw bytes for all other types | `spec/schemas/cfc/cfc-v_2026-06-16_20-02_00_49b99195/spec-blob.txt` | 2026-06-16 |

### 7.5 Version Library Maintenance Obligation

When a new CFC algorithm version is defined, **all five locations must be updated simultaneously** in a single commit:

1. `spec/CANONICAL-FILENAMES.md §7.4` — add a row to the algorithm registry
2. `spec/schemas/cfc/<new-version-id>/` — create the schema version folder containing:
   - `spec-blob.txt` — normative algorithm description (no version ID embedded)
   - `implementation.js` — normative JS implementation
   - `implementation.py` — Python reference implementation
   - `manifest.json` — `{"schema_id": "<id>", "defined": "<ISO-8601>", "cfc_version": "<id>"}`
3. `tools/tessel-integrity-checker.html` — add an entry to `CFC_ALGORITHM_LIBRARY`
4. `tessel.js` `IntegrityEngine.CFC_ALGORITHM_LIBRARY` — add the same entry
5. Update any documents that embed the current CFC version ID if they should adopt the new version

**Permanence (normative):** Version entries are never removed or modified after the version has been used to produce artifacts. A version entry may be annotated with a deprecation notice, but the `compute()` function must remain present and correct. Any file produced by any version of Tessel must be verifiable by any future version of the integrity checker or `IntegrityEngine`.

**Spec blob integrity.** Each spec blob is independently verifiable: hash `spec/schemas/cfc/<version-id>/spec-blob.txt` using that version's own algorithm (LF-normalized as a `.txt` file), take the first 8 hex chars, and confirm they match the CID-SHORT in the version ID. This is the algorithm proving it can integrity-check its own definition.

---

*This specification is a Tessel-scoped application of PAP-FileNaming. For changes to the algorithm, schema, or rationale, propose changes upstream in PAP-FileNaming; update this file to reflect.*
