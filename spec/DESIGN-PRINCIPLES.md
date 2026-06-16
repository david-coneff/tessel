# Tessel Design Principles

These principles are binding on all implementations. Any decision that conflicts with them requires an explicit Architecture Decision record and an update to this file.

---

## 1. Self-contained artifacts

A compiled Tessel HTML file must work offline, from a local file, with no server, no CDN request, no external asset reference of any kind. All CSS, JavaScript, and fonts are inlined in the single `.html` file. This is non-negotiable.

*Corollary:* `tessel.js` and `md_to_html.py` may not reference CDN URLs, npm packages, or external resources in their output. Test compliance by opening the compiled HTML in a browser with network disabled.

---

## 2. Markdown is the canonical source

The `.md` source file is the canonical form of a document. It is:
- Human-writable in any text editor
- AI-readable and AI-generatable without tool support
- Diffable in any version control system
- Reviewable without rendering

The compiled `.html` is derived from the `.md`. The `.html` is never edited directly. Round-trip fidelity is required (see Principle 9).

---

## 3. Repository is durable memory

Following PAP's primary operating principle — assume every session begins with partial amnesia — the git repository is the persistence mechanism for sessions, notes, attachments, and state. Browser storage (localStorage, sessionStorage, IndexedDB) is a volatile working copy only. The authoritative record is the git-committed session package.

---

## 4. No secrets stored by the compiler or runtime

The compiler never sees or stores credential values. `@credential` and `@totp` fields are rendered as empty inputs. Their values exist only in `sessionStorage` and are cleared when the tab closes.

Export packages that contain credentials are AES-256-GCM encrypted before writing to disk. The user may override this and export unencrypted, but the default is encrypted. The compiler must never include credential values in the compiled HTML.

---

## 5. Human Form / Machine Form duality

Every Tessel document exists in two forms:
- **Human Form**: the `.md` source — writable by humans and AI, portable, version-controlled
- **Machine Form**: the compiled `.html` — interactive, executable, self-contained

The compiler transforms Human Form to Machine Form. No reverse transformation is required for normal operation (though round-trip embedding enables re-editing in Studio).

---

## 6. Python and JavaScript are equivalent paths

`tessel.js` and `md_to_html.py` are independent implementations of the same specification. Given the same Markdown input and compiler options, they must produce semantically identical HTML output. "Semantically identical" means:
- All field IDs, slugs, and data attributes are identical
- All CSS class names are identical
- Inline JavaScript behavior is identical
- Visual rendering is pixel-equivalent

The specification (TESSEL-SPEC.md) is the authority. Neither implementation is authoritative over the other. Divergence is a bug in one or both implementations.

---

## 7. Zero external dependencies

Neither `tessel.js` nor the compiled HTML artifact may depend on external packages at runtime. `tessel.js` must be usable via a plain `<script>` tag without a bundler. The compiled HTML must have no external references.

Build-time tooling (test runners, linters) may have dependencies. Compiler source code may use ES module syntax — but the distributed `tessel.js` must be a single, unbundled file usable directly.

---

## 8. Studio is a convenience layer

Tessel Studio is built on top of the compiler and runtime — it does not extend them. Any capability in Studio that affects the compiled document must be expressed as valid Tessel Markdown before compilation. Studio WYSIWYG mode generates Markdown; the Markdown is compiled; the compiled HTML is the artifact.

---

## 9. Round-trip source embedding

Every compiled HTML embeds its source `.md` in a `<script type="text/tessel-source">` tag (base64-encoded). This enables Studio to reopen a compiled `.html` and re-edit the source without requiring the `.md` file to be kept separately.

The embedded source must be identical to the original `.md` input. No normalization or transformation of the source occurs during embedding.

---

## 10. Directive syntax is stable

Once a directive is specified in TESSEL-SPEC.md and implemented, its syntax is frozen. New capabilities are added via new optional metadata keys or new directive types, not by changing existing syntax. Breaking changes require a major version increment and a migration path.

The broodforge compatibility set (all directives implemented in `md_to_html.py`) is the baseline. Tessel must compile all broodforge documents without modification.
