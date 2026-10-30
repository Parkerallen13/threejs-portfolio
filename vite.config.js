import { defineConfig, loadEnv } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminPlugin } from './admin/plugin.js'
import { contentAssets } from './plugins/content-assets.js'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ command, mode }) => {
  // Every projects/<slug>.html is a page, including ones added from the local admin, except
  // drafts, which stay on this computer until they're posted
  const { projects: content } = JSON.parse(readFileSync(resolve(root, 'src/data/projects.json'), 'utf8'))
  const projects = readdirSync(resolve(root, 'projects'))
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.slice(0, -'.html'.length))
    .filter((slug) => !content[slug]?.draft)

  // The admin login lives in .env.local (see admin/set-password.mjs); only the dev server reads it
  const env = loadEnv(mode, root, 'ADMIN_')
  return {
    // GitHub Pages serves this repo at /threejs-portfolio/
    base: command === 'build' ? '/threejs-portfolio/' : '/',
    plugins: [contentAssets(), adminPlugin({ user: env.ADMIN_USER, passwordHash: env.ADMIN_PASSWORD_HASH })],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          about: resolve(root, 'about.html'),
          404: resolve(root, '404.html'),
          ...Object.fromEntries(projects.map((p) => [p, resolve(root, `projects/${p}.html`)])),
        },
      },
    },
  }
})
