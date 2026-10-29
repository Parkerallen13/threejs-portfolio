import { defineConfig, loadEnv } from 'vite'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminPlugin } from './admin/plugin.js'

const root = fileURLToPath(new URL('.', import.meta.url))
// Every projects/<slug>.html is a page, including ones added from the local admin
const projects = readdirSync(resolve(root, 'projects'))
  .filter((file) => file.endsWith('.html'))
  .map((file) => file.slice(0, -'.html'.length))

export default defineConfig(({ command, mode }) => {
  // The admin login lives in .env.local (see admin/set-password.mjs); only the dev server reads it
  const env = loadEnv(mode, root, 'ADMIN_')
  return {
    // GitHub Pages serves this repo at /threejs-portfolio/
    base: command === 'build' ? '/threejs-portfolio/' : '/',
    plugins: [adminPlugin({ user: env.ADMIN_USER, passwordHash: env.ADMIN_PASSWORD_HASH })],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          about: resolve(root, 'about.html'),
          ...Object.fromEntries(projects.map((p) => [p, resolve(root, `projects/${p}.html`)])),
        },
      },
    },
  }
})
