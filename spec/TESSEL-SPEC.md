# Tessel Markdown Specification

Version: 0.1 (pre-implementation draft)
Status: Authoritative for Phase 1 implementation

This document is the normative specification for the Tessel Markdown format and the Tessel compiler. Both `tessel.js` and `tessel.py` must independently conform to this spec. Where they diverge, this document is authoritative. Update this document before changing compiler behavior.

---

## 1. Document Structure

A Tessel document is a UTF-8 encoded plain-text file. It may optionally begin with a YAML front-matter block, followed by Markdown content with optional Tessel directives.

```
[front-matter block]
[markdown content with tessel directives]
```

### 1.1 Front-Matter

An optional YAML block delimited by `---` at the very start of the file (line 1). If present, the opening `---` must be on line 1 with no preceding content or whitespace.

```yaml
---
title: My Document
collapsible: true
walkthrough: true
---
```

Supported keys:

| Key | Type | Default | Description |
|---|---|---|---|
| `title` | string | filename without extension | Document title shown in `<title>` and toolbar |
| `collapsible` | boolean | false | Wraps `h2` sections in `<details>` with collapse/expand controls |
| `walkthrough` | boolean | auto-detected | Forces walkthrough mode (attach/export toolbar) regardless of field presence |
| `nav_manifest` | string | — | Path to a doc-manifest.json for the nav panel |
| `doc_id` | string | title-derived slug | Stable document identifier for session scoping. Set this explicitly to prevent session loss if the title changes. |

When front-matter is absent, the compiler falls back to CLI arguments (Python) or `TesselCompiler` constructor options (JavaScript).

---

## 2. Markdown Subset

### 2.1 Block Elements

The following CommonMark block elements are supported:

**ATX Headings:** `#` through `######` with a space after the `#` characters.
```
# h1
## h2
### h3
#### h4
##### h5
###### h6
```

**Fenced Code Blocks:** Triple backtick fences. The opening fence may specify a language tag.
```
```bash
echo "hello"
```
```

**Tables:** GitHub Flavored Markdown pipe tables. Header row, separator row (`:---:` alignment markers ignored), body rows. Cell content supports inline formatting.
```
| Column A | Column B |
|---|---|
| cell | cell |
```

**Unordered Lists:** Lines beginning with `- `, `* `, or `+ `. One level of nesting supported (indented `  - ` items rendered as a nested `<ul>`).

**Ordered Lists:** Lines beginning with `N. ` or `N) ` where N is any digit sequence.

**Blockquotes:** Lines beginning with `> `.

**Horizontal Rules:** Lines containing only 3 or more `-`, `*`, or `_` characters.

**Paragraphs:** Any line not matching another block element. Consecutive paragraph lines are joined with a space.

### 2.2 Inline Elements

**Bold:** `**text**` → `<strong>text</strong>`

**Inline Code:** `` `code` `` → `<code>code</code>`

**Links:** `[text](url)` → `<a href="url">text</a>`

**Italic is not supported.** Single `*` and `_` are passed through literally. This is by design: they appear frequently in identifiers (`__main__`, `network_topology.ssl_*`) and would corrupt them.

### 2.3 HTML Escaping

All text content is HTML-escaped before output. Tessel directives are the only mechanism for including interactive elements.

---

## 3. Template Parameters

Template parameters are `{{VAR}}` placeholders inside code blocks. At runtime, each placeholder is replaced with the current value of the named variable.

### 3.1 Syntax

```
{{VAR}}              — reference to variable VAR
{{VAR=default}}      — reference with default value "default"
```

Rules:
- `VAR` must match `[A-Z][A-Z0-9_]*` (uppercase letters, digits, underscore; must start with a letter)
- `default` may be any string not containing `}}`
- Template parameters are only expanded inside fenced code blocks. They render as literal text in other contexts.
- A `{{VAR=default}}` occurrence registers VAR with the given default. The first occurrence wins if VAR appears multiple times with different defaults.
- A `{{VAR}}` occurrence without a default registers VAR with an empty string default.

### 3.2 Parameters Panel

When any template parameters are present, a Parameters panel is rendered above the document body. It contains one labeled text input per unique variable. Editing a value updates every code block containing that variable live (no page reload). The Copy button on code blocks resolves the current value before copying.

### 3.3 Parameter Registration from Field Directives

`@field[Label|VAR=default]` and `@dir[Label|VAR=default]` register VAR as a template parameter (see §4.2). `@credential[Label|VAR]` registers VAR as a credential parameter (separate namespace, see §4.6).

