#!/usr/bin/env python3
"""
doc-graph.py — Rhizome DocGraph protocol tooling.

Implements Merkle-tree document decomposition for large artifacts.
See rhizome/modules/rhiz-docgraph/rhiz-docgraph.md for the full specification.

Usage:
  python doc-graph.py split  <file> [--threshold-lines N] [--threshold-bytes N]
                             [--split-on N] [--out-dir DIR]
  python doc-graph.py update <path>
  python doc-graph.py verify <index-file>
  python doc-graph.py merge  <index-file> [--out FILE]
  python doc-graph.py status <index-file>
  python doc-graph.py init   <file> [split options]
"""

import sys
import os
import re
import json
import hashlib
import argparse
import textwrap
from pathlib import Path
from datetime import datetime, timezone

__version__ = "1.0.0"
DOCGRAPH_VERSION = 1

# ---------------------------------------------------------------------------
# Frontmatter helpers
# ---------------------------------------------------------------------------

FRONTMATTER_KEY_ORDER = [
    "docgraph-version",
    "docgraph-type",
    "section-id",
    "section-order",
    "parent-index",
    "content-hash",
]


def parse_frontmatter(content: str):
    """Return (header_dict, body_str).

    If content does not start with '---\\n', returns ({}, content).
    Parses simple 'key: value' pairs (no YAML library, no nesting).
    The body is everything after the closing '---\\n' line.
    """
    if not content.startswith("---\n"):
        return {}, content

    lines = content.split("\n")
    # lines[0] is '---'; find closing '---' starting from line 1
    close_idx = None
    for i in range(1, len(lines)):
        if lines[i] == "---":
            close_idx = i
            break

    if close_idx is None:
        # No closing delimiter — treat as no frontmatter
        return {}, content

    header_lines = lines[1:close_idx]
    header = {}
    for line in header_lines:
        if ":" in line:
            key, _, val = line.partition(":")
            header[key.strip()] = val.strip()

    # Body is everything after the closing '---'
    body = "\n".join(lines[close_idx + 1 :])
    return header, body


def compose_frontmatter(header: dict, body: str) -> str:
    """Compose a section file from header dict and body string.

    Key order is stable per FRONTMATTER_KEY_ORDER; extra keys appended.
    """
    ordered_keys = FRONTMATTER_KEY_ORDER + [
        k for k in header if k not in FRONTMATTER_KEY_ORDER
    ]
    lines = ["---"]
    for k in ordered_keys:
        if k in header:
            lines.append(f"{k}: {header[k]}")
    lines.append("---")
    return "\n".join(lines) + "\n" + body


# ---------------------------------------------------------------------------
# Hashing helpers
# ---------------------------------------------------------------------------


def sha256_str(data: str) -> str:
    """Return 'sha256:<hex>' of the UTF-8 encoding of data."""
    return "sha256:" + hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_content_hash(section_file: Path) -> str:
    """Read section file, strip frontmatter, hash the body."""
    content = section_file.read_text(encoding="utf-8")
    _, body = parse_frontmatter(content)
    return sha256_str(body)


def compute_index_hash(sections: list) -> str:
    """Hash = SHA-256(concat of content-hash strings sorted by section-order)."""
    sorted_sections = sorted(sections, key=lambda s: s["section-order"])
    concatenated = "".join(s["content-hash"] for s in sorted_sections)
    return sha256_str(concatenated)


def compute_meta_index_hash(indexes: list) -> str:
    """Hash = SHA-256(concat of index-hash strings sorted by index-order)."""
    sorted_indexes = sorted(indexes, key=lambda i: i["index-order"])
    concatenated = "".join(i["index-hash"] for i in sorted_indexes)
    return sha256_str(concatenated)


# ---------------------------------------------------------------------------
# Slug helper
# ---------------------------------------------------------------------------


def slug(text: str, maxlen: int = 40) -> str:
    """Lowercase, spaces to hyphens, strip non-alnum/hyphen, truncate."""
    text = text.lower().strip()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"[^a-z0-9-]", "", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:maxlen]


# ---------------------------------------------------------------------------
# Heading splitter
# ---------------------------------------------------------------------------


