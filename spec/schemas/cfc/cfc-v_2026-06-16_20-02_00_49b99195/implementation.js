/**
 * CFC v1 Reference Implementation (JavaScript — normative)
 * CFC version: cfc-v_2026-06-16_20-02_00_49b99195
 * Spec:        spec/schemas/cfc/cfc-v_2026-06-16_20-02_00_49b99195/spec-blob.txt
 *
 * This file is the normative JS implementation for CFC Algorithm v1.
 * It is co-packaged in the schema version folder so that any interpreter
 * or compiler can reproduce the exact algorithm used when a document was
 * created, without defaulting to a current (potentially incompatible) version.
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

async function canonicalFilename(title, bytes, ext, fileType = "binary", ts = new Date()) {
  const slug = title.replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").toLowerCase();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${ts.getUTCFullYear()}-${pad(ts.getUTCMonth()+1)}-${pad(ts.getUTCDate())}_${pad(ts.getUTCHours())}-${pad(ts.getUTCMinutes())}_${pad(ts.getUTCSeconds())}`;
  const cid = await cidShort(bytes, fileType);
  return `${slug}_${stamp}_${cid}.${ext}`;
}

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

async function verifyCanonicalFilename(filename, bytes, fileType = "binary") {
  const parsed = parseCanonicalFilename(filename);
  if (!parsed) return false;
  const actual = await cidShort(bytes, fileType);
  return parsed.cid_short === actual;
}

if (typeof module !== "undefined") module.exports = { cidShort, canonicalFilename, parseCanonicalFilename, verifyCanonicalFilename };
