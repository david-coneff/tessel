#!/usr/bin/env node
/**
 * tools/tessel-cli.js — Command-line interface for the Tessel compiler.
 *
 * Drop-in replacement for md_to_html.py. Accepts the same flags so that
 * regenerate_docs.py (and any existing build scripts) can call tessel-cli.js
 * instead of md_to_html.py with no other changes.
 *
 * Usage:
 *   node tessel-cli.js [options] SOURCE.md [OUTPUT.html]
 *
 * Options:
 *   --title "…"        Override document title (prepended as front-matter if none present)
 *   --collapsible      Auto-wrap h2 sections in @section/@endsection (matches md_to_html.py --collapsible)
 *   --playbook         Mark document as walkthrough (sets is_walkthrough in AST)
 *   --manifest PATH    Path to doc-manifest.json (unused; accepted for CLI compatibility)
 *   --out PATH         Output file path (alternative to positional argument)
 *   --help, -h         Show this help
 *
 * Exit codes: 0 = success, 1 = error
 *
 * Compatibility with md_to_html.py:
 *   --collapsible   → inserts @section/@endsection around every h2 heading block
 *   --playbook      → equivalent to front-matter `is_walkthrough: true`
 *   --manifest      → accepted and silently ignored (nav-tree feature TBD)
 *   --title         → injected as `title:` front-matter when not already present
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var COMPILER_DIR = path.resolve(__dirname, '..', 'compiler');
var Tessel;
try {
  Tessel = require(path.join(COMPILER_DIR, 'tessel'));
} catch (e) {
  process.stderr.write('[tessel-cli] Failed to load tessel compiler: ' + e.message + '\n');
  process.stderr.write('[tessel-cli] Expected compiler at: ' + COMPILER_DIR + '\n');
  process.exit(1);
}

// ---- arg parsing ----
function parseArgs(argv) {
  var args = { src: null, out: null, title: '', collapsible: false, playbook: false, manifest: '', help: false };
  var positional = [];
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === '--help' || a === '-h')        { args.help = true; }
    else if (a === '--collapsible')          { args.collapsible = true; }
    else if (a === '--playbook')             { args.playbook = true; }
    else if ((a === '--title' || a === '--manifest' || a === '--out') && argv[i + 1]) {
      if (a === '--title')    args.title    = argv[++i];
      if (a === '--manifest') args.manifest = argv[++i];
      if (a === '--out')      args.out      = argv[++i];
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  args.src = positional[0] || null;
  args.out = args.out || positional[1] || null;
  return args;
}

function usage() {
  process.stdout.write([
    'Tessel CLI — Markdown → interactive HTML compiler',
    '',
    'Usage: node tessel-cli.js [options] SOURCE.md [OUTPUT.html]',
    '',
    'Options:',
    '  --title "…"       Override document title',
    '  --collapsible     Auto-wrap h2 sections as collapsible (md_to_html.py compat)',
    '  --playbook        Mark as walkthrough document',
    '  --manifest PATH   Doc-manifest path (accepted, currently unused)',
    '  --out PATH        Output file path',
    '  --help, -h        Show this help',
    '',
    'If OUTPUT is omitted, replaces .md extension with .html.',
    '',
  ].join('\n'));
}

// ---- collapsible preprocessing ----
// Converts h2-delimited sections to @section/@endsection blocks so the
// Tessel parser renders them as <details> elements — matching md_to_html.py
// --collapsible behavior.
function injectSections(source) {
  // Preserve front-matter
  var fm = '', body = source;
  var fmMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    fm = fmMatch[0];
    body = source.slice(fm.length);
  }

  var lines = body.split('\n');
  var out = [];
  var inSection = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // Match h2 headings (## ...) but not h3+ (### ...)
    if (/^## /.test(line)) {
      if (inSection) {
        out.push('@endsection');
        out.push('');
      }
      out.push(line);
      out.push('@section');
      inSection = true;
    } else {
      out.push(line);
    }
  }

  if (inSection) {
    out.push('');
    out.push('@endsection');
  }

  return fm + out.join('\n');
}

// ---- front-matter injection ----
function injectFrontMatter(source, title, playbook) {
  if (!title && !playbook) return source;

  var hasFm = /^---\r?\n/.test(source);
  if (hasFm) {
    // Patch existing front-matter
    var fmMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (fmMatch) {
      var fmBody = fmMatch[1];
      var rest   = source.slice(fmMatch[0].length);
      if (title && !/^title:/m.test(fmBody))   fmBody = 'title: ' + title + '\n' + fmBody;
      if (playbook && !/^is_walkthrough:/m.test(fmBody)) fmBody += '\nis_walkthrough: true';
      return '---\n' + fmBody.trim() + '\n---\n' + rest;
    }
  }

  // No existing front-matter — prepend one
  var fmLines = ['---'];
  if (title)    fmLines.push('title: ' + title);
  if (playbook) fmLines.push('is_walkthrough: true');
  fmLines.push('---');
  return fmLines.join('\n') + '\n' + source;
}

// ---- main ----
function main() {
  var args = parseArgs(process.argv.slice(2));

  if (args.help) { usage(); process.exit(0); }

  if (!args.src) {
    process.stderr.write('Error: SOURCE.md is required.\n');
    usage();
    process.exit(1);
  }

  var srcPath = path.resolve(args.src);
  if (!fs.existsSync(srcPath)) {
    process.stderr.write('Error: File not found: ' + srcPath + '\n');
    process.exit(1);
  }

  var outPath = args.out
    ? path.resolve(args.out)
    : srcPath.replace(/\.md$/i, '.html');

  var source;
  try {
    source = fs.readFileSync(srcPath, 'utf8');
  } catch (e) {
    process.stderr.write('Error reading ' + srcPath + ': ' + e.message + '\n');
    process.exit(1);
  }

  // Apply preprocessing passes
  if (args.title || args.playbook) {
    source = injectFrontMatter(source, args.title, args.playbook);
  }
  if (args.collapsible) {
    source = injectSections(source);
  }

  // Compile
  var html;
  try {
    html = Tessel.compile(source);
  } catch (e) {
    process.stderr.write('Compile error in ' + path.basename(srcPath) + ': ' + e.message + '\n');
    if (e.stack) process.stderr.write(e.stack + '\n');
    process.exit(1);
  }

  // Write output
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
  } catch (e) {
    process.stderr.write('Error writing ' + outPath + ': ' + e.message + '\n');
    process.exit(1);
  }

  var sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  process.stdout.write(path.basename(srcPath) + ' → ' + path.relative(process.cwd(), outPath) + ' (' + sizeKB + ' KB)\n');
}

main();