def split_at_heading(content: str, level: int):
    """Split content on lines matching exactly 'level' hashes then a space.

    Returns list of (heading_text, full_section_content) tuples.
    Preamble (content before first heading) uses heading_text '_preamble'.
    """
    pattern = re.compile(r"^" + "#" * level + r" (.+)$")
    lines = content.split("\n")

    sections = []
    current_heading = "_preamble"
    current_lines = []

    for line in lines:
        m = pattern.match(line)
        if m:
            # Save previous section
            sections.append((current_heading, "\n".join(current_lines)))
            current_heading = m.group(1)
            current_lines = [line]
        else:
            current_lines.append(line)

    # Save last section
    sections.append((current_heading, "\n".join(current_lines)))

    # Filter out empty preambles
    result = []
    for heading_text, sec_content in sections:
        if heading_text == "_preamble" and not sec_content.strip():
            continue
        result.append((heading_text, sec_content))

    return result


# ---------------------------------------------------------------------------
# Datetime helper
# ---------------------------------------------------------------------------


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Index JSON/MD writers
# ---------------------------------------------------------------------------


def write_index_files(index_path: Path, index_data: dict):
    """Write index JSON and regenerate the companion Markdown."""
    index_path.write_text(json.dumps(index_data, indent=2) + "\n", encoding="utf-8")
    _write_index_md(index_path, index_data)


def _write_index_md(index_path: Path, index_data: dict):
    """Write human-readable companion Markdown for an index."""
    md_path = index_path.with_suffix(".md")
    basename = index_data.get("source-file", index_path.stem)
    # Strip _index suffix for display
    display_name = re.sub(r"_index$", "", Path(basename).stem) if basename else index_path.stem

    rows = []
    for s in sorted(index_data["sections"], key=lambda x: x["section-order"]):
        ch = s["content-hash"]
        short_hash = ch[:14]  # 'sha256:' + 7 chars
        rows.append(
            f"| {s['section-order']} "
            f"| {s['filename']} "
            f"| {s['line-count']} "
            f"| {s['byte-count']} "
            f"| {short_hash} "
            f"| {s.get('description', '')} |"
        )

    table = "\n".join(rows)
    index_hash = index_data.get("index-hash", "")
    updated = index_data.get("updated", utcnow_iso())

    md_content = textwrap.dedent(f"""\
        # {display_name} — Document Index

        > Generated by doc-graph.py. Edit descriptions here; hashes are managed by tooling.

        | Order | File | Lines | Bytes | Hash (8 chars) | Description |
        |-------|------|-------|-------|----------------|-------------|
        {table}

        **Index Hash:** {index_hash}
        **Updated:** {updated}
    """)
    md_path.write_text(md_content, encoding="utf-8")


def write_meta_index_files(meta_path: Path, meta_data: dict):
    """Write meta-index JSON and regenerate companion Markdown."""
    meta_path.write_text(json.dumps(meta_data, indent=2) + "\n", encoding="utf-8")
    _write_meta_index_md(meta_path, meta_data)


def _write_meta_index_md(meta_path: Path, meta_data: dict):
    md_path = meta_path.with_suffix(".md")
    display_name = re.sub(r"_meta_index$", "", meta_path.stem)

    rows = []
    for idx in sorted(meta_data["indexes"], key=lambda x: x["index-order"]):
        ih = idx["index-hash"]
        short_hash = ih[:14]
        rows.append(
            f"| {idx['index-order']} "
            f"| {idx['filename']} "
            f"| {short_hash} "
            f"| {idx.get('description', '')} |"
        )

    table = "\n".join(rows)
    meta_hash = meta_data.get("meta-index-hash", "")
    updated = meta_data.get("updated", utcnow_iso())

    md_content = textwrap.dedent(f"""\
        # {display_name} — Meta Index

        > Generated by doc-graph.py. Edit descriptions here; hashes are managed by tooling.

        | Order | File | Hash (8 chars) | Description |
        |-------|------|----------------|-------------|
        {table}

        **Meta-Index Hash:** {meta_hash}
        **Updated:** {updated}
    """)
    md_path.write_text(md_content, encoding="utf-8")


# ---------------------------------------------------------------------------
# cmd_split / cmd_init
# ---------------------------------------------------------------------------


