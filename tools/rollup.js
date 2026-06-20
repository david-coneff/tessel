#!/usr/bin/env node
/**
 * tools/rollup.js — Tessel build script
 *
 * Combines all compiler modules into:
 *   dist/tessel.bundle.js   — single JS file, browser + Node compatible
 *
 * Usage:
 *   node tools/rollup.js [--out <dir>] [--watch]
 *
 * The bundle uses a simple concatenation strategy (no bundler needed):
 *   1. Each module is wrapped to suppress its own module.exports line in bundle mode.
 *   2. All modules are concatenated in dependency order.
 *   3. A UMD wrapper provides window.Tessel in browsers and module.exports in Node.
 *
 * You can also run this to compile a single .md file for quick testing:
 *   node tools/rollup.js --compile path/to/doc.md [--html-out path/to/out.html]
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT    = path.resolve(__dirname, '..');
var DIST    = path.join(ROOT, 'dist');
var COMPILER= path.join(ROOT, 'compiler');

// Dependency order: CSS → Runtime → Parser → Fields → Compiler → Entry
var MODULES = [
  { file: 'tessel-css.js',      name: 'TESSEL_CSS',        type: 'const' },
  { file: 'tessel-runtime.js',  name: 'TESSEL_RUNTIME_JS', type: 'const' },
  { file: 'tessel-parser.js',   name: 'TesselParser',      type: 'class' },
  { file: 'tessel-fields.js',   name: 'TesselFields',      type: 'object' },
  { file: 'tessel-compiler.js', name: 'TesselCompiler',    type: 'class' },
];
var ENTRY = path.join(COMPILER, 'tessel.js');

// ---- helpers ----
function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/**
 * Strip the CJS module.exports shim from a module's source.
 * The shim is always the last non-empty line:
 *   if (typeof module !== 'undefined') module.exports = X;
 */
function stripCjsShim(src) {
  return src.replace(/\nif\s*\(typeof module[\s\S]{1,120}module\.exports\s*=\s*\w+;\s*$/m, '');
}

/**
 * Build the bundle.
 * Returns the full JS string.
 */
function buildBundle() {
  var parts = [];

  parts.push('/* Tessel ' + getVersion() + ' — compiled bundle — DO NOT EDIT */');
  parts.push('(function(root, factory) {');
  parts.push('  if (typeof module !== "undefined" && module.exports) {');
  parts.push('    module.exports = factory();');
  parts.push('  } else {');
  parts.push('    root.Tessel = factory();');
  parts.push('  }');
  parts.push('})(typeof globalThis !== "undefined" ? globalThis : this, function() {');
  parts.push('"use strict";');
  parts.push('');

  // Inline each module (strip the CJS shim since we're concatenating)
  MODULES.forEach(function(mod) {
    var src = readFile(path.join(COMPILER, mod.file));
    src = stripCjsShim(src);
    // Strip file-level 'use strict' duplicates
    src = src.replace(/^['"']use strict['"'];\n?/m, '');
    parts.push('// ---- ' + mod.file + ' ----');
    parts.push(src.trim());
    parts.push('');
  });

  // Inline the entry file body — extract just the factory function body
  // tessel.js wraps in a UMD; for the bundle we want the inner factory.
  var entrySrc = readFile(ENTRY);
  // Extract the factory function body (between the two outermost parens of the factory call)
  var factoryMatch = entrySrc.match(/\}, function\(TESSEL_CSS[^{]*\{([\s\S]+)\}\);?\s*$/);
  if (factoryMatch) {
    var factoryBody = factoryMatch[1].trim();
    // Remove module.exports reference (not needed inside bundle)
    factoryBody = factoryBody.replace(/\nif\s*\(typeof module[\s\S]{1,120}module\.exports[\s\S]*?;\s*$/m, '');
    parts.push('// ---- tessel.js (entry) ----');
    parts.push(factoryBody);
  } else {
    // Fallback: just build the Tessel object directly
    parts.push('// ---- entry (fallback) ----');
    parts.push('var _parser   = new TesselParser();');
    parts.push('var _compiler = new TesselCompiler({ css: TESSEL_CSS, runtime: TESSEL_RUNTIME_JS, fields: TesselFields });');
    parts.push('var Tessel_api = {');
    parts.push('  version: "' + getVersion() + '",');
    parts.push('  parse:      function(src){ return _parser.parse(src); },');
    parts.push('  compile:    function(src){ return _compiler.compile(_parser.parse(src)); },');
    parts.push('  compileAst: function(ast){ return _compiler.compile(ast); },');
    parts.push('  Parser: TesselParser, Compiler: TesselCompiler, Fields: TesselFields');
    parts.push('};');
  }

  parts.push('');
  parts.push('return Tessel_api || { version:"' + getVersion() + '", parse:parse, compile:compile, compileAst:compileAst, Parser:TesselParser, Compiler:TesselCompiler, Fields:TesselFields };');
  parts.push('});');

  return parts.join('\n');
}

function getVersion() {
  try {
    var pkg = JSON.parse(readFile(path.join(ROOT, 'package.json')));
    return pkg.version || '0.1.0';
  } catch(e) { return '0.1.0'; }
}

// ---- compile a .md file ----
function compileMd(mdPath, outPath) {
  // Require the local modules (not the bundle — use the source for dev speed)
  var Tessel = require(path.join(COMPILER, 'tessel'));
  var md = readFile(mdPath);
  var html = Tessel.compile(md);
  outPath = outPath || mdPath.replace(/\.md$/, '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Compiled: ' + mdPath + ' → ' + outPath);
}

// ---- CLI ----
function main() {
  var args = process.argv.slice(2);
  var outDir = DIST;
  var watchMode  = false;
  var compileFile = null;
  var compileOut  = null;

  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) { outDir = path.resolve(args[++i]); }
    else if (args[i] === '--watch') { watchMode = true; }
    else if (args[i] === '--compile' && args[i + 1]) { compileFile = path.resolve(args[++i]); }
    else if (args[i] === '--html-out' && args[i + 1]) { compileOut = path.resolve(args[++i]); }
  }

  if (compileFile) {
    compileMd(compileFile, compileOut);
    return;
  }

  ensureDir(outDir);

  var bundlePath = path.join(outDir, 'tessel.bundle.js');
  var bundle = buildBundle();
  fs.writeFileSync(bundlePath, bundle, 'utf8');
  console.log('Bundle written: ' + bundlePath + ' (' + Math.round(bundle.length / 1024) + ' KB)');

  if (watchMode) {
    var watchTargets = MODULES.map(function(m) { return path.join(COMPILER, m.file); }).concat([ENTRY]);
    console.log('Watching for changes...');
    watchTargets.forEach(function(f) {
      fs.watch(f, function() {
        console.log('Changed: ' + path.basename(f) + ' -- rebuilding...');
        try {
          var updated = buildBundle();
          fs.writeFileSync(bundlePath, updated, 'utf8');
          console.log('Rebuilt: ' + bundlePath);
        } catch(err) {
          console.error('Build error: ' + err.message);
        }
      });
    });
  }
}

main();
