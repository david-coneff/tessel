#!/usr/bin/env python3
"""
tessel-package.py — Schema and executable package versioning tooling.

This script is infrastructure and is EXCLUDED from the dependency graph it manages.
It is not versioned as a schema or package; it lives at a stable path in the repo.
The only time it needs updating is if the manifest schema itself changes — at that
point it is a manual update, not a cascade trigger.

Commands:
  package <draft-dir> <name>            Hash all files, compute aggregate CID-SHORT,
                                         create versioned folder under executables/<name>/,
                                         write package-manifest.json, update current.txt.

  schema-package <draft-dir> <name>     Package a schema folder (must contain spec-blob.txt
                                         plus implementations). Version ID is derived from
                                         spec-blob.txt CID-SHORT. Writes to spec/schemas/<name>/,
                                         updates current.txt.

  verify <versioned-dir>                 Verify all file hashes against the manifest.
                                         Hard-fails on any mismatch.

  deps <version-id>                      Show all files that reference a version ID.

  cascade <old-id> <new-id>             Advisory: show what would need updating if old-id
                                         is superseded by new-id. Makes no changes.

  prune [--keep N] [--dry-run]          Repo-wide cleanup. Must be invoked explicitly by the
                                         operator — never runs automatically. Scans all versioned
                                         folders in spec/schemas/ and executables/, sorts versions
                                         within each name by defined timestamp, retains last N
                                         (default 5, min 1). Skips any version still in a
                                         dependency chain. --dry-run shows what would be
                                         removed without removing it.

Usage:
  python tools/tessel-package.py package drafts/broodforge broodforge
  python tools/tessel-package.py schema-package drafts/my-schema my-schema
  python tools/tessel-package.py verify executables/broodforge/broodforge-v_2026-06-16_14-30_00_f3a9b2c1
  python tools/tessel-package.py deps cfc-v_2026-06-16_20-02_00_49b99195
  python tools/tessel-package.py cascade cfc-v_2026-06-16_20-02_00_49b99195 cfc-v_NEW
  python tools/tessel-package.py prune              # keep last 5 versions per name
  python tools/tessel-package.py prune --keep 1    # keep only the latest
  python tools/tessel-package.py prune --dry-run   # preview without removing
"""

import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────────────────────────

CFC_VERSION      = "cfc-v_2026-06-16_20-02_00_49b99195"
PACKAGE_MANIFEST = "package-manifest.json"
SCHEMA_MANIFEST  = "manifest.json"
CURRENT_FILE     = "current.txt"
DEFAULT_KEEP     = 5  # operator-configurable; never changed automatically

# Extensions treated as text (LF-normalize before hashing, per CFC v1)
TEXT_EXTENSIONS = {".md", ".txt", ".csv", ".py", ".js", ".json", ".html", ".sh"}

# Repo subtrees scanned for dependency references
DEP_SCAN_PATHS = ["spec", "executables", "tools", "compiler", "studio"]

# Versioned subtree roots: (path relative to repo root, manifest filename)
VERSIONED_ROOTS = [
    ("spec/schemas", SCHEMA_MANIFEST),
    ("executables",  PACKAGE_MANIFEST),
]


# ── CFC hashing ────────────────────────────────────────────────────────────────────

def file_type_for(path: Path) -> str:
    return "text" if path.suffix.lower() in TEXT_EXTENSIONS else "binary"


def sha256_file(path: Path, file_type: str) -> str:
    data = path.read_bytes()
    if file_type == "text":
        text = data.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")
        data = text.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def cid_short(digest: str) -> str:
    return digest[:8]


# ── Aggregate hash ────────────────────────────────────────────────────────────────