def cmd_split(args):
    source = Path(args.file)
    if not source.exists():
        print(f"ERROR: file not found: {source}", file=sys.stderr)
        sys.exit(1)

    content = source.read_text(encoding="utf-8")
    line_count_total = content.count("\n")
    byte_count_total = len(content.encode("utf-8"))

    threshold_lines = getattr(args, "threshold_lines", None) or 500
    threshold_bytes = getattr(args, "threshold_bytes", None) or 50000
    split_level = getattr(args, "split_on", None) or 2
    out_dir = Path(getattr(args, "out_dir", None) or source.parent)
    out_dir.mkdir(parents=True, exist_ok=True)

    under_threshold = (
        line_count_total < threshold_lines and byte_count_total < threshold_bytes
    )
    if under_threshold and not getattr(args, "force", False):
        print(
            f"WARNING: {source.name} is under threshold "
            f"({line_count_total} lines, {byte_count_total} bytes). "
            "Use --force to split anyway.",
            file=sys.stderr,
        )
        sys.exit(1)

    sections = split_at_heading(content, split_level)

    # If no headings at split level, treat whole file as one section
    if len(sections) == 1 and sections[0][0] == "_preamble":
        sections = [("_full", content)]
    elif not sections:
        sections = [("_full", content)]

    basename = source.stem
    now = utcnow_iso()
    index_filename = f"{basename}_index.json"
    index_path = out_dir / index_filename

    section_entries = []
    for order, (heading_text, sec_content) in enumerate(sections, start=1):
        sec_slug = slug(heading_text)
        if not sec_slug:
            sec_slug = f"section-{order}"
        filename = f"{basename}_part_{order:02d}_{sec_slug}.md"
        sec_path = out_dir / filename

        # Hash the raw section body (before adding frontmatter)
        content_hash = sha256_str(sec_content)

        # Relative path from section file to index
        rel_to_index = os.path.relpath(index_path, sec_path.parent)

        header = {
            "docgraph-version": str(DOCGRAPH_VERSION),
            "docgraph-type": "section",
            "section-id": sec_slug,
            "section-order": str(order),
            "parent-index": rel_to_index,
            "content-hash": content_hash,
        }

        file_content = compose_frontmatter(header, sec_content)
        sec_path.write_text(file_content, encoding="utf-8")

        sec_bytes = len(sec_content.encode("utf-8"))
        sec_lines = sec_content.count("\n")

        section_entries.append(
            {
                "section-order": order,
                "section-id": sec_slug,
                "filename": filename,
                "content-hash": content_hash,
                "line-count": sec_lines,
                "byte-count": sec_bytes,
                "description": "",
            }
        )

        # Warn if section still exceeds threshold
        if sec_lines >= threshold_lines or sec_bytes >= threshold_bytes:
            print(
                f"WARNING: {filename} still exceeds threshold "
                f"({sec_lines} lines, {sec_bytes} bytes). "
                "Consider running split again on this section."
            )

    index_hash = compute_index_hash(section_entries)

    index_data = {
        "docgraph-version": DOCGRAPH_VERSION,
        "docgraph-type": "section-index",
        "source-file": source.name,
        "split-heading-level": split_level,
        "created": now,
        "updated": now,
        "parent-index": None,
        "sections": section_entries,
        "index-hash": index_hash,
    }

    write_index_files(index_path, index_data)

    print(
        f"Split {source.name} into {len(section_entries)} sections."
        f"\n  Index: {index_path}"
    )
    for e in section_entries:
        print(f"  [{e['section-order']:02d}] {e['filename']}")


def cmd_init(args):
    source = Path(args.file)
    basename = source.stem
    out_dir = Path(getattr(args, "out_dir", None) or source.parent)
    index_path = out_dir / f"{basename}_index.json"

    if index_path.exists():
        print(f"Index already exists: {index_path} — nothing to do (idempotent).")
        return

    cmd_split(args)


# ---------------------------------------------------------------------------
# update helpers
# ---------------------------------------------------------------------------


