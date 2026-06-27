#!/usr/bin/env node
/*
 * studio/build.mjs — Tessel VS single-file studio build (rhiz-Partition
 * modality B / DS-002), the esbuild replacement for `vite build`.
 *
 * Rolls the modular studio/src/ tree up into ONE self-contained
 * studio/tessel-vs.html that opens from file:// with zero network — the same
 * deliverable Vite + vite-plugin-singlefile produced, but via a lean,
 * AI-agent-runnable, config-free command:
 *
 *     node tools/rollup.cjs && node studio/build.mjs     # = npm run build
 *     node studio/build.mjs --watch                       # rebuild on change
 *
 * Pipeline:
 *   1. esbuild bundles studio/src/build-entry.js (which imports the 4 CSS files
 *      + main.js) into one JS + one CSS output, held in memory.
 *   2. The HTML shell is DERIVED from the existing studio/src/tessel-vs.html
 *      source by stripping its <link rel=stylesheet> and <script src> tags —
 *      so there is a single shell source of truth shared with the Vite path.
 *   3. The legacy dist/tessel.bundle.js (window.Tessel, produced by
 *      tools/rollup.cjs) is inlined as a classic <script> BEFORE the app, to
 *      preserve parity with the vite-plugin-singlefile output.
 *   4. CSS is inlined into <head>; the bundle + app JS into <body>.
 *
 * studio/tessel-vs.html is a GENERATED build output, not source — only
 * studio/src/ is canonical. The emitted file carries a generated banner.
 */
import { build, context } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const STUDIO = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(STUDIO, '..');
const ENTRY = resolve(STUDIO, 'src/build-entry.js');
const SHELL_SRC = resolve(STUDIO, 'src/tessel-vs.html');
const BUNDLE = resolve(ROOT, 'dist/tessel.bundle.js');
const OUT = resolve(STUDIO, 'tessel-vs.html');
const watch = process.argv.includes('--watch');

const BANNER = `<!--\n  GENERATED FILE — do not edit by hand.\n  Source of truth: studio/src/ (modular ESM + CSS). Rebuild: npm run build\n  Single-file roll-up per rhiz-Partition modality B (DS-002), via esbuild.\n-->\n`;

/** Derive an inline-ready shell from the Vite shell: drop its CSS <link>s and
 *  the two <script src> tags (the bundle + the module entry) — the build
 *  injects inline equivalents of all three. */
function deriveShell() {
  return readFileSync(SHELL_SRC, 'utf8')
    .replace(/^[ \t]*<link rel="stylesheet" href="\.\/styles\/[^"]+">[ \t]*\r?\n/gim, '')
    .replace(/^[ \t]*<script src="\.\.\/\.\.\/dist\/tessel\.bundle\.js"><\/script>[ \t]*\r?\n/gim, '')
    .replace(/^[ \t]*<script type="module" src="\.\/main\.js"><\/script>[ \t]*\r?\n/gim, '');
}

const options = {
  entryPoints: [ENTRY],
  bundle: true,
  minify: true,
  // ESM, not IIFE: StorageEngine.js uses top-level await for its OPFS init, and
  // esbuild cannot lower top-level await into an IIFE. The app script is inlined
  // as <script type="module"> (which permits TLA); everything is inlined, so the
  // file:// "no module fetch" restriction never applies. (cf. F-BUILD-01.)
  format: 'esm',
  target: 'es2022',
  charset: 'utf8',
  legalComments: 'none',
  write: false,
  outdir: resolve(STUDIO, '.build'),
};

/** Escape any literal </script> / </style> so inline tags don't close early.
 *  Validate the EMITTED artifact, not just that the bundle compiled
 *  (rhiz-Audit pattern #41 / Charlotte template-constraint lesson). */
const escScript = (s) => s.replace(/<\/script>/gi, '<\\/script>');
const escStyle = (s) => s.replace(/<\/style>/gi, '<\\/style>');

function emit(outputFiles) {
  let js = '';
  let css = '';
  for (const f of outputFiles) {
    if (f.path.endsWith('.js')) js = f.text;
    else if (f.path.endsWith('.css')) css = f.text;
  }

  const legacyBundle = existsSync(BUNDLE) ? readFileSync(BUNDLE, 'utf8') : '';

  let html = deriveShell();
  if (css) html = html.replace('</head>', `<style>${escStyle(css)}</style>\n</head>`);
  // Legacy bundle stays a classic global script (sets window.Tessel) and runs
  // first; the app is an ES module (deferred) that runs after it — same order
  // the Vite shell's two <script> tags established.
  const scripts =
    (legacyBundle ? `<script>${escScript(legacyBundle)}</script>\n` : '') +
    `<script type="module">${escScript(js)}</script>\n`;
  html = html.replace('</body>', `${scripts}</body>`);
  html = BANNER + html;

  writeFileSync(OUT, html);
  console.log(`studio/tessel-vs.html written — ${Math.round(Buffer.byteLength(html) / 1024)} KB (self-contained, file://-ready)`);
}

if (watch) {
  const ctx = await context({ ...options, plugins: [{
    name: 'inline-html',
    setup(b) { b.onEnd((r) => { if (r.outputFiles) emit(r.outputFiles); }); },
  }] });
  await ctx.watch();
  console.log('watching studio/src/ — rebuilding studio/tessel-vs.html on change …');
} else {
  const result = await build(options);
  emit(result.outputFiles);
}
