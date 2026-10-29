import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const projects = ['ouro', 'hyperdrive', 'ux-audit', 'aldente', 'brewing', 'typeface']

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repo at /threejs-portfolio/
  base: command === 'build' ? '/threejs-portfolio/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        ...Object.fromEntries(projects.map((p) => [p, resolve(root, `projects/${p}.html`)])),
      },
    },
  },
}))