def update_section_file(path: Path):
    """Recompute content-hash for a section file; propagate to parent index."""
    content = path.read_text(encoding="utf-8")
    header, body = parse_frontmatter(content)

    if not header:
        # No frontmatter — treat entire file as body, add frontmatter
        print(f"Adding docgraph frontmatter to {path.name}")
        new_hash = sha256_str(content)
        header = {
            "docgraph-version": str(DOCGRAPH_VERSION),
            "docgraph-type": "section",
            "section-id": slug(path.stem),
            "section-order": "1",
            "parent-index": "",
            "content-hash": new_hash,
        }
        path.write_text(compose_frontmatter(header, content), encoding="utf-8")
        return

    new_hash = sha256_str(body)
    old_hash = header.get("content-hash", "")

    if new_hash == old_hash:
        print(f"No change: {path.name}")
    else:
        header["content-hash"] = new_hash
        path.write_text(compose_frontmatter(header, body), encoding="utf-8")
        print(f"Updated content-hash: {path.name}")

    parent_index_rel = header.get("parent-index", "")
    if parent_index_rel:
        parent_index_path = (path.parent / parent_index_rel).resolve()
        if parent_index_path.exists():
            update_index(parent_index_path)
        else:
            print(
                f"WARNING: parent-index not found: {parent_index_path}",
                file=sys.stderr,
            )


def update_index(index_path: Path):
    """Recompute content-hashes for all sections; update index-hash."""
    index_path = Path(index_path)
    index_data = json.loads(index_path.read_text(encoding="utf-8"))
    changed = False

    for entry in index_data["sections"]:
        sec_path = (index_path.parent / entry["filename"]).resolve()
        if not sec_path.exists():
            print(f"WARNING: section file missing: {sec_path}", file=sys.stderr)
            continue

        new_hash = compute_content_hash(sec_path)
        if new_hash != entry["content-hash"]:
            entry["content-hash"] = new_hash
            # Also update the frontmatter in the section file itself
            _patch_section_hash(sec_path, new_hash)
            changed = True

        sec_content_raw = sec_path.read_text(encoding="utf-8")
        _, body = parse_frontmatter(sec_content_raw)
        entry["line-count"] = body.count("\n")
        entry["byte-count"] = len(body.encode("utf-8"))

    new_index_hash = compute_index_hash(index_data["sections"])
    if new_index_hash != index_data.get("index-hash"):
        index_data["index-hash"] = new_index_hash
        changed = True

    if changed:
        index_data["updated"] = utcnow_iso()
        write_index_files(index_path, index_data)
        print(f"Updated index: {index_path.name}")
    else:
        print(f"No change in index: {index_path.name}")

    parent_index = index_data.get("parent-index")
    if parent_index:
        meta_path = (index_path.parent / parent_index).resolve()
        if meta_path.exists():
            update_meta_index(meta_path)
        else:
            print(
                f"WARNING: parent meta-index not found: {meta_path}",
                file=sys.stderr,
            )


def update_meta_index(meta_path: Path):
    """Recompute index-hashes for all sub-indexes; update meta-index-hash."""
    meta_path = Path(meta_path)
    meta_data = json.loads(meta_path.read_text(encoding="utf-8"))
    changed = False

    for entry in meta_data["indexes"]:
        sub_index_path = (meta_path.parent / entry["filename"]).resolve()
        if not sub_index_path.exists():
            print(
                f"WARNING: sub-index file missing: {sub_index_path}",
                file=sys.stderr,
            )
            continue
        sub_data = json.loads(sub_index_path.read_text(encoding="utf-8"))
        current_hash = sub_data.get("index-hash", "")
        if current_hash != entry["index-hash"]:
            entry["index-hash"] = current_hash
            changed = True

    new_meta_hash = compute_meta_index_hash(meta_data["indexes"])
    if new_meta_hash != meta_data.get("meta-index-hash"):
        meta_data["meta-index-hash"] = new_meta_hash
        changed = True

    if changed:
        meta_data["updated"] = utcnow_iso()
        write_meta_index_files(meta_path, meta_data)
        print(f"Updated meta-index: {meta_path.name}")
    else:
        print(f"No change in meta-index: {meta_path.name}")

    parent = meta_data.get("parent-index")
    if parent:
        parent_path = (meta_path.parent / parent).resolve()
        if parent_path.exists():
            update_meta_index(parent_path)


def _patch_section_hash(sec_path: Path, new_hash: str):
    """Update the content-hash in a section file's frontmatter."""
    content = sec_path.read_text(encoding="utf-8")
    header, body = parse_frontmatter(content)
    if header:
        header["content-hash"] = new_hash
        sec_path.write_text(compose_frontmatter(header, body), encoding="utf-8")


def cmd_update(args):
    path = Path(args.path)
    if not path.exists():
        print(f"ERROR: not found: {path}", file=sys.stderr)
        sys.exit(1)

    name = path.name
    if name.endswith("_meta_index.json"):
        update_meta_index(path)
    elif name.endswith("_index.json"):
        update_index(path)
    else:
        update_section_file(path)