---

## 4. Field Directives

Field directives are lines that begin with `@` and render interactive form elements. They must occupy their own line (no other content on the same line). Trailing whitespace is ignored.

All field directives may be followed by an optional metadata block (see §5).

### 4.1 Slug Generation

Every field has a **slug** derived from its label. The slug is used as the localStorage persistence key, the HTML `data-note` attribute, and for cross-field references.

Normative slug generation algorithm:
```
slug = label.toLowerCase()
slug = slug.replace(/[^a-z0-9]+/g, "-")   // non-alnum runs → hyphen
slug = slug.replace(/^-+|-+$/g, "")        // strip leading/trailing hyphens
slug = slug.slice(0, 48)                    // truncate to 48 chars
slug = slug || "note"                       // fallback
```

Option slugs (for radio/check options): same algorithm, truncated to 32 characters.

When an explicit `id=` metadata key is provided, it overrides the label-derived slug for cross-field references but does not affect the persistence key (which continues to use the label slug for backward compatibility with existing sessions).

### 4.2 @field — Single-Line Text Input

```
@field[Label]
@field[Label|VAR=default]
@field[Label|VAR]
```

Renders a single-line text input. When `|VAR` is provided, the field also acts as a template parameter input — editing it updates all `{{VAR}}` placeholders in code blocks. The field appears in the Parameters panel as well as inline.

Auto-validation: if the label or VAR name contains IP-address or domain keywords (see COMPATIBILITY.md §Validation auto-detection), the runtime applies the corresponding format validator.

### 4.3 @area — Multi-Line Text Input

```
@area[Label]
```

Renders a multi-line textarea. No VAR binding (use `@field` for that).

### 4.4 @date — Date Picker

```
@date[Label]
```

Renders an `<input type="date">`. Value is stored as `YYYY-MM-DD`. The metadata key `default=today` resolves to the current date at runtime.

### 4.5 @radio — Radio Button Group

```
@radio[Label|Option1|Option2|Option3|...]
```

Renders a radio button group. At least one option is required. Each option also has an associated free-text note field (`placeholder="note…"`). The selected option value and per-option notes are persisted.

### 4.6 @check / @checkbox — Checkbox Group

```
@check[Label|Option1|Option2|Option3|...]
@checkbox[Label|Option1|Option2|...]
```

`@check` and `@checkbox` are aliases. Renders a group of checkboxes. Multiple options may be selected simultaneously. Each option has an associated free-text note field. The set of selected values and per-option notes are persisted as a JSON array.

### 4.7 @select — Dropdown

```
@select[Label|Option1|Option2|Option3|...]
```

Renders a `<select>` dropdown. A blank "— select —" option is prepended. The selected value is persisted.

### 4.8 @credential — Password Field with TOTP

```
@credential[Label]
@credential[Label|VAR]
```

Renders a credential entry widget. Features:
- Password input (masked by default, toggle reveal)
- Confirmation input with real-time match indicator
- TOTP section (toggle; BASE32 secret input)
- Passphrase suggestion (4-word EFF diceware, 3-word+number, random string)
- TOTP secret generation (160-bit or 256-bit)
- Values stored in `sessionStorage` only (cleared on tab close, never in localStorage)
- Badge: "🔑 session-only — exported in encrypted package"
- When `|VAR` is provided, the credential value is also injected into `{{VAR}}` placeholders in code blocks (shown as `••••••` in the code block, actual value resolved at copy time)

### 4.9 @totp — Standalone TOTP Secret Field

```
@totp[Label]
```

A simplified version of `@credential` showing only the TOTP secret section. Used when a separate TOTP secret (not tied to a password) is needed.

### 4.10 @table — Tabular Input

```
@table[Label|Column1|Column2|Column3|...]
@table[Label|Column1|Column2](PresetRow1,PresetRow2,...)
```

Renders an editable table with add/delete row controls. Column headers are provided in the directive. Optional preset row labels pre-populate the first column of initial rows.

Each row value is a JSON object keyed by column name. The entire table is persisted as a JSON array in a single localStorage entry.

### 4.11 @parse — Terminal Output Parser

```
@parse[Label|regex|target-field-slug]
```

Renders a textarea for pasting terminal output, a button to apply the regex, and a result display. When a match is found, it shows the captured value with an "Apply ↓" button that writes the value to the target field (identified by its slug).

