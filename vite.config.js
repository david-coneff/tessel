import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, 'studio/src'),
  build: {
    outDir: path.resolve(__dirname, 'studio'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'studio/src/tessel-vs.html'),
    },
  },
  plugins: [viteSingleFile()],
})