# ---------------------------------------------------------------------------
# cmd_verify
# ---------------------------------------------------------------------------


def cmd_verify(args):
    index_path = Path(args.index_file)
    if not index_path.exists():
        print(f"ERROR: index file not found: {index_path}", file=sys.stderr)
        sys.exit(1)

    index_data = json.loads(index_path.read_text(encoding="utf-8"))
    all_pass = True
    current_hashes = []

    for entry in sorted(index_data["sections"], key=lambda s: s["section-order"]):
        sec_path = (index_path.parent / entry["filename"]).resolve()
        stored_hash = entry["content-hash"]

        if not sec_path.exists():
            print(f"FAIL  MISSING  {entry['filename']}")
            all_pass = False
            current_hashes.append({"section-order": entry["section-order"], "content-hash": stored_hash})
            continue

        actual_hash = compute_content_hash(sec_path)
        current_hashes.append({"section-order": entry["section-order"], "content-hash": actual_hash})

        if actual_hash == stored_hash:
            print(f"PASS  {entry['filename']}")
        else:
            print(
                f"FAIL  {entry['filename']}\n"
                f"      stored : {stored_hash}\n"
                f"      actual : {actual_hash}"
            )
            all_pass = False

    # Verify index-hash
    expected_index_hash = compute_index_hash(current_hashes)
    stored_index_hash = index_data.get("index-hash", "")

    if expected_index_hash == stored_index_hash:
        print(f"\nPASS  index-hash: {stored_index_hash}")
    else:
        print(
            f"\nFAIL  index-hash\n"
            f"      stored : {stored_index_hash}\n"
            f"      actual : {expected_index_hash}"
        )
        all_pass = False

    if all_pass:
        print("\nOverall: PASS")
        sys.exit(0)
    else:
        print("\nOverall: FAIL")
        sys.exit(1)


# ---------------------------------------------------------------------------
# cmd_merge
# ---------------------------------------------------------------------------


def cmd_merge(args):
    index_path = Path(args.index_file)
    if not index_path.exists():
        print(f"ERROR: index file not found: {index_path}", file=sys.stderr)
        sys.exit(1)

    index_data = json.loads(index_path.read_text(encoding="utf-8"))
    bodies = []

    for entry in sorted(index_data["sections"], key=lambda s: s["section-order"]):
        sec_path = (index_path.parent / entry["filename"]).resolve()
        if not sec_path.exists():
            print(
                f"WARNING: section file missing: {sec_path}",
                file=sys.stderr,
            )
            continue
        content = sec_path.read_text(encoding="utf-8")
        _, body = parse_frontmatter(content)
        bodies.append(body)

    merged = "\n\n".join(bodies)

    out_file = getattr(args, "out", None)
    if out_file:
        Path(out_file).write_text(merged, encoding="utf-8")
        print(f"Merged to: {out_file}")
    else:
        sys.stdout.write(merged)


# ---------------------------------------------------------------------------
# cmd_status
# ---------------------------------------------------------------------------


def cmd_status(args):
    index_path = Path(args.index_file)
    if not index_path.exists():
        print(f"ERROR: index file not found: {index_path}", file=sys.stderr)
        sys.exit(1)

    index_data = json.loads(index_path.read_text(encoding="utf-8"))

    col_w = [5, 50, 6, 8, 10]
    header = (
        f"{'Order':<{col_w[0]}}  "
        f"{'File':<{col_w[1]}}  "
        f"{'Lines':<{col_w[2]}}  "
        f"{'Bytes':<{col_w[3]}}  "
        f"{'Status':<{col_w[4]}}"
    )
    print(header)
    print("-" * (sum(col_w) + 8))

    current_hashes = []
    for entry in sorted(index_data["sections"], key=lambda s: s["section-order"]):
        sec_path = (index_path.parent / entry["filename"]).resolve()
        stored_hash = entry["content-hash"]

        if not sec_path.exists():
            status = "MISSING"
            lines = "-"
            byt = "-"
            current_hashes.append({"section-order": entry["section-order"], "content-hash": stored_hash})
        else:
            actual_hash = compute_content_hash(sec_path)
            current_hashes.append({"section-order": entry["section-order"], "content-hash": actual_hash})
            status = "CURRENT" if actual_hash == stored_hash else "STALE"
            content = sec_path.read_text(encoding="utf-8")
            _, body = parse_frontmatter(content)
            lines = str(body.count("\n"))
            byt = str(len(body.encode("utf-8")))

        print(
            f"{entry['section-order']:<{col_w[0]}}  "
            f"{entry['filename']:<{col_w[1]}}  "
            f"{lines:<{col_w[2]}}  "
            f"{byt:<{col_w[3]}}  "
            f"{status:<{col_w[4]}}"
        )

    # Index hash status
    expected_index_hash = compute_index_hash(current_hashes)
    stored_index_hash = index_data.get("index-hash", "")
    index_status = "CURRENT" if expected_index_hash == stored_index_hash else "STALE"
    print()
    print(f"Index hash: {index_status}")
    print(f"  stored : {stored_index_hash}")
    if index_status == "STALE":
        print(f"  actual : {expected_index_hash}")


