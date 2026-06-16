# Tessel / Broodforge Compatibility Reference

This document maps every feature of the broodforge `md_to_html.py` reference implementation to its Tessel equivalent. Tessel must compile all broodforge documents without modification.

Reference implementation: `broodforge/proxmox-bootstrap/md_to_html.py`

---

## Directives

| Broodforge syntax | Tessel syntax | Notes |
|---|---|---|
| `{{VAR}}` | `{{VAR}}` | Identical |
| `{{VAR=default}}` | `{{VAR=default}}` | Identical |
| `@field[Label]` | `@field[Label]` | Identical |
| `@field[Label\|VAR=default]` | `@field[Label\|VAR=default]` | Identical; registers VAR as template parameter |
| `@field[Label\|VAR]` | `@field[Label\|VAR]` | Identical; VAR registered with empty default |
| `@area[Label]` | `@area[Label]` | Identical |
| `@credential[Label]` | `@credential[Label]` | Identical |
| `@credential[Label\|VAR]` | `@credential[Label\|VAR]` | Identical; VAR registered as credential parameter |
| `@totp[Label]` | `@totp[Label]` | Identical |
| `@radio[Label\|Opt1\|Opt2\|...]` | `@radio[Label\|Opt1\|Opt2\|...]` | Identical |
| `@check[Label\|Opt1\|Opt2\|...]` | `@check[Label\|Opt1\|Opt2\|...]` | Broodforge name preserved; `@checkbox` is a Tessel alias |
| `@select[Label\|Opt1\|Opt2\|...]` | `@select[Label\|Opt1\|Opt2\|...]` | Identical |
| `@table[Label\|Col1\|Col2\|...]` | `@table[Label\|Col1\|Col2\|...]` | Identical |
| `@table[Label\|Col1](Preset1,Preset2)` | `@table[Label\|Col1](Preset1,Preset2)` | Identical |
| `@parse[Label\|regex\|target]` | `@parse[Label\|regex\|target]` | Identical |
| `@filename[Label\|template]` | `@filename[Label\|template]` | Identical |
| `@dir[Label]` | `@dir[Label]` | Identical |
| `@dir[Label\|VAR=default]` | `@dir[Label\|VAR=default]` | Identical; VAR registered as template parameter |

**New in Tessel (no broodforge equivalent):**

| Tessel syntax | Description |
|---|---|
| `@date[Label]` | Date picker field |
| `@if(expr) ... @endif` | Conditional section |
| `{...}` metadata block after any `@directive` | Field metadata (id, required, visible_if, validate, etc.) |

---

## CLI flags and document options

| Broodforge CLI flag | Tessel equivalent | Notes |
|---|---|---|
| `--collapsible` | `collapsible: true` in document front-matter | Front-matter replaces CLI flags in Tessel |
| `--title "Title"` | `title: Title` in document front-matter | — |
| `--playbook` | `walkthrough: true` in front-matter | Forces walkthrough mode regardless of field presence |
| `--manifest path` | `nav_manifest: path` in front-matter | Nav docs panel |

**Document front-matter** is a YAML block delimited by `---` at the top of the Markdown file (CommonMark front-matter convention). When absent, all options default to false/empty. This is the Tessel-native way to configure compiler options without CLI flags. The Python compiler accepts both CLI flags (for backward compatibility) and front-matter.

Example front-matter:
```
---
title: My Document
collapsible: true
walkthrough: true
---
```

---

## Auto-detection behavior (preserved from broodforge)

A document is treated as a "walkthrough" (shows attach/export/import toolbar, session notes enabled) if any of the following is true:
- `walkthrough: true` in front-matter (or `--playbook` flag)
- The document contains template parameters (`{{VAR}}`)
- The document contains any field directive (`@field`, `@area`, `@credential`, `@totp`, `@radio`, `@check`, `@checkbox`, `@select`, `@table`, `@parse`, `@filename`, `@dir`, `@date`)

---

## Slug generation (normative)

The broodforge reference implementation generates field slugs as follows. This is normative — both compilers must produce identical slugs.

```
slug = label.lower()
slug = re.sub(r"[^a-z0-9]+", "-", slug)  # replace non-alnum runs with "-"
slug = slug.strip("-")                    # strip leading/trailing hyphens
slug = slug[:48]                          # truncate to 48 chars
slug = slug or "note"                     # fallback if empty
```