def compute_aggregate(raw_hashes: dict) -> str:
    """
    Aggregate CID-SHORT = sha256 of canonical JSON:
      sorted array of {"file": filename, "sha256": hexdigest}
      for all non-manifest files, serialized with no extra whitespace.
    The canonical JSON is ASCII; no CRLF normalization needed.
    """
    entries   = [{"file": f, "sha256": h} for f, h in sorted(raw_hashes.items())]
    canonical = json.dumps(entries, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


# ── Timestamp helpers ─────────────────────────────────────────────────────────────

def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M_%S")

def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── current.txt management ──────────────────────────────────────────────────────────

def write_current(parent_dir: Path, version_id: str) -> None:
    """Write or update current.txt in parent_dir to point to version_id."""
    current_path = parent_dir / CURRENT_FILE
    current_path.write_text(version_id + "\n", encoding="utf-8")
    print(f"  current.txt → {version_id}")


# ── Dependency chain resolution ──────────────────────────────────────────────────────

def find_manifest(version_id: str, repo_root: Path) -> "Path | None":
    """Locate the manifest file for a given version ID by searching versioned roots."""
    for subtree, manifest_name in VERSIONED_ROOTS:
        base = repo_root / subtree
        if not base.exists():
            continue
        for d in base.rglob(version_id):
            if d.is_dir():
                m = d / manifest_name
                if m.exists():
                    return m
    return None


def collect_protected_versions(repo_root: Path) -> set:
    """
    Build the set of version IDs that must not be pruned: all version IDs
    transitively referenced by the current version of any schema or package.
    """
    protected: set = set()
    current_txts = []
    for subtree, _ in VERSIONED_ROOTS:
        base = repo_root / subtree
        if base.exists():
            current_txts.extend(base.rglob(CURRENT_FILE))

    visited: set = set()

    def resolve(version_id: str) -> None:
        if version_id in visited:
            return
        visited.add(version_id)
        protected.add(version_id)
        manifest_path = find_manifest(version_id, repo_root)
        if manifest_path is None:
            return
        try:
            m = json.loads(manifest_path.read_text("utf-8"))
        except Exception:
            return
        deps = m.get("dependencies", {})
        for dep_id in deps.get("schemas", []) + deps.get("packages", []):
            resolve(dep_id)

    for ct in current_txts:
        vid = ct.read_text("utf-8").strip()
        if vid:
            resolve(vid)

    return protected


# ── package ────────────────────────────────────────────────────────────────────────

def cmd_package(draft_dir: str, name: str, repo_root: Path) -> None:
    draft = Path(draft_dir)
    if not draft.is_dir():
        die(f"Draft directory not found: {draft}")

    exclude = {PACKAGE_MANIFEST, SCHEMA_MANIFEST, "dependencies.json", CURRENT_FILE}
    files   = sorted(p for p in draft.iterdir() if p.is_file() and p.name not in exclude)
    if not files:
        die("No files to package in draft directory.")

    file_hashes: dict = {}
    raw_hashes:  dict = {}
    for f in files:
        ft     = file_type_for(f)
        digest = sha256_file(f, ft)
        file_hashes[f.name] = {"sha256": digest, "cid_short": cid_short(digest), "file_type": ft}
        raw_hashes[f.name]  = digest

    agg_digest = compute_aggregate(raw_hashes)
    agg_cid    = cid_short(agg_digest)
    version_id = f"{name}-v_{utc_stamp()}_{agg_cid}"

    out_dir = repo_root / "executables" / name / version_id
    if out_dir.exists():
        die(f"Version folder already exists: {out_dir}")
    out_dir.mkdir(parents=True)

    for f in files:
        shutil.copy2(f, out_dir / f.name)

    deps_file    = draft / "dependencies.json"
    dependencies = json.loads(deps_file.read_text("utf-8")) if deps_file.exists() else {
        "schemas": [], "packages": []
    }

    manifest = {
        "package_id":          version_id,
        "cfc_version":         CFC_VERSION,
        "defined":             utc_iso(),
        "aggregate_method":    (
            'sha256(canonical JSON: sorted [{"file": f, "sha256": h}] '
            "for all non-manifest files) — excludes package-manifest.json"
        ),
        "aggregate_cid_short": agg_cid,
        "file_hashes":         file_hashes,
        "dependencies":        dependencies,
    }
    (out_dir / PACKAGE_MANIFEST).write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    write_current(repo_root / "executables" / name, version_id)
    print(f"Packaged: {version_id}")
    print(f"  → {out_dir}")
    print(f"  aggregate sha256: {agg_digest}  cid_short: {agg_cid}")
    for fname, info in file_hashes.items():
        print(f"  {fname}: {info['cid_short']}  ({info['file_type']})")


# ── schema-package ────────────────────────────────────────────────────────────────

def cmd_schema_package(draft_dir: str, name: str, repo_root: Path) -> None:
    draft     = Path(draft_dir)
    spec_blob = draft / "spec-blob.txt"
    if not spec_blob.exists():
        die("spec-blob.txt not found in draft directory.")

    spec_digest = sha256_file(spec_blob, "text")
    spec_cid    = cid_short(spec_digest)
    version_id  = f"{name}-v_{utc_stamp()}_{spec_cid}"

    out_dir = repo_root / "spec" / "schemas" / name / version_id
    if out_dir.exists():
        die(f"Schema version folder already exists: {out_dir}")
    out_dir.mkdir(parents=True)

    exclude     = {SCHEMA_MANIFEST, PACKAGE_MANIFEST, CURRENT_FILE}
    files       = sorted(p for p in draft.iterdir() if p.is_file() and p.name not in exclude)
    file_hashes: dict = {}
    for f in files:
        ft     = file_type_for(f)
        digest = sha256_file(f, ft)
        file_hashes[f.name] = {"sha256": digest, "cid_short": cid_short(digest), "file_type": ft}
        shutil.copy2(f, out_dir / f.name)

    manifest = {
        "schema_id":           version_id,
        "cfc_version":         CFC_VERSION,
        "defined":             utc_iso(),
        "spec_blob_sha256":    spec_digest,
        "spec_blob_cid_short": spec_cid,
        "file_hashes":         file_hashes,
    }
    (out_dir / SCHEMA_MANIFEST).write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    write_current(repo_root / "spec" / "schemas" / name, version_id)
    print(f"Schema packaged: {version_id}")
    print(f"  → {out_dir}")
    print(f"  spec-blob sha256: {spec_digest}  cid_short: {spec_cid}")
    for fname, info in file_hashes.items():
        print(f"  {fname}: {info['cid_short']}  ({info['file_type']})")


# ── verify ──────────────────────────────────────────────────────────────────────────

def cmd_verify(versioned_dir: str) -> None:
    d = Path(versioned_dir)

    if   (d / PACKAGE_MANIFEST).exists():
        manifest = json.loads((d / PACKAGE_MANIFEST).read_text("utf-8"))
        id_field = "package_id"
    elif (d / SCHEMA_MANIFEST).exists():
        manifest = json.loads((d / SCHEMA_MANIFEST).read_text("utf-8"))
        id_field = "schema_id"
    else:
        die(f"No manifest found in: {d}")

    version_id  = manifest.get(id_field, "<unknown>")
    file_hashes = manifest.get("file_hashes", {})
    print(f"Verifying: {version_id}")

    errors = []
    for fname, info in file_hashes.items():
        fpath = d / fname
        if not fpath.exists():
            errors.append(f"  MISSING  {fname}")
            continue
        actual   = sha256_file(fpath, info.get("file_type", "binary"))
        expected = info["sha256"]
        if actual != expected:
            errors.append(
                f"  MISMATCH {fname}\n"
                f"           expected: {expected}\n"
                f"           actual:   {actual}"
            )
        else:
            print(f"  OK  {fname}  ({info.get('cid_short', actual[:8])})")

    if id_field == "package_id" and "aggregate_cid_short" in manifest:
        raw = {f: i["sha256"] for f, i in file_hashes.items()}
        agg = compute_aggregate(raw)
        exp = manifest["aggregate_cid_short"]
        if agg[:8] != exp:
            errors.append(
                f"  AGGREGATE MISMATCH\n"
                f"    expected cid_short: {exp}\n"
                f"    actual   cid_short: {agg[:8]}"
            )
        else:
            print(f"  OK  aggregate  ({exp})")

    if errors:
        print("\nVERIFICATION FAILED:")
        for e in errors:
            print(e)
        sys.exit(1)
    else:
        print("\nAll checks passed. Package is intact.")


# ── prune ──────────────────────────────────────────────────────────────────────────

def read_defined(manifest_path: Path) -> str:
    """Return the 'defined' ISO-8601 string from a manifest for sort ordering."""
    try:
        return json.loads(manifest_path.read_text("utf-8")).get("defined", "")
    except Exception:
        return ""


def cmd_prune(keep: int, dry_run: bool, repo_root: Path) -> None:
    """
    Operator-invoked repo-wide cleanup. Never runs automatically.
    Scans spec/schemas/ and executables/, retains the `keep` most recent
    versions per name (by defined timestamp), removes the rest.
    Versions still in any active dependency chain are skipped with a warning.
    """
    if keep < 1:
        die("--keep must be at least 1.")

    label = "DRY RUN — " if dry_run else ""
    print(f"{label}Pruning versioned folders  (keep={keep})\n")

    protected = collect_protected_versions(repo_root)
    if protected:
        print(f"Protected by dependency chain ({len(protected)}):")
        for vid in sorted(protected):
            print(f"  {vid}")
        print()

    total_removed = total_skipped = total_kept = 0

    for subtree, manifest_name in VERSIONED_ROOTS:
        base = repo_root / subtree
        if not base.exists():
            continue

        names: dict = {}
        for child in sorted(base.iterdir()):
            if not child.is_dir():
                continue
            versions = [
                d for d in child.iterdir()
                if d.is_dir() and (d / manifest_name).exists()
            ]
            if versions:
                names[child.name] = versions

        for name, version_dirs in sorted(names.items()):
            version_dirs.sort(key=lambda d: read_defined(d / manifest_name))

            to_keep   = version_dirs[-keep:]
            to_remove = version_dirs[:-keep] if len(version_dirs) > keep else []

            print(f"{subtree}/{name}:  {len(version_dirs)} version(s)  →  keep {len(to_keep)}, remove {len(to_remove)}")

            for d in to_keep:
                print(f"  KEEP    {d.name}")
                total_kept += 1

            for d in to_remove:
                vid = d.name
                if vid in protected:
                    print(f"  SKIP    {vid}  (protected — still in a dependency chain)")
                    total_skipped += 1
                    continue
                print(f"  REMOVE  {vid}")
                if not dry_run:
                    shutil.rmtree(d)
                total_removed += 1

    action = "Would remove" if dry_run else "Removed"
    print(f"\n{action}: {total_removed}  |  Skipped (protected): {total_skipped}  |  Kept: {total_kept}")
    if dry_run and total_removed > 0:
        print("Re-run without --dry-run to apply.")


# ── cascade (advisory) ──────────────────────────────────────────────────────────

def cmd_cascade(old_id: str, new_id: str, repo_root: Path) -> None:
    print(f"Advisory cascade scan")
    print(f"  old: {old_id}")
    print(f"  new: {new_id}")
    print(f"  (no changes will be made)\n")

    affected = []
    for subtree in DEP_SCAN_PATHS:
        base = repo_root / subtree
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            count = text.count(old_id)
            if count:
                affected.append((path.relative_to(repo_root), count))

    if not affected:
        print(f"No files reference {old_id}. Nothing to cascade.")
        return

    print(f"Files referencing {old_id}:\n")
    for rel, count in affected:
        print(f"  {rel}  ({count} occurrence{'s' if count != 1 else ''})")
    print(f"\n{len(affected)} file(s) would need review/update.")
    print("Inspect each file above, update references, then re-run 'package' or")
    print("'schema-package' for each affected schema or executable package.")


# ── deps ───────────────────────────────────────────────────────────────────────────

def cmd_deps(version_id: str, repo_root: Path) -> None:
    print(f"Reverse dependency lookup: {version_id}\n")
    cmd_cascade(version_id, "(new version)", repo_root)


# ── helpers ─────────────────────────────────────────────────────────────────────

def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def find_repo_root() -> Path:
    p = Path(__file__).resolve().parent
    while p != p.parent:
        if (p / "ROADMAP.md").exists():
            return p
        p = p.parent
    die("Could not find repo root (no ROADMAP.md in any parent directory).")


# ── entry point ──────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    repo_root = find_repo_root()
    cmd       = sys.argv[1]

    if cmd == "package":
        if len(sys.argv) < 4:
            die("Usage: tessel-package.py package <draft-dir> <name>")
        cmd_package(sys.argv[2], sys.argv[3], repo_root)

    elif cmd == "schema-package":
        if len(sys.argv) < 4:
            die("Usage: tessel-package.py schema-package <draft-dir> <name>")
        cmd_schema_package(sys.argv[2], sys.argv[3], repo_root)

    elif cmd == "verify":
        if len(sys.argv) < 3:
            die("Usage: tessel-package.py verify <versioned-dir>")
        cmd_verify(sys.argv[2])

    elif cmd == "cascade":
        if len(sys.argv) < 4:
            die("Usage: tessel-package.py cascade <old-version-id> <new-version-id>")
        cmd_cascade(sys.argv[2], sys.argv[3], repo_root)

    elif cmd == "deps":
        if len(sys.argv) < 3:
            die("Usage: tessel-package.py deps <version-id>")
        cmd_deps(sys.argv[2], repo_root)

    elif cmd == "prune":
        keep    = DEFAULT_KEEP  # 5
        dry_run = False
        args    = sys.argv[2:]
        i = 0
        while i < len(args):
            if args[i] == "--keep" and i + 1 < len(args):
                try:
                    keep = int(args[i + 1])
                except ValueError:
                    die("--keep requires an integer argument.")
                i += 2
            elif args[i] == "--dry-run":
                dry_run = True
                i += 1
            else:
                die(f"Unknown prune option: {args[i]}")
        cmd_prune(keep, dry_run, repo_root)

    else:
        die(f"Unknown command: {cmd}\nAvailable: package, schema-package, verify, cascade, deps, prune")


if __name__ == "__main__":
    main()