- `regex`: a JavaScript-compatible regular expression string; the first capture group is used
- `target-field-slug`: the slug of the field to populate (label-derived, see §4.1)

### 4.12 @filename — Filename Suggester

```
@filename[Label|template]
```

Renders a text input with a "↺ Suggest" button. The template may contain `{{VAR}}` references. When clicked, the button fills the input with the resolved template. If referenced variables are not yet filled, a warning is shown with a "Highlight missing" button.

### 4.13 @dir — Directory Path Field

```
@dir[Label]
@dir[Label|VAR=default]
```

Renders a text input for a filesystem path. Input is expected to end with `/`. When `|VAR` is provided, the field syncs bidirectionally with the template parameter of the same name (editing either updates the other).

A hint is shown below: `Use cd {{this_path}} before running commands in this section.` — this hint uses the current value of the VAR for the code `{{VAR}}` reference.

---

## 5. Field Metadata

Any field directive may be followed by a metadata block on the next non-blank line, delimited by `{` and `}`:

```
@date[End Date]{
    id=end_date
    required_if=start_date
    validate=end_date >= start_date
    visible_if=change_type=="scheduled"
    warning_message=End date must be after start date
    help_text=The date the change window closes
    placeholder=YYYY-MM-DD
    save_to_session=true
    default=today
}
```

The `{` must appear on the line immediately following the directive. Keys and values are separated by `=`. Values extend to the end of the line (no quoting needed). Blank lines and `}` close the block.

### 5.1 Metadata Keys

| Key | Type | Description |
|---|---|---|
| `id` | identifier | Stable ID for use in `visible_if`, `required_if`, and `validate` expressions. Must match `[a-z][a-z0-9_]*`. If absent, the label-derived slug is used as the runtime ID. |
| `default` | string | Default value. `today` resolves to the current date (ISO 8601) for `@date` fields. |
| `required` | `true`/`false` | Field must be non-empty before export is allowed. |
| `required_if` | expression | Field is required when the expression evaluates truthy. |
| `visible_if` | expression | Field (and its label) is hidden when the expression evaluates falsy. |
| `validate` | expression | Validation expression; must be truthy for the field to be valid. |
| `warning_message` | string | Displayed below the field when `validate` evaluates falsy. |
| `help_text` | string | Hint text always shown below the field. |
| `placeholder` | string | Input placeholder text. Overrides the default `"record here…"` placeholder. |
| `save_to_session` | `true`/`false` | When true, the field value triggers an auto-save to the configured git session on change (Phase 4). Default: false. |

---

## 6. Conditional Sections

```
@if(expression)

[Markdown content and/or field directives]

@endif
```

A conditional block that is shown or hidden at runtime based on the expression. The block may contain any Markdown or Tessel directives, including nested `@if/@endif` blocks.

Rules:
- `@if(...)` must be on its own line, with no other content
- `@endif` must be on its own line
- `@if` and `@endif` may be nested arbitrarily
- The content of a conditional block is always compiled into the HTML (no dead code elimination)
- The visibility is controlled at runtime by the expression engine
- Expression evaluation occurs whenever any field referenced in the expression changes value
- Fields inside a hidden block continue to exist in the DOM and persist their values; they are excluded from validation while hidden

### 6.1 Expression Language

Expressions reference field IDs (the `id=` metadata value, or the label-derived slug). The expression language is a minimal evaluator.

**Tokens:**
- Field reference: `[a-z][a-z0-9_]*` — the current string value of the named field
- String literal: `"..."` or `'...'` — literal string
- Numeric literal: `[0-9]+(\.[0-9]+)?` — numeric value (used for comparison)
- Boolean literal: `true`, `false`
- `null`, `""` — empty/absent value

**Operators (in precedence order, lowest first):**

| Operator | Description |
|---|---|
| `or` | Logical OR (short-circuit) |
| `and` | Logical AND (short-circuit) |
| `not` | Logical NOT (unary prefix) |
| `==` | Equality (string comparison) |
| `!=` | Inequality |
| `<`, `<=`, `>`, `>=` | Numeric comparison (coerce to number) |
| `contains` | String contains substring: `field contains "value"` |
| `(...)` | Grouping |

**Truthiness rules:**
- Empty string `""` → false
- `"0"` → false  
- `"false"` → false
- Any other non-empty string → true
- Numeric 0 → false
- Any other number → true

**Examples:**
```
database=="PostgreSQL"
packages contains "Traefik"
change_type!="emergency"
end_date >= start_date
(env=="prod" or env=="staging") and approved=="true"
not dry_run
```

