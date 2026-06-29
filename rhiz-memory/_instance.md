# rhiz-memory — Tessel Instance

**Protocol**: david-coneff/rhizome  
**Instance type**: Child repository  
**Project**: Tessel — language, compiler, and WYSIWYG studio

---

## Session startup

When starting a session on tessel under the Rhizome methodology:

1. `david-coneff/rhizome` — `protocol/core/rhiz-core.md` (always loaded)
2. `david-coneff/rhizome` — `protocol/core/rhiz-core.manifest.yaml` (select modules for task)
3. `rhiz-memory/_instance.md` (this file — project identity + startup)
4. `rhiz-memory/state/SESSION_HANDOFF.md` (current work context and next action)

The Rhizome protocol specs and tooling live in `david-coneff/rhizome`. This
repository contains only project work and its own instance state under
`rhiz-memory/`.

---

## Project identity

Tessel is a programming language, compiler, and authoring environment.
The repository contains:

| Area | Directories | Description |
|------|-------------|-------------|
| Language spec | `spec/` | Formal language specification |
| Compiler | `compiler/` | Language compiler implementation |
| Studio | `studio/` | Block-based WYSIWYG authoring environment |
| Tools | `tools/` | Development and build tooling |
| Examples | `examples/` | Example programs and documents |
| Tests | `tests/` | Compiler and runtime tests |

---

## Memory structure

| Category | Location |
|---|---|
| Governance | `rhiz-memory/_instance.md` (this file) |
| Decisions | `rhiz-memory/state/decisions.md` (create when needed) |
| Evidence | Cited inline in audit records and session handoffs |
| Planning | `rhiz-memory/state/SESSION_HANDOFF.md`, `ROADMAP.md`, [`rhiz-memory/roadmap/index.md`](roadmap/index.md) |
| State | `rhiz-memory/state/SESSION_HANDOFF.md` |
| Risk | `rhiz-memory/audits/` |
| Debt | Named inline in audit findings |
| Research | `rhiz-memory/audits/` |
| Assumptions | Named inline where made |
| Contracts | Language spec (`spec/`) |
| Testing | `tests/` |
| Dependencies | `tools/` |
| Documentation | `README.md`, `ROADMAP.md` |
| Oversight | `rhiz-memory/audits/` |
| Tooling | rhiz tooling (rhiz-lint, rhiz-search, doc-graph) run via `tools/rhiz` against the rhizome `tools-stable` channel — the tools live in rhizome, not copied here |

---

## Knowledge map

The knowledge articles maintained under `rhiz-memory/` for this instance:

- [rhizome-kb-storage-approaches.md](rhizome-kb-storage-approaches.md) — KB storage approach comparison
- [tessel-vs-ux-patterns.md](tessel-vs-ux-patterns.md) — Tessel language/UX pattern study

### State

- [lessons-learned-synthesis.md](state/lessons-learned-synthesis.md) — synthesis index over the failure-path records
- [cross-project-design-principles.md](state/cross-project-design-principles.md) — design principles carried across projects
- [github-pages-deployment.md](state/github-pages-deployment.md) — GitHub Pages deployment state
- [studio-ui-design.md](state/studio-ui-design.md) — studio UI design notes
- [tauri-pwa-multiplatform-deployment.md](state/tauri-pwa-multiplatform-deployment.md) — Tauri/PWA multiplatform deployment
- [ui-preferences.md](state/ui-preferences.md) — UI preferences
