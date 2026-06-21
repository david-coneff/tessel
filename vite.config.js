import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// After vite-plugin-singlefile writes the HTML, move it from the nested
// mirror path (studio/studio/src/tessel-vs.html) to the intended location.
function fixOutputPath() {
  return {
    name: 'fix-output-path',
    closeBundle() {
      const src = path.resolve(__dirname, 'studio/studio/src/tessel-vs.html')
      const dest = path.resolve(__dirname, 'studio/tessel-vs.html')
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest)
        fs.rmSync(path.resolve(__dirname, 'studio/studio'), { recursive: true, force: true })
      }
    },
  }
}

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: path.resolve(__dirname, 'studio'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'studio/src/tessel-vs.html'),
    },
  },
  plugins: [viteSingleFile(), fixOutputPath()],
})
