import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Move the HTML from the nested mirror path to dist/index.html
function fixPwaOutputPath() {
  return {
    name: 'fix-pwa-output-path',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'studio/tessel-pwa/dist')
      const nested = path.join(outDir, 'studio/src/tessel-vs.html')
      const dest   = path.join(outDir, 'index.html')
      if (fs.existsSync(nested)) {
        fs.renameSync(nested, dest)
        // Clean up empty nested dirs
        try { fs.rmSync(path.join(outDir, 'studio'), { recursive: true, force: true }) } catch(e) {}
      }
    },
  }
}

// Copy the pre-built tessel.bundle.js into the PWA public dir so it is
// served as a cacheable asset, and rewrite the src reference in the HTML
// to match.  The singlefile build inlines this script; the PWA build
// cannot use vite-plugin-singlefile (it needs separate cacheable files).
function tesselBundleAsset() {
  return {
    name: 'tessel-bundle-asset',
    buildStart() {
      const src  = path.resolve(__dirname, 'dist/tessel.bundle.js')
      const dest = path.resolve(__dirname, 'studio/tessel-pwa/public/tessel.bundle.js')
      if (fs.existsSync(src)) fs.copyFileSync(src, dest)
    },
    transformIndexHtml(html) {
      return html.replace(
        /src="[^"]*dist\/tessel\.bundle\.js"/,
        'src="tessel.bundle.js"'
      )
    },
  }
}

export default defineConfig({
  base: '/tessel/',
  build: {
    target:      'es2022',
    outDir:      path.resolve(__dirname, 'studio/tessel-pwa/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'studio/src/tessel-vs.html'),
    },
  },
  publicDir: path.resolve(__dirname, 'studio/tessel-pwa/public'),
  plugins: [
    tesselBundleAsset(),
    fixPwaOutputPath(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
      includeAssets: ['icons/icon.svg', 'tessel.bundle.js'],
      manifest: {
        name:             'Tessel VS Studio',
        short_name:       'Tessel VS',
        description:      'Visual form editor for Tessel documents',
        theme_color:      '#1e1e1e',
        background_color: '#1e1e1e',
        display:          'standalone',
        scope:            '/tessel/',
        start_url:        '/tessel/',
        icons: [
          {
            src:     'icons/icon.svg',
            sizes:   'any',
            type:    'image/svg+xml',
            purpose: 'any',
          },
          {
            src:     'icons/icon.svg',
            sizes:   'any',
            type:    'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
