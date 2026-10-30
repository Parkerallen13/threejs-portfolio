// The portfolio's local admin: a dev-server-only API (`npm run dev`) for editing the content in
// src/data/*.json, uploading images into src/assets, hiding or restoring marketing posts, and adding
// project pages. It never ships: `apply: 'serve'` keeps it out of `vite build`, so the deployed site
// has no admin at all. Changes land in the repo like any other edit; pushing publishes them.
import { readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync, existsSync, rmSync, utimesSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { execFile } from 'node:child_process'

const DATA_FILES = {
  site: 'src/data/site.json',
  projects: 'src/data/projects.json',
  theme: 'src/data/theme.json',
  themes: 'admin/themes.json',
}
const POST_FOLDERS = ['hyperloop', 'ktp']
const UPLOAD_FOLDERS = ['uploads', 'experience/hyperloop', 'experience/ktp', 'drawings', 'drawings/cutouts']
const IMAGE_FILE = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|gif|svg)$/i
const COOKIE = 'portfolio_admin'
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt:${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}

function verifyPassword(password, stored) {
  const [scheme, salt, hash] = (stored ?? '').split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  return timingSafeEqual(scryptSync(String(password), salt, expected.length), expected)
}

const slugify = (text) => String(text).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

function setAt(target, path, value) {
  const keys = path.split('.')
  if (keys.some((key) => FORBIDDEN_KEYS.has(key))) throw new Error('Invalid path')
  const last = keys.pop()
  const parent = keys.reduce((node, key) => (node == null ? node : node[key]), target)
  if (parent == null || typeof parent !== 'object') throw new Error(`Nothing at ${keys.join('.')}`)
  if (value === null) delete parent[last]
  else parent[last] = value
}

function projectPage(slug) {
  return `<!doctype html>
<html lang="en" data-mode="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Parker Allen — Design</title>
    <link rel="icon" href="%BASE_URL%favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Parker Allen" />
    <meta property="og:image" content="https://parkerallen13.github.io/threejs-portfolio/og/home.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body data-project="${slug}">
    <div id="app"></div>
    <script type="module" src="/src/project.js"></script>
  </body>
</html>
`
}

async function readBody(req, limit = 30 * 1024 * 1024) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('Upload too large'), { status: 413 })
    chunks.push(chunk)
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