# ---------------------------------------------------------------------------
# argparse / main
# ---------------------------------------------------------------------------


def build_parser():
    parser = argparse.ArgumentParser(
        prog="doc-graph.py",
        description="Rhizome DocGraph protocol tooling (rhiz-docgraph v1).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"doc-graph {__version__} (rhiz-docgraph v{DOCGRAPH_VERSION})",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # --- split ---
    p_split = sub.add_parser(
        "split",
        help="Split a Markdown file into sections and create an index.",
    )
    p_split.add_argument("file", help="Source Markdown file")
    p_split.add_argument(
        "--threshold-lines",
        type=int,
        default=500,
        dest="threshold_lines",
        metavar="N",
        help="Minimum lines before splitting (default: 500)",
    )
    p_split.add_argument(
        "--threshold-bytes",
        type=int,
        default=50000,
        dest="threshold_bytes",
        metavar="N",
        help="Minimum bytes before splitting (default: 50000)",
    )
    p_split.add_argument(
        "--split-on",
        type=int,
        default=2,
        dest="split_on",
        metavar="N",
        help="Heading level to split on (default: 2)",
    )
    p_split.add_argument(
        "--out-dir",
        default=None,
        dest="out_dir",
        metavar="DIR",
        help="Output directory (default: same as source file)",
    )
    p_split.add_argument(
        "--force",
        action="store_true",
        help="Split even if file is under threshold",
    )
    p_split.set_defaults(func=cmd_split)

    # --- update ---
    p_update = sub.add_parser(
        "update",
        help="Recompute hashes for a section file or index file.",
    )
    p_update.add_argument(
        "path",
        help="Section file, index .json, or meta-index .json",
    )
    p_update.set_defaults(func=cmd_update)

    # --- verify ---
    p_verify = sub.add_parser(
        "verify",
        help="Verify all section hashes and index integrity.",
    )
    p_verify.add_argument("index_file", help="Path to _index.json")
    p_verify.set_defaults(func=cmd_verify)

    # --- merge ---
    p_merge = sub.add_parser(
        "merge",
        help="Reassemble sections into a single document.",
    )
    p_merge.add_argument("index_file", help="Path to _index.json")
    p_merge.add_argument(
        "--out",
        default=None,
        metavar="FILE",
        help="Output file (default: stdout)",
    )
    p_merge.set_defaults(func=cmd_merge)

    # --- status ---
    p_status = sub.add_parser(
        "status",
        help="Show section status table (CURRENT/STALE/MISSING).",
    )
    p_status.add_argument("index_file", help="Path to _index.json")
    p_status.set_defaults(func=cmd_status)

    # --- init ---
    p_init = sub.add_parser(
        "init",
        help="Idempotent split: creates index only if it does not exist.",
    )
    p_init.add_argument("file", help="Source Markdown file")
    p_init.add_argument(
        "--threshold-lines",
        type=int,
        default=500,
        dest="threshold_lines",
        metavar="N",
    )
    p_init.add_argument(
        "--threshold-bytes",
        type=int,
        default=50000,
        dest="threshold_bytes",
        metavar="N",
    )
    p_init.add_argument(
        "--split-on",
        type=int,
        default=2,
        dest="split_on",
        metavar="N",
    )
    p_init.add_argument(
        "--out-dir",
        default=None,
        dest="out_dir",
        metavar="DIR",
    )
    p_init.add_argument(
        "--force",
        action="store_true",
    )
    p_init.set_defaults(func=cmd_init)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