---

## 7. Table of Contents

A TOC is automatically generated when:
- The document has `collapsible: true`
- AND the document contains 3 or more `h2` headings

The TOC is a collapsible `<details>` element placed above the document body. It lists h2, h3, and h4 headings hierarchically with sequential numbering (`1`, `1.1`, `1.1.1`). Active section is highlighted as the user scrolls (IntersectionObserver).

Sections with 3 or more h3 children are collapsible within the TOC panel.

---

## 8. Collapsible Sections

When `collapsible: true`, every `h2` heading becomes a `<details class="section">` element, open by default. Subheadings (`h3`, `h4`) become `<details class="subsection">` within their parent section, also open by default.

The toolbar gains:
- Section open/closed counter (`N / M open`)
- "Collapse All" button
- "Expand All" button
- Each section header has child +/- buttons to expand/collapse its direct subsections

Section open/closed state is not persisted (resets to all-open on page load).

---

## 9. Session Notes Pane

Every compiled Tessel document has a session notes pane on the right side, separated from the document by a draggable divider. The pane width persists in localStorage. The pane may be collapsed to a vertical strip or popped out as a floating window.

### 9.1 Notes Pane Contents

- **Quick note** textarea at the top (plain freeform text, persisted)
- **Notes tree**: recursive collapsible sections
  - Each section has an editable title and a textarea
  - "Add section" at root level; "Add subsection" within any section
  - Delete button on each section
  - Collapse/expand individual sections
  - Tree structure and all text values persisted in localStorage
- **Export buttons**: "↓ MD" (Markdown export), "↓ HTML" (HTML export)
  - Downloads `<docname>_notes_YYYY-MM-DD_HH_MM_SS.{md,html}`
  - Notes export is separate from the full Export Package

### 9.2 Floating Mode

The notes pane may be detached as a floating, resizable, draggable window. Float state, position, size, opacity, and blur persist in localStorage.

---

## 10. Toolbar

The toolbar is `position: sticky; top: 0` inside the document pane, always visible regardless of scroll.

**Standard toolbar elements (always present):**
- ☰ Docs (if nav_manifest provided)
- ≡ Contents (if TOC present)
- ⓘ About (links to ABOUT-DOCS.html; opens in new tab)
- ☀ Light / ☾ Dark — theme toggle (persists globally as `bf:theme`)
- ↓ Download with Edits — downloads the compiled HTML with any inline edits baked in

**Walkthrough-only toolbar elements:**
- ⊘ Clear Fields — clears all field values (with confirmation)
- Section counter + Collapse All + Expand All (if `collapsible: true`)
- 📎 Attach <count> — toggle attachment panel
- ↑ Import Session — restore from a previously exported package
- ↓ Export [Title] Package — export current session as ZIP

---

## 11. Export and Import

See COMPATIBILITY.md §Export package format for the normative package format.

**Export flow:**
1. User clicks "Export [Title] Package"
2. Compiler collects: all parameter values, all field values, session notes tree, quick note
3. Checks whether any credential fields were filled this session (sessionStorage)
4. If credentials present: show encryption modal with generated passphrase
   - User may proceed with encryption (default) or override to unencrypted
5. Builds ZIP, triggers download

**Encryption modal:**
- Displays a generated passphrase in format `adj.noun.adj.noun.NN`
- "↺ New" button regenerates the passphrase
- User must copy passphrase before clicking "🔒 Encrypt & Export"
- "⚠ Export unencrypted" bypass button (not the default)
- "Cancel" button

**Import flow:**
1. User clicks "↑ Import Session"
2. File picker opens (accepts `.zip`)
3. ZIP is parsed in browser (no server)
4. `record.json` is extracted and applied:
   - Parameters matched by name
   - Fields matched by label text
   - Session notes text applied to quick-note textarea
   - Credential values applied to their fields (sessionStorage)
5. Attachments from the ZIP are added to the attachment list
6. Confirmation message displayed

---

## 12. Attachment Management

The attachment panel is accessible via the 📎 Attach toolbar button. Drag-and-drop anywhere on the page auto-opens the panel and adds the dropped files.

Files are held in memory (JS `Uint8Array`). They are not persisted to localStorage. They are bundled into the export ZIP as `attachments/<filename>`.

---

## 13. Inline Block Editing