For credential fields, the slug is derived from `VAR` if provided, otherwise from the label:
```
cslug = re.sub(r"[^a-z0-9]+", "-", (var_name or label).lower()).strip("-")[:48] or slug
```

Option slugs (for radio/check) are truncated to 32 characters:
```
oslug = re.sub(r"[^a-z0-9]+", "-", opt.lower()).strip("-")[:32]
```

---

## localStorage persistence keys (normative)

The runtime uses a namespace prefix derived from the document slug (computed from the document title):
```
doc_slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "doc"
ns = "bf:" + doc_slug + ":"
```

Persistence keys:
```
ns + "param:" + VAR_NAME     — template parameter value
ns + "note:" + slug          — field value (text input, textarea, select)
"bf:theme"                   — dark/light theme (global, not per-document)
ns + "notes-width"           — notes pane width in pixels
ns + "notes-float-*"         — floating notes panel state
ns + "notes-opacity"         — notes panel opacity
ns + "notes-blur"            — notes panel blur
```

Credential values use sessionStorage (cleared on tab close):
```
"bf:cred:" + cslug           — credential value
"bf:totp:" + cslug + "-totp" — TOTP secret
```

---

## Export package format (normative)

The export ZIP package contains:
```
<TitleSlug>_<YYYY-MM-DD_HH-MM_SS_TZ>.zip
├── notes.md           — markdown export of all fields + session notes + notes tree
├── record.json        — structured JSON with all field values, parameters, attachments metadata
└── attachments/
    └── <filename>     — attached files (binary, preserved exactly)
```

`record.json` schema:
```json
{
  "title": "string",
  "exported_at": "ISO 8601 timestamp",
  "parameters": { "VAR_NAME": "value" },
  "notes": [
    {
      "label": "string",
      "value": "string | table_rows_array",
      "type": "field | area | credential | choice | table",
      "methods": ["password", "totp"],     // credential fields only
      "totp_secret": "string",             // credential+TOTP fields only
      "optionNotes": ["option: note"]      // choice fields only
    }
  ],
  "session_notes": "string",
  "attachments": [
    { "name": "filename", "size": 1234, "type": "mime/type" }
  ]
}
```

When credential fields are present, the export is AES-256-GCM encrypted:
```
<TitleSlug>_<timestamp>_encrypted.zip
├── payload.enc     — AES-256-GCM ciphertext of the inner ZIP
├── meta.json       — { v, alg, kdf, iter, salt, iv, inner_name }
├── decrypt.html    — standalone browser decryptor
├── decrypt.py      — Python 3 alternative (requires cryptography package)
└── README.txt      — instructions
```

`meta.json` schema:
```json
{
  "v": 1,
  "alg": "AES-256-GCM",
  "kdf": "PBKDF2-SHA256",
  "iter": 210000,
  "salt": "<base64 16 bytes>",
  "iv": "<base64 12 bytes>",
  "inner_name": "<original zip filename>"
}
```

`v: 2` will be used when Argon2id is the KDF (Phase 5).

---

## Title slug generation (normative)

Used for export filenames and the localStorage namespace:
```
slug = title.trim()
       .replace(/\.md\b/gi, "")
       .replace(/\s+/g, "-")
       .replace(/[^A-Za-z0-9_-]/g, "")
       .replace(/-+/g, "-")
       .replace(/^-|-$/g, "")
       || "Document"
```

---

## Copyable code block languages (normative)

Only these language tags trigger the Copy button on code blocks:
```
bash, sh, shell, console, cmd, powershell
```

All other language tags render a code block without a Copy button.

---

## Inline formatting (normative)

Supported:
- `**bold**` → `<strong>bold</strong>`
- `` `code` `` → `<code>code</code>`
- `[text](url)` → `<a href="url">text</a>`

Not supported (by design):
- `*italic*` / `_italic_` — intentionally disabled to avoid mangling identifiers like `__main__`, `network_topology.ssl_*`

---

## Validation auto-detection (existing broodforge behavior)

The broodforge compiler auto-detects `ip4` and `domain` validation types on `@field` and `@dir` directives by scanning the label and VAR name for keywords. This behavior is preserved in Tessel but superseded when explicit `validate=` metadata is provided.

Auto-detection rules:
- If label or VAR name contains any of: `lan ip`, `wan ip`, `ip address`, ` ip|`, `hatchery_ip`, `broodling_ip`, `_ip=` → apply `ip4` validation
- If label or VAR name contains `domain` → apply `domain` validation