export function adminPlugin({ user, passwordHash } = {}) {
  const sessions = new Set()
  const quietWrites = new Set()
  let root = process.cwd()

  return {
    name: 'portfolio-admin',
    apply: 'serve',
    configResolved(config) { root = config.root },

    // Inline edits save while you type on the page; skip the reload those writes would trigger.
    // The changed module is still invalidated, so the next page load shows the new text.
    handleHotUpdate({ file }) {
      if (quietWrites.delete(file)) return []
    },

    configureServer(server) {
      const at = (...parts) => resolve(root, ...parts)
      const readJson = (name) => JSON.parse(readFileSync(at(DATA_FILES[name]), 'utf8'))
      const writeJson = (name, data, quiet) => {
        const file = at(DATA_FILES[name])
        if (quiet) quietWrites.add(file)
        writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
      }
      // Vite can miss files added outside it, which leaves the folder image lists in src/main.js
      // (posts, drawings) stale; touching it re-runs those globs
      const refreshImageLists = () => {
        const now = new Date()
        utimesSync(at('src/main.js'), now, now)
      }

      // Undo history: every change records what it replaced (file contents, or a file move), so
      // "Undo" can put it back. Kept in the gitignored .admin-history.json, newest last.
      const historyFile = at('.admin-history.json')
      let history = []
      try { history = JSON.parse(readFileSync(historyFile, 'utf8')) } catch { /* starts empty */ }
      const saveHistory = () => writeFileSync(historyFile, JSON.stringify(history.slice(-50)))
      const snapshot = (path) => ({ kind: 'write', path, before: existsSync(at(path)) ? readFileSync(at(path), 'utf8') : null })
      const remember = (label, steps) => {
        history = [...history, { label, steps }].slice(-50)
        saveHistory()
      }
      const lastChange = () => ({ count: history.length, last: history.at(-1)?.label ?? null })
      const describe = (body) => {
        if (body.label) return body.label
        if (!body.path) return body.file === 'theme' ? 'Change the theme' : `Update ${body.file}`
        const words = body.path.split('.').filter((key) => Number.isNaN(Number(key)) && !['projects', 'sections', 'items'].includes(key))
        return `Edit ${words.slice(-2).join(' ')}`
      }
      const listImages = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE_FILE.test(f)).sort() : [])

      const routes = {
        'GET /session': ({ authed }) => ({ loggedIn: authed, configured: Boolean(user && passwordHash) }),

        'POST /login': ({ body, res }) => {
          if (!user || !passwordHash) throw Object.assign(new Error('No admin password set. Run: node admin/set-password.mjs'), { status: 503 })
          if (body.user !== user || !verifyPassword(body.password ?? '', passwordHash)) {
            throw Object.assign(new Error('Wrong username or password'), { status: 401 })
          }
          const token = randomBytes(24).toString('hex')
          sessions.add(token)
          res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict`)
          return { loggedIn: true }
        },

        'POST /logout': ({ token, res }) => {
          sessions.delete(token)
          res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`)
          return { loggedIn: false }
        },

        'GET /data': () => {
          const posts = {}
          const hidden = {}
          for (const folder of POST_FOLDERS) {
            posts[folder] = listImages(at('src/assets/experience', folder))
            hidden[folder] = listImages(at('src/assets/experience/_hidden', folder))
          }
          return { site: readJson('site'), projects: readJson('projects'), theme: readJson('theme'), themes: readJson('themes').themes, posts, hidden, history: lastChange() }
        },

        // { file, path, value } sets one field ("" replaces the whole file); `quiet` skips the reload
        'POST /save': ({ body }) => {
          if (!DATA_FILES[body.file]) throw new Error('Unknown file')
          remember(describe(body), [snapshot(DATA_FILES[body.file])])
          if (body.path) {
            const data = readJson(body.file)
            setAt(data, body.path, body.value)
            writeJson(body.file, data, body.quiet)
          } else {
            if (!body.value || typeof body.value !== 'object') throw new Error('Missing content')
            writeJson(body.file, body.value, body.quiet)
          }
          return { ok: true, history: lastChange() }
        },

        'GET /history': () => lastChange(),

        // Puts back whatever the most recent change replaced
        'POST /undo': () => {
          const entry = history.at(-1)
          if (!entry) throw new Error('Nothing to undo')
          for (const step of [...entry.steps].reverse()) {
            if (step.kind === 'write') {
              if (step.before === null) rmSync(at(step.path), { force: true })
              else writeFileSync(at(step.path), step.before)
            } else if (step.kind === 'move' && existsSync(at(step.to))) {
              mkdirSync(dirname(at(step.from)), { recursive: true })
              renameSync(at(step.to), at(step.from))
            }
          }
          history = history.slice(0, -1)
          saveHistory()
          refreshImageLists()
          return { undone: entry.label, ...lastChange() }
        },

        // { folder, name, data: "data:image/...;base64,..." } -> { path, url }
        'POST /upload': async ({ body }) => {
          if (!UPLOAD_FOLDERS.includes(body.folder)) throw new Error('Unknown folder')
          const match = /^data:image\/[\w.+-]+;base64,(.+)$/.exec(body.data ?? '')
          if (!match) throw new Error('Not an image')
          const ext = extname(body.name ?? '').toLowerCase() || '.png'
          const base = slugify(String(body.name ?? 'image').replace(/\.[^.]+$/, '')) || 'image'
          const dir = at('src/assets', body.folder)
          mkdirSync(dir, { recursive: true })
          let name = `${base}${ext}`
          for (let n = 2; existsSync(resolve(dir, name)); n++) name = `${base}-${n}${ext}`
          if (!IMAGE_FILE.test(name)) throw new Error('Unsupported file type')
          const file = resolve(dir, name)
          writeFileSync(file, Buffer.from(match[1], 'base64'))
          // Keep big photos web-sized (macOS `sips`; skipped quietly elsewhere)
          if (/\.(jpe?g|png)$/i.test(name)) {
            await new Promise((done) => execFile('sips', ['-Z', '2000', file], () => done()))
          }
          refreshImageLists()
          return { path: `assets/${body.folder}/${name}`, url: `/src/assets/${body.folder}/${name}` }
        },

        'POST /posts/hide': ({ body }) => movePost(body, 'experience', 'experience/_hidden'),
        'POST /posts/restore': ({ body }) => movePost(body, 'experience/_hidden', 'experience'),

        // { title, slug?, kicker, tagline, tldr, tone, category, image?, sticker? }
        'POST /projects/create': ({ body }) => {
          const slug = slugify(body.slug || body.title)
          if (!slug || !body.title) throw new Error('A project needs a title')
          const page = at('projects', `${slug}.html`)
          const data = readJson('projects')
          if (data.projects[slug] || existsSync(page)) throw new Error(`A project called "${slug}" already exists`)
          remember(`Add ${body.title}`, [snapshot(DATA_FILES.projects), snapshot(`projects/${slug}.html`)])
          // New projects start as drafts, so a half-written page never goes live by accident
          data.projects[slug] = {
            draft: true,
            title: body.title,
            kicker: body.kicker || 'Project',
            tone: ['teal', 'tomato', 'mustard'].includes(body.tone) ? body.tone : 'teal',
            category: body.category === 'typography' ? 'typography' : 'ux',
            tagline: body.tagline || '',
            tldr: body.tldr || 'Coming soon.',
            meta: [['Type', body.kicker || 'Project']],
            ...(body.image ? { image: { src: body.image, alt: body.title } } : {}),
            ...(body.sticker ? { sticker: 'Coming soon' } : {}),
            sections: [{ heading: 'About this project', body: '<p>Write about the project here: turn on edit mode on this page and click this text.</p>' }],
            links: [],
          }
          data.order.push(slug)
          writeFileSync(page, projectPage(slug))
          writeJson('projects', data)
          return { slug }
        },

        'POST /projects/delete': ({ body }) => {
          const data = readJson('projects')
          if (!data.projects[body.slug]) throw new Error('No such project')
          remember(`Delete ${data.projects[body.slug].title}`, [snapshot(DATA_FILES.projects), snapshot(`projects/${body.slug}.html`)])
          delete data.projects[body.slug]
          data.order = data.order.filter((id) => id !== body.slug)
          writeJson('projects', data)
          rmSync(at('projects', `${body.slug}.html`), { force: true })
          return { ok: true }
        },
      }

      function movePost({ folder, file }, from, to) {
        if (!POST_FOLDERS.includes(folder) || !IMAGE_FILE.test(file ?? '')) throw new Error('Unknown post')
        const source = at('src/assets', from, folder, file)
        if (!existsSync(source)) throw new Error('That post is not there anymore')
        const target = at('src/assets', to, folder, file)
        mkdirSync(dirname(target), { recursive: true })
        renameSync(source, target)
        remember(`${to.endsWith('_hidden') ? 'Hide' : 'Restore'} ${file}`, [{ kind: 'move', from: `src/assets/${from}/${folder}/${file}`, to: `src/assets/${to}/${folder}/${file}` }])
        refreshImageLists()
        return { ok: true }
      }

      // The admin page is served as-is, without Vite's live-reload client, so saving content
      // (which reloads open site tabs) never resets the form you're working in.
      server.middlewares.use((req, res, nextMiddleware) => {
        const path = req.url.split('?')[0]
        if (path === '/admin') {
          res.writeHead(302, { Location: '/admin/' })
          return res.end()
        }
        if (path !== '/admin/' && path !== '/admin/index.html') return nextMiddleware()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(readFileSync(at('admin/index.html')))
      })

      server.middlewares.use('/__admin', async (req, res) => {
        const send = (status, payload) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }
        // Only this site's own pages may call the API
        const origin = req.headers.origin
        if (origin && new URL(origin).host !== req.headers.host) return send(403, { error: 'Cross-site request' })

        const token = /(?:^|;\s*)portfolio_admin=([a-f0-9]+)/.exec(req.headers.cookie ?? '')?.[1]
        const authed = Boolean(token && sessions.has(token))
        const route = routes[`${req.method} ${req.url.split('?')[0]}`]
        if (!route) return send(404, { error: 'Not found' })
        const open = req.url.startsWith('/session') || req.url.startsWith('/login')
        if (!open && !authed) return send(401, { error: 'Please log in' })

        try {
          const body = req.method === 'POST' ? await readBody(req) : {}
          send(200, await route({ body, req, res, token, authed }))
        } catch (error) {
          send(error.status ?? 400, { error: error.message })
        }
      })
    },
  }
}
