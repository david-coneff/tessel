#!/usr/bin/env node
/*
 * studio/build-pwa.mjs — Tessel VS PWA build (esbuild replacement for the
 * vite + vite-plugin-pwa pipeline). Run as `npm run build:pwa`.
 *
 * There is no technical reason a PWA needs Vite: a service worker is just JS
 * that esbuild bundles, the web-app manifest is static JSON, and registration
 * is three lines. vite-plugin-pwa automated Workbox's precache-manifest +
 * revisioning, but the esbuild single-file build inlines the whole app into one
 * index.html, so the precache set is one shell + one content hash.
 *
 * Output (studio/tessel-pwa/dist/, deployed to /tessel/ by deploy-pwa.yml):
 *   index.html              the inlined app + <link rel=manifest> + SW register
 *   sw.js                   esbuild-bundled, minified, content-hash versioned
 *   manifest.webmanifest    the web app manifest
 *   icons/icon.svg          app icon
 *
 * Unlike the single-file studio build this is intentionally MULTI-FILE: a PWA
 * caches discrete URLs. The app itself is still one inlined file (index.html);
 * sw.js / manifest / icon sit beside it as separately-cacheable resources.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const STUDIO = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(STUDIO, '..');
const ENTRY = resolve(STUDIO, 'src/build-entry.js');
const SHELL_SRC = resolve(STUDIO, 'src/tessel-vs.html');
const BUNDLE = resolve(ROOT, 'dist/tessel.bundle.js');
const SW_SRC = resolve(STUDIO, 'tessel-pwa/sw.js');
const ICON_SRC = resolve(STUDIO, 'tessel-pwa/public/icons/icon.svg');
const OUT_DIR = resolve(STUDIO, 'tessel-pwa/dist');

const BASE = '/tessel/';
const MANIFEST = {
  name: 'Tessel VS Studio',
  short_name: 'Tessel VS',
  description: 'Visual form editor for Tessel documents',
  theme_color: '#1e1e1e',
  background_color: '#1e1e1e',
  display: 'standalone',
  scope: BASE,
  start_url: BASE,
  icons: [
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
  ],
};

const escScript = (s) => s.replace(/<\/script>/gi, '<\\/script>');
const escStyle = (s) => s.replace(/<\/style>/gi, '<\\/style>');

/** Same shell derivation as the single-file build: drop the <link> + <script src> tags. */
function deriveShell() {
  return readFileSync(SHELL_SRC, 'utf8')
    .replace(/^[ \t]*<link rel="stylesheet" href="\.\/styles\/[^"]+">[ \t]*\r?\n/gim, '')
    .replace(/^[ \t]*<script src="\.\.\/\.\.\/dist\/tessel\.bundle\.js"><\/script>[ \t]*\r?\n/gim, '')
    .replace(/^[ \t]*<script type="module" src="\.\/main\.js"><\/script>[ \t]*\r?\n/gim, '');
}

/** Bundle the app (CSS rerouted via build-entry.js) into one inlined index.html. */
async function buildAppHtml() {
  const result = await build({
    entryPoints: [ENTRY],
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    charset: 'utf8',
    legalComments: 'none',
    write: false,
    outdir: resolve(STUDIO, '.build'),
  });
  let js = '';
  let css = '';
  for (const f of result.outputFiles) {
    if (f.path.endsWith('.js')) js = f.text;
    else if (f.path.endsWith('.css')) css = f.text;
  }
  const legacyBundle = existsSync(BUNDLE) ? readFileSync(BUNDLE, 'utf8') : '';

  let html = deriveShell();
  // PWA head additions: manifest link + theme color.
  const head = `<link rel="manifest" href="manifest.webmanifest">\n` +
    `<link rel="icon" href="icons/icon.svg">\n` +
    `<meta name="theme-color" content="${MANIFEST.theme_color}">\n`;
  if (css) html = html.replace('</head>', `${head}<style>${escStyle(css)}</style>\n</head>`);
  else html = html.replace('</head>', `${head}</head>`);

  // SW registration (only fires in a secure context — https or localhost).
  const register =
    `<script>if('serviceWorker' in navigator){addEventListener('load',function(){` +
    `navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('SW registration failed',e)})})}</script>`;
  const scripts =
    (legacyBundle ? `<script>${escScript(legacyBundle)}</script>\n` : '') +
    `<script type="module">${escScript(js)}</script>\n` +
    register + '\n';
  html = html.replace('</body>', `${scripts}</body>`);
  return html;
}

/** esbuild-bundle the service worker, injecting the build's content hash as its version. */
async function buildServiceWorker(version) {
  const result = await build({
    entryPoints: [SW_SRC],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2022',
    charset: 'utf8',
    legalComments: 'none',
    write: false,
    define: { __SW_VERSION__: JSON.stringify(version) },
  });
  return result.outputFiles[0].text;
}

// --- run ---------------------------------------------------------------------
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(join(OUT_DIR, 'icons'), { recursive: true });

const indexHtml = await buildAppHtml();
const version = createHash('sha256').update(indexHtml).digest('hex').slice(0, 12);
const sw = await buildServiceWorker(version);

writeFileSync(join(OUT_DIR, 'index.html'), indexHtml);
writeFileSync(join(OUT_DIR, 'sw.js'), sw);
writeFileSync(join(OUT_DIR, 'manifest.webmanifest'), JSON.stringify(MANIFEST, null, 2));
if (existsSync(ICON_SRC)) copyFileSync(ICON_SRC, join(OUT_DIR, 'icons/icon.svg'));

console.log(`PWA built → studio/tessel-pwa/dist/ (index.html ${Math.round(Buffer.byteLength(indexHtml) / 1024)} KB, sw v${version})`);
