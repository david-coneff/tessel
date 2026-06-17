"""
CFC v1 Reference Implementation (Python)
CFC version: cfc-v_2026-06-16_20-02_00_49b99195
Spec:        spec/schemas/cfc/cfc-v_2026-06-16_20-02_00_49b99195/spec-blob.txt

This file is the normative Python implementation for CFC Algorithm v1.
Co-packaged in the schema version folder for schema-locked rendering.
"""

import hashlib, re
from datetime import datetime, timezone


def cid_short(data: bytes, file_type: str = "binary") -> str:
    if file_type == "text":
        text = data.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")
        data = text.encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:8]


def canonical_filename(title: str, data: bytes, ext: str,
                       file_type: str = "binary",
                       ts: datetime | None = None) -> str:
    if ts is None:
        ts = datetime.now(timezone.utc)
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title).strip("-").lower()
    stamp = ts.strftime("%Y-%m-%d_%H-%M_%S")
    cid = cid_short(data, file_type)
    return f"{slug}_{stamp}_{cid}.{ext}"


def parse_canonical_filename(filename: str) -> dict | None:
    m = re.match(
        r"^([a-z0-9][a-z0-9_-]*)_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})_(\d{2})_([0-9a-f]{8})(?:\.([a-zA-Z0-9]+))?$",
        filename
    )
    if not m:
        return None
    return {
        "title": m.group(1),
        "timestamp": f"{m.group(2)}_{m.group(3)}_{m.group(4)}",
        "cid_short": m.group(5),
        "extension": m.group(6),
    }


def verify_canonical_filename(filename: str, data: bytes,
                               file_type: str = "binary") -> bool:
    parsed = parse_canonical_filename(filename)
    if not parsed:
        return False
    return cid_short(data, file_type) == parsed["cid_short"]
