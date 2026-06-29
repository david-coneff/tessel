# rhiz-memory — Roadmap notes (Tessel)

Forward-looking work notes for tessel. Add a row when you add a note so it stays
discoverable from the instance entry point ([`../_instance.md`](../_instance.md)).

| Topic | Note |
|-------|------|
| Tessel ↔ Rhizome partition/roll-up integration | 📌 **Pinned, not started.** Make rhizome's partition/roll-up a compatible input to tessel's compose + md→html pipeline: roll partitioned docs up into a composite monolith, then transpile to interactive HTML (and design the round-trip back to sections). Cross-project effort with rhizome + broodforge. Canonical record: `david-coneff/rhizome` → `rhiz-memory/roadmap/tessel-rhizome-partition-rollup-integration.md`. Plan-first — do not touch tessel's render/build pipeline until the interop contract is scoped and signed off. |
| Metadata-aware authoring tool (possible tessel home) | 📌 Design brief — a form-driven editor for rhizome-governed markdown+frontmatter+Merkle docs (tool owns hashes/timestamps/manifest; human owns content). Leaning toward tessel's studio as its home (reuse the WYSIWYG machinery), though it authors a different artifact than Tessel-language docs — confirm before committing. Canonical record: `david-coneff/rhizome` → `rhiz-memory/roadmap/metadata-aware-authoring-tool.md`. |
