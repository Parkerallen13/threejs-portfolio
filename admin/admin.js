import { TOKENS, FONT_PAIRS } from './presets.js'

// The local admin screen (dev server only). Talks to admin/plugin.js; every change is written to
// the repo on this computer, and pushing to GitHub publishes it.

const app = document.querySelector('#admin')
const next = new URLSearchParams(location.search).get('next')
const TONES = ['teal', 'tomato', 'mustard']

async function api(path, body) {
  const response = await fetch(`/__admin/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'Something went wrong'), { status: response.status })
  return result
}

const esc = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const plain = (html) => { const el = document.createElement('div'); el.innerHTML = html ?? ''; return el.textContent }
const pad = (n) => String(n).padStart(2, '0')

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

let toastTimer
function toast(message, tone = 'ok') {
  const el = document.querySelector('[data-toast]')
  el.textContent = message
  el.dataset.tone = tone
  el.classList.add('is-shown')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('is-shown'), 3000)
}

// Runs an admin action, reports how it went, and redraws with fresh data
async function act(work, success) {
  try {
    await work()
    if (success) toast(success)
    await refresh()
  } catch (error) {
    if (error.status === 401) return boot()
    toast(error.message, 'error')
  }
}

// ---------- Login ----------

function renderLogin(message = '') {
  app.innerHTML = `
    <form class="login" data-login>
      <h1>Portfolio admin</h1>
      <p>Only on this computer: the live site has no admin.</p>
      <label>Username <input name="user" autocomplete="username" required /></label>
      <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
      ${message ? `<p class="login__error" role="alert">${esc(message)}</p>` : ''}
      <button type="submit">Log in</button>
    </form>`
  app.querySelector('[data-login]').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await api('login', { user: form.get('user'), password: form.get('password') })
      boot()
    } catch (error) {
      renderLogin(error.message)
    }
  })
  app.querySelector('input').focus()
}

function renderSetup() {
  app.innerHTML = `
    <section class="login">
      <h1>Set an admin password</h1>
      <p>Run this in the project folder, then restart <code>npm run dev</code>:</p>
      <pre><code>node admin/set-password.mjs &lt;username&gt; &lt;password&gt;</code></pre>
    </section>`
}

// ---------- Sections ----------

const editLinks = (data) => `
  <section class="panel" id="edit">
    <h2>Edit text and photos</h2>
    <p class="hint">Opens the page in edit mode: click any outlined text to rewrite it, click a dashed photo to replace it, and × marketing posts you want gone. Everything saves as you go.</p>
    <div class="link-grid">
      <a class="button" href="/?edit" target="_blank">Homepage</a>
      <a class="button" href="/about.html?edit" target="_blank">About me</a>
      ${data.projects.order.map((slug) => `<a class="button button--quiet" href="/projects/${slug}.html?edit" target="_blank">${esc(data.projects.projects[slug].title)}</a>`).join('')}
    </div>
  </section>`

const swatchRow = (colors) => `<span class="swatches">${Object.values(colors).map((hex) => `<i style="background:${hex}"></i>`).join('')}</span>`
const sameColors = (a, b) => JSON.stringify([a.dark, a.light, a.tones]) === JSON.stringify([b.dark, b.light, b.tones])

const themeCard = (theme, i, current) => `
  <article class="preset${sameColors(theme, current) ? ' is-current' : ''}">
    <button type="button" class="preset__delete" data-delete-theme="${i}" aria-label="Delete the ${esc(theme.name)} theme">×</button>
    <div class="preset__sample" style="background:${theme.dark.bg};color:${theme.dark.fg}">
      <strong>Aa</strong>${swatchRow({ a: theme.dark.tomato, b: theme.dark.mustard, c: theme.dark.teal })}
    </div>
    <div class="preset__sample" style="background:${theme.light.bg};color:${theme.light.fg}">
      <strong>Aa</strong>${swatchRow({ a: theme.light.tomato, b: theme.light.mustard, c: theme.light.teal })}
    </div>
    <h3>${esc(theme.name)}${sameColors(theme, current) ? ' <span class="tag">In use</span>' : ''}</h3>
    ${theme.note ? `<p>${esc(theme.note)}</p>` : ''}
    <button type="button" class="button" data-theme="${i}">${sameColors(theme, current) ? 'Re-apply' : 'Use this theme'}</button>
  </article>`

const themePanel = (theme, themes) => `
  <section class="panel" id="theme">
    <h2>Theme</h2>
    <p class="hint">Pick a theme, shuffle a random one, or fine-tune any color below. This admin page, the preview, and any open site tabs switch to it when you save.</p>
    <div class="shuffle">
      <button type="button" class="button" data-shuffle>🎲 Shuffle a random theme</button>
      ${themes.some((saved) => sameColors(saved, theme)) ? '' : `
        <span>Using <strong>${esc(theme.name)}</strong>, which isn’t in your saved themes.</span>
        <button type="button" class="button button--quiet" data-keep-theme>Keep it</button>`}
    </div>
    <div class="presets">${themes.map((saved, i) => themeCard(saved, i, theme)).join('')}</div>

    <form class="custom-theme" data-custom-theme>
      <h3>Fine-tune: ${esc(theme.name)}</h3>
      ${Object.entries(TOKENS).map(([group, tokens]) => `
        <fieldset>
          <legend>${group === 'tones' ? 'Project fills' : `${group[0].toUpperCase()}${group.slice(1)} mode`}</legend>
          ${tokens.map((token) => `
            <label><input type="color" name="${group}.${token}" value="${theme[group]?.[token] ?? '#000000'}" /> ${token}</label>`).join('')}
        </fieldset>`).join('')}
      <label class="check"><input type="checkbox" name="dots"${theme.dots === false ? '' : ' checked'} /> Halftone dots in the background</label>
      <div class="custom-theme__actions">
        <button type="submit" class="button">Save these colors</button>
        <button type="submit" class="button button--quiet" data-save-as-new>Save as a new theme…</button>
      </div>
    </form>

    <h3 class="fonts-title">Fonts</h3>
    <div class="fonts">
      ${FONT_PAIRS.map((pair, i) => `
        <article class="font-pair${pair.name === theme.fonts?.name ? ' is-current' : ''}">
          <p class="font-pair__heading" style="font-family:${pair.heading}">Parker Allen</p>
          <p class="font-pair__accent" style="font-family:${pair.accent}"><em>I research, iterate, and build.</em></p>
          <p class="font-pair__body" style="font-family:${pair.body}">Body text for case studies and descriptions.</p>
          <h4>${esc(pair.name)}${pair.name === theme.fonts?.name ? ' <span class="tag">In use</span>' : ''}</h4>
          <p class="font-pair__note">${esc(pair.note)}</p>
          <button type="button" class="button${pair.name === theme.fonts?.name ? ' button--quiet' : ''}" data-fonts="${i}">${pair.name === theme.fonts?.name ? 'In use' : 'Use these fonts'}</button>
        </article>`).join('')}
    </div>

    <iframe class="theme-preview" src="/" title="Homepage preview"></iframe>
  </section>`

// ---------- Random themes ----------

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const between = (min, max) => min + Math.random() * (max - min)
function hex(h, s, l) {
  const k = (n) => (n + h / 30) % 12
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n) => Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
  return `#${[channel(0), channel(8), channel(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// A random but legible theme: one base hue for paper and ink, three accent hues from a classic
// harmony, darker accents in light mode so text keeps its contrast, and a random font pairing.
function randomTheme() {
  const hue = between(0, 360)
  const [a, b, c] = pick([[0, 40, 200], [0, 120, 240], [0, 150, 210], [0, 30, 180], [15, 60, 300]])
    .map((offset) => (hue + offset + between(-12, 12) + 360) % 360)
  const paper = between(10, 40)
  return {
    name: `${pick(['Faded', 'Dusty', 'Atomic', 'Sunlit', 'Midnight', 'Postmarked', 'Velvet', 'Copper', 'Neon', 'Linen'])} ${pick(['Ticket', 'Stamp', 'Badge', 'Passport', 'Postcard', 'Matchbook', 'Orbit', 'Diner', 'Transfer', 'Poster'])}`,
    note: 'Shuffled at random.',
    dots: Math.random() > 0.4,
    dark: { bg: hex(hue, paper * 0.6, between(7, 12)), fg: hex(hue, paper, 92), muted: hex(hue, 12, 68), tomato: hex(a, 72, 64), mustard: hex(b, 74, 64), teal: hex(c, 48, 64) },
    light: { bg: hex(hue, paper, between(90, 94)), fg: hex(hue, 25, 12), muted: hex(hue, 12, 36), tomato: hex(a, 62, 38), mustard: hex(b, 70, 30), teal: hex(c, 55, 30) },
    tones: { tomato: hex(a, 72, 62), mustard: hex(b, 78, 62), teal: hex(c, 50, 58) },
    fonts: pick(FONT_PAIRS),
  }
}

const projectsPanel = (data) => `
  <section class="panel" id="projects">
    <h2>Projects</h2>
    <p class="hint">The order here is the order on the homepage. Use the arrows to move a project up or down.</p>
    <ol class="project-list">
      ${data.projects.order.map((slug, i) => {
        const project = data.projects.projects[slug]
        return `
          <li data-slug="${slug}">
            <span class="project-list__num">${pad(i + 1)}</span>
            <div class="project-list__name"><strong>${esc(project.title)}</strong><span>${esc(plain(project.kicker))}${project.draft ? ' · draft' : ''}</span></div>
            <select data-category aria-label="Section for ${esc(project.title)}">
              ${[['ux', 'UX'], ['typography', 'Typography']].map(([value, label]) => `<option value="${value}"${(project.category ?? 'ux') === value ? ' selected' : ''}>${label}</option>`).join('')}
            </select>
            <label class="check"><input type="checkbox" data-sticker${project.sticker ? ' checked' : ''} /> Coming soon</label>
            <button type="button" class="eye${project.draft ? ' is-draft' : ''}" data-draft aria-pressed="${!project.draft}" title="${project.draft ? 'Draft: hidden from the site. Click to post.' : 'Posted: on the site. Click to make it a draft.'}">
              ${project.draft
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-2.6 3.3M6.4 7.6A15.8 15.8 0 0 0 3 12s3.5 6 9 6a9.4 9.4 0 0 0 4.3-1M9.9 10a3 3 0 0 0 4.1 4.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Draft'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg> Posted'}
            </button>
            <a class="button button--quiet" href="/projects/${slug}.html?edit" target="_blank">Edit page</a>
            <span class="project-list__move">
              <button type="button" data-move="-1" aria-label="Move ${esc(project.title)} up"${i === 0 ? ' disabled' : ''}>↑</button>
              <button type="button" data-move="1" aria-label="Move ${esc(project.title)} down"${i === data.projects.order.length - 1 ? ' disabled' : ''}>↓</button>
            </span>
            <button type="button" class="button button--danger" data-delete>Delete</button>
          </li>`
      }).join('')}
    </ol>

    <details class="add-project">
      <summary>+ Add a project</summary>
      <form data-add-project>
        <label>Title <input name="title" required placeholder="My new project" /></label>
        <label>Kind of project <input name="kicker" placeholder="Web App · UX + Front-end" /></label>
        <label>One-line tagline <input name="tagline" placeholder="What it is, in a sentence" /></label>
        <label>TL;DR <textarea name="tldr" rows="3" placeholder="Two or three sentences for the top of the page"></textarea></label>
        <label>Section
          <select name="category"><option value="ux">UX</option><option value="typography">Typography</option></select>
        </label>
        <label>Color
          <select name="tone">${TONES.map((tone) => `<option value="${tone}">${tone}</option>`).join('')}</select>
        </label>
        <label>Cover image (optional) <input name="image" type="file" accept="image/*" /></label>
        <label class="check"><input type="checkbox" name="sticker" /> Coming soon</label>
        <button type="submit" class="button">Add project</button>
      </form>
    </details>
  </section>`

const postsPanel = (data) => `
  <section class="panel" id="posts">
    <h2>Marketing posts</h2>
    <p class="hint">× hides a post from the homepage (the file moves to a hidden folder, nothing is deleted). Restore brings it back.</p>
    ${Object.keys(data.posts).map((folder) => `
      <h3>${folder === 'ktp' ? 'Kappa Theta Pi' : 'Hyperloop'}</h3>
      <ul class="thumbs">
        ${data.posts[folder].map((file) => `
          <li>
            <img src="/src/assets/experience/${folder}/${file}" alt="${esc(file)}" loading="lazy" />
            <button type="button" class="thumbs__x" data-hide="${folder}/${file}" aria-label="Hide ${esc(file)}">×</button>
          </li>`).join('')}
      </ul>
      <label class="upload">Add posts <input type="file" accept="image/*" multiple data-add-posts="${folder}" /></label>
      ${data.hidden[folder].length ? `
        <details class="hidden-posts">
          <summary>Hidden (${data.hidden[folder].length})</summary>
          <ul class="thumbs thumbs--hidden">
            ${data.hidden[folder].map((file) => `
              <li>
                <img src="/src/assets/experience/_hidden/${folder}/${file}" alt="${esc(file)}" loading="lazy" />
                <button type="button" class="button button--quiet" data-restore="${folder}/${file}">Restore</button>
              </li>`).join('')}
          </ul>
        </details>` : ''}`).join('')}
  </section>`

// ---------- Page ----------

let data

function renderAdmin() {
  const openDetails = [...app.querySelectorAll('details[open]')].map((el) => el.className)
  const scroll = scrollY
  app.innerHTML = `
    <header class="admin-top">
      <div>
        <h1>Portfolio admin</h1>
        <p>Saves straight to the project files on this computer. Push to GitHub to publish.</p>
      </div>
      <nav><a href="#edit">Edit</a><a href="#theme">Theme</a><a href="#projects">Projects</a><a href="#posts">Posts</a><a href="/" target="_blank">View site ↗</a></nav>
      <button type="button" class="button button--quiet" data-logout>Log out</button>
    </header>
    ${editLinks(data)}
    ${themePanel(data.theme, data.themes)}
    ${projectsPanel(data)}
    ${postsPanel(data)}
    <p class="toast" data-toast role="status"></p>`
  openDetails.forEach((name) => app.querySelector(`details.${name.split(' ')[0]}`)?.setAttribute('open', ''))
  scrollTo(0, scroll)
}

// The admin wears the active theme (light-mode colors and the font pairing) so you can see it
function dressAdmin(theme) {
  const style = document.documentElement.style
  const light = theme.light ?? {}
  if (light.bg) {
    style.setProperty('--paper', light.bg)
    style.setProperty('--ink', light.fg)
    style.setProperty('--muted', light.muted)
    style.setProperty('--accent', light.tomato)
    style.setProperty('--card', `color-mix(in srgb, #fff 45%, ${light.bg})`)
    style.setProperty('--line', `color-mix(in srgb, ${light.fg} 18%, ${light.bg})`)
  }
  if (theme.fonts) {
    style.setProperty('--font-heading', theme.fonts.heading)
    style.setProperty('--font-body', theme.fonts.body)
  }
}

// Every pairing's web fonts, so the font previews render in their real faces
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = `https://fonts.googleapis.com/css2?${FONT_PAIRS.filter((pair) => pair.google).map((pair) => pair.google).join('&')}&display=swap`
document.head.append(fontLink)

async function refresh() {
  data = await api('data')
  dressAdmin(data.theme)
  renderAdmin()
}

const reloadPreview = () => setTimeout(() => app.querySelector('.theme-preview')?.contentWindow?.location.reload(), 400)

app.addEventListener('click', (event) => {
  const el = event.target.closest('button')
  if (!el) return

  if (el.matches('[data-logout]')) return api('logout', {}).then(boot)

  if (el.matches('[data-theme]')) {
    const { note, fonts, ...colors } = data.themes[Number(el.dataset.theme)]
    // A saved theme sets the colors; keep the current fonts unless the theme brings its own
    const theme = { ...colors, fonts: fonts ?? data.theme.fonts }
    return act(() => api('save', { file: 'theme', path: '', value: theme }), `Theme set to ${theme.name}`).then(reloadPreview)
  }
  if (el.matches('[data-delete-theme]')) {
    const index = Number(el.dataset.deleteTheme)
    if (!confirm(`Delete the “${data.themes[index].name}” theme from your list?`)) return
    const themes = data.themes.filter((_, i) => i !== index)
    return act(() => api('save', { file: 'themes', path: 'themes', value: themes }), 'Theme deleted')
  }
  if (el.matches('[data-shuffle]')) {
    const { note, ...theme } = randomTheme()
    return act(() => api('save', { file: 'theme', path: '', value: theme }), `Shuffled: ${theme.name}`).then(reloadPreview)
  }
  if (el.matches('[data-keep-theme]')) {
    const theme = { ...data.theme, note: data.theme.note ?? 'Saved from the admin.' }
    return act(() => api('save', { file: 'themes', path: 'themes', value: [...data.themes, theme] }), `${theme.name} saved to your themes`)
  }
  if (el.matches('[data-fonts]')) {
    const { note, ...fonts } = FONT_PAIRS[Number(el.dataset.fonts)]
    return act(() => api('save', { file: 'theme', path: 'fonts', value: fonts }), `Fonts set to ${fonts.name}`).then(reloadPreview)
  }

  const row = el.closest('[data-slug]')
  if (row && el.matches('[data-move]')) {
    const order = [...data.projects.order]
    const from = order.indexOf(row.dataset.slug)
    const to = from + Number(el.dataset.move)
    ;[order[from], order[to]] = [order[to], order[from]]
    return act(() => api('save', { file: 'projects', path: 'order', value: order }), 'Order saved')
  }
  if (row && el.matches('[data-draft]')) {
    const project = data.projects.projects[row.dataset.slug]
    return act(() => api('save', { file: 'projects', path: `projects.${row.dataset.slug}.draft`, value: project.draft ? null : true }), project.draft ? `${project.title} is posted` : `${project.title} is now a draft`)
  }
  if (row && el.matches('[data-delete]')) {
    const { title } = data.projects.projects[row.dataset.slug]
    if (!confirm(`Delete “${title}”? This removes its page and content.`)) return
    return act(() => api('projects/delete', { slug: row.dataset.slug }), `Deleted ${title}`)
  }

  if (el.matches('[data-hide]')) {
    const [folder, file] = el.dataset.hide.split('/')
    return act(() => api('posts/hide', { folder, file }), 'Post hidden')
  }
  if (el.matches('[data-restore]')) {
    const [folder, file] = el.dataset.restore.split('/')
    return act(() => api('posts/restore', { folder, file }), 'Post restored')
  }
})

app.addEventListener('change', (event) => {
  const el = event.target
  const row = el.closest('[data-slug]')
  if (row && el.matches('[data-category]')) {
    return act(() => api('save', { file: 'projects', path: `projects.${row.dataset.slug}.category`, value: el.value }), `Moved to ${el.selectedOptions[0].textContent}`)
  }
  if (row && el.matches('[data-sticker]')) {
    return act(() => api('save', { file: 'projects', path: `projects.${row.dataset.slug}.sticker`, value: el.checked ? 'Coming soon' : null }), el.checked ? 'Sticker on' : 'Sticker off')
  }
  if (el.matches('[data-add-posts]')) {
    const folder = el.dataset.addPosts
    const files = [...el.files]
    return act(async () => {
      let n = data.posts[folder].length + data.hidden[folder].length
      for (const file of files) {
        n += 1
        await api('upload', { folder: `experience/${folder}`, name: `${pad(n)}-${file.name}`, data: await readAsDataUrl(file) })
      }
    }, `${files.length} post${files.length === 1 ? '' : 's'} added`)
  }
})

app.addEventListener('submit', (event) => {
  event.preventDefault()
  const form = event.target
  const values = new FormData(form)

  if (form.matches('[data-custom-theme]')) {
    const theme = { name: data.theme.name, dots: values.has('dots'), fonts: data.theme.fonts }
    for (const [group, tokens] of Object.entries(TOKENS)) {
      theme[group] = Object.fromEntries(tokens.map((token) => [token, values.get(`${group}.${token}`)]))
    }
    if (event.submitter?.matches('[data-save-as-new]')) {
      const name = prompt('Name this theme', `${theme.name.replace(/ \(custom\)$/, '')} (custom)`)
      if (!name) return
      theme.name = name
      return act(async () => {
        await api('save', { file: 'theme', path: '', value: theme })
        await api('save', { file: 'themes', path: 'themes', value: [...data.themes, { ...theme, note: 'Made in the admin.' }] })
      }, `${name} saved and in use`).then(reloadPreview)
    }
    if (!data.themes.some((saved) => sameColors(saved, theme))) {
      theme.name = theme.name.endsWith('(custom)') ? theme.name : `${theme.name} (custom)`
    }
    return act(() => api('save', { file: 'theme', path: '', value: theme }), 'Colors saved').then(reloadPreview)
  }

  if (form.matches('[data-add-project]')) {
    return act(async () => {
      const cover = values.get('image')
      const image = cover?.size
        ? (await api('upload', { folder: 'uploads', name: cover.name, data: await readAsDataUrl(cover) })).path
        : undefined
      const { slug } = await api('projects/create', {
        title: values.get('title'),
        kicker: values.get('kicker'),
        tagline: values.get('tagline'),
        tldr: values.get('tldr'),
        tone: values.get('tone'),
        category: values.get('category'),
        sticker: values.has('sticker'),
        image,
      })
      window.open(`/projects/${slug}.html?edit`, '_blank')
    }, 'Project added. Its page opened in a new tab, ready to edit.')
  }
})

async function boot() {
  try {
    const session = await api('session')
    if (!session.configured) return renderSetup()
    if (!session.loggedIn) return renderLogin()
    if (next) {
      location.href = next
      return
    }
    await refresh()
  } catch (error) {
    app.innerHTML = `<p class="login">The admin needs the dev server: run <code>npm run dev</code>. (${esc(error.message)})</p>`
  }
}

boot()