Prose paragraphs and headings have a hover-triggered "edit" button. Clicking it replaces the rendered HTML with a textarea pre-filled with the Markdown source. "Save" re-renders the block; "Cancel" reverts. Edits are stored in localStorage under the document namespace and applied on next load.

The embedded source `.md` (see §14) is not updated by inline edits. Inline edits are a runtime overlay, not a source modification.

---

## 14. Round-Trip Source Embedding

Every compiled HTML includes the source Markdown as:
```html
<script type="text/tessel-source" data-encoding="base64">
BASE64_ENCODED_MARKDOWN_SOURCE
</script>
```

The compiler must embed the exact source bytes (after front-matter extraction; front-matter is included). The browser ignores this script tag during rendering. Tessel Studio reads it to enable re-editing.

---

## 15. Document Metadata Tags

Every compiled HTML includes:
```html
<meta name="tessel-compiler" content="tessel.js 0.1">
<meta name="tessel-doc-id" content="<doc_id>">
<meta name="tessel-doc-title" content="<title>">
```

The `tessel-doc-id` is used by the Repository Manager (Phase 4) to scope session operations to the correct document.

---

## 16. Color and Theme System

All colors are CSS custom properties. The compiler inlines a single `<style>` block with the full CSS. No external stylesheet is referenced.

Dark theme is the default. Light theme is toggled via the toolbar and persisted globally (`localStorage["bf:theme"]`).

See COMPATIBILITY.md and DESIGN-PRINCIPLES.md for the full color table. The color values from the broodforge reference implementation are canonical.

---

## Appendix A: Full Directive Grammar (EBNF)

```ebnf
document        ::= [front-matter] block*
front-matter    ::= "---\n" yaml-content "---\n"
block           ::= blank-line | heading | code-fence | table-md | blockquote
                  | unordered-list | ordered-list | horizontal-rule
                  | template-parameter | field-directive | conditional-block
                  | paragraph

heading         ::= ("#"{1,6}) " " inline-content "\n"
code-fence      ::= "```" language? "\n" code-content "```" "\n"
table-md        ::= table-row "\n" table-sep "\n" table-row* "\n"
blockquote      ::= ("> " inline-content "\n")+
unordered-list  ::= (("- "|"* "|"+ ") inline-content "\n")+
ordered-list    ::= (digit+ ("." | ")") " " inline-content "\n")+
horizontal-rule ::= ("---"|"***"|"___") "\n"
paragraph       ::= inline-content "\n" (inline-content "\n")*

template-parameter ::= "{{" VAR-NAME ("=" [^}]*)? "}}"

field-directive ::= "@" field-type "[" field-args "]" [preset-rows] "\n" [metadata-block]
field-type      ::= "field" | "area" | "date" | "credential" | "totp"
                  | "radio" | "check" | "checkbox" | "select"
                  | "table" | "parse" | "filename" | "dir"
field-args      ::= label ("|" arg)*
label           ::= [^|\]]+
arg             ::= [^|\]]+
preset-rows     ::= "(" [^)]* ")"
metadata-block  ::= "{\n" (meta-key "=" meta-value "\n")* "}\n"
meta-key        ::= "id" | "default" | "required" | "required_if" | "visible_if"
                  | "validate" | "warning_message" | "help_text" | "placeholder"
                  | "save_to_session"
meta-value      ::= [^\n]+

conditional-block ::= "@if(" expression ")\n" block* "@endif\n"

expression      ::= or-expr
or-expr         ::= and-expr ("or" and-expr)*
and-expr        ::= not-expr ("and" not-expr)*
not-expr        ::= "not" not-expr | cmp-expr
cmp-expr        ::= atom (cmp-op atom)?
cmp-op          ::= "==" | "!=" | "<" | "<=" | ">" | ">=" | "contains"
atom            ::= field-ref | string-literal | number-literal | bool-literal | "(" expression ")"
field-ref       ::= [a-z][a-z0-9_]*
string-literal  ::= '"' [^"]* '"' | "'" [^']* "'"
number-literal  ::= digit+ ("." digit+)?
bool-literal    ::= "true" | "false"

VAR-NAME        ::= [A-Z][A-Z0-9_]*
```

---

## Appendix B: Persistence Namespace

All per-document localStorage keys use the namespace:
```
ns = "bf:" + doc_id + ":"
```

Where `doc_id` is:
1. The value of `doc_id:` front-matter key, if present
2. Otherwise, the title-derived slug (lowercase, non-alnum → hyphen, strip edges, truncate 48)

The global `bf:theme` key does not use a namespace.
