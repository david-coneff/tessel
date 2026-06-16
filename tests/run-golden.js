#!/usr/bin/env node
/**
 * tests/run-golden.js — Tessel golden-file test runner
 *
 * For each .md file in tests/golden/, compiles it and diffs against the
 * corresponding .html file. Exits 0 if all pass, 1 if any fail.
 *
 * Usage:
 *   node tests/run-golden.js              # run all golden tests
 *   node tests/run-golden.js --update     # regenerate .html golden files from current .md
 *   node tests/run-golden.js --file foo   # run only tests/golden/foo.md
 *
 * Golden file pairs:
 *   tests/golden/<name>.md     — source Markdown
 *   tests/golden/<name>.html   — expected compiled output
 *
 * If the .html doesn't exist yet, run with --update to create it.
 *
 * Structural diff mode (default):
 *   Rather than byte-for-byte string diff (which is brittle due to embedded timestamps),
 *   the runner extracts structural fingerprints from each HTML and compares those.
 *   Fingerprints include: title, field IDs, block types, conditional expr, TOC ids.
 *
 * Strict mode (--strict):
 *   Full string diff — useful for pinning exact output during release.
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT   = path.resolve(__dirname, '..');
var GOLDEN = path.join(ROOT, 'tests', 'golden');

// Load compiler
var Tessel = require(path.join(ROOT, 'compiler', 'tessel'));

// ---- CLI args ----
var args    = process.argv.slice(2);
var UPDATE  = args.indexOf('--update') >= 0;
var STRICT  = args.indexOf('--strict') >= 0;
var fileArg = null;
var fi = args.indexOf('--file');
if (fi >= 0 && args[fi + 1]) fileArg = args[fi + 1];

// ---- helpers ----
function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, s) { fs.writeFileSync(p, s, 'utf8'); }

/**
 * Extract a structural fingerprint from a compiled HTML for comparison.
 * Returns an object that can be JSON.stringified and diffed.
 */
function fingerprint(html) {
  function all(rx) {
    var m, out = [];
    var r = new RegExp(rx, 'g');
    while ((m = r.exec(html)) !== null) out.push(m[1]);
    return out;
  }
  function first(rx) { var m = html.match(new RegExp(rx)); return m ? m[1] : null; }
  return {
    title:       first('<title>([^<]+)</title>'),
    doc_id:      first('data-doc="([^"]+)"'),
    field_ids:   all('data-tv-id="([^"]+)"').sort(),
    field_types: all('class="([a-z-]+field)[^"]*"').filter(function(c,i,a){return a.indexOf(c)===i;}).sort(),
    toc_ids:     all('href="#([^"]+)"').sort(),
    cond_exprs:  all('data-tv-expr="([^"]+)"').sort(),
    param_vars:  all('data-var="([^"]+)"').filter(function(c,i,a){return a.indexOf(c)===i;}).sort(),
    has_runtime: html.indexOf('(function(){') >= 0,
    has_source:  html.indexOf('text/tessel-source') >= 0,
  };
}

function diffObjects(a, b, label) {
  var errors = [];
  function check(key) {
    var av = JSON.stringify(a[key]), bv = JSON.stringify(b[key]);
    if (av !== bv) errors.push('  [' + key + '] expected ' + av + ' got ' + bv);
  }
  Object.keys(a).forEach(check);
  return errors;
}

// ---- test runner ----
function runTest(mdPath, htmlPath, name) {
  var md = readFile(mdPath);
  var html;
  try { html = Tessel.compile(md); }
  catch (e) { return { pass: false, error: 'Compile error: ' + e.message }; }

  if (UPDATE || !fs.existsSync(htmlPath)) {
    writeFile(htmlPath, html);
    return { pass: true, updated: true };
  }

  var golden = readFile(htmlPath);

  if (STRICT) {
    if (html === golden) return { pass: true };
    // find first diff line
    var goldenLines = golden.split('\n');
    var htmlLines   = html.split('\n');
    for (var i = 0; i < Math.max(goldenLines.length, htmlLines.length); i++) {
      if (goldenLines[i] !== htmlLines[i]) {
        return { pass: false, error: 'Line ' + (i + 1) + ' differs:\n  golden: ' + goldenLines[i] + '\n  got:    ' + htmlLines[i] };
      }
    }
    return { pass: true };
  }

  // Structural fingerprint diff
  var fpGolden = fingerprint(golden);
  var fpActual = fingerprint(html);
  var errors   = diffObjects(fpGolden, fpActual, name);
  if (errors.length) return { pass: false, error: 'Fingerprint mismatch:\n' + errors.join('\n') };
  return { pass: true };
}

function collectTests() {
  var files = fs.readdirSync(GOLDEN).filter(function(f) { return f.endsWith('.md'); });
  if (fileArg) {
    var target = fileArg.endsWith('.md') ? fileArg : fileArg + '.md';
    files = files.filter(function(f) { return f === target || f === path.basename(target); });
  }
  return files.map(function(f) {
    var name = f.replace(/\.md$/, '');
    return {
      name:     name,
      mdPath:   path.join(GOLDEN, f),
      htmlPath: path.join(GOLDEN, name + '.html'),
    };
  });
}

// ---- main ----
var tests   = collectTests();
var passed  = 0;
var failed  = 0;
var updated = 0;

if (!tests.length) {
  console.log('No golden tests found in ' + GOLDEN);
  if (!fileArg) console.log('Run with --update to generate golden files from your .md fixtures.');
  process.exit(0);
}

tests.forEach(function(t) {
  process.stdout.write('  ' + t.name + ' … ');
  var result = runTest(t.mdPath, t.htmlPath, t.name);
  if (result.updated) {
    console.log('UPDATED');
    updated++;
    passed++;
  } else if (result.pass) {
    console.log('PASS');
    passed++;
  } else {
    console.log('FAIL');
    console.log(result.error);
    failed++;
  }
});

console.log('\n' + (passed) + '/' + tests.length + ' passed' + (updated ? ' (' + updated + ' updated)' : '') + (failed ? ', ' + failed + ' FAILED' : ''));
process.exit(failed > 0 ? 1 : 0);
