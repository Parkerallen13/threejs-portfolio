import './style.css'
import { World } from './world/World.js'
import { TOUR } from './world/tour.js'
import { HOTSPOTS, ACTION_LABELS, INDEX_ORDER, CHAPTERS, LINES } from './content.js'

// Drop images into src/assets/drawings and they're hung around the room in filename order
const drawings = Object.entries(
  import.meta.glob('./assets/drawings/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const MODE_KEY = 'portfolio-mode'
const root = document.documentElement
const modeButton = document.querySelector('[data-mode-toggle]')
const panel = document.querySelector('#panel')
const panelBody = document.querySelector('#panel-body')
const chaptersEl = document.querySelector('#chapters')
const progressEl = document.querySelector('.progress')

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

let mode = read(MODE_KEY) ?? 'dark'

function renderMode() {
  root.dataset.mode = mode
  modeButton.textContent = mode === 'dark' ? '☾' : '☀'
  modeButton.setAttribute('aria-label', mode === 'dark' ? 'Turn the lights on' : 'Turn the lights off')
}

function toggleMode() {
  mode = mode === 'dark' ? 'light' : 'dark'
  write(MODE_KEY, mode)
  renderMode()
  world.setMode(mode)
}

// ---------- Panels ----------

function openPanel(html) {
  panelBody.innerHTML = html
  if (!panel.open) panel.showModal()
  world.paused = true
}

function openHotspot(id) {
  const item = HOTSPOTS[id]
  if (!item) return
  const links = item.links
    .map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label} &rarr;</a>`)
    .join('')
  const gallery =
    id === 'drawings' && drawings.length
      ? `<div class="gallery">${drawings.map((src) => `<img src="${src}" alt="" loading="lazy" />`).join('')}</div>`
      : ''
  openPanel(`
    <p class="panel__kicker">${item.kicker}</p>
    <h2 id="panel-title">${item.title}</h2>
    ${item.body}
    ${gallery}
    ${links ? `<div class="panel__links">${links}</div>` : ''}
  `)
}

function openIndex() {
  const items = INDEX_ORDER.map(
    (id) => `<li><button type="button" data-open="${id}"><span>${HOTSPOTS[id].kicker}</span>${HOTSPOTS[id].title}</button></li>`,
  ).join('')
  openPanel(`
    <p class="panel__kicker">Everything in the room</p>
    <h2 id="panel-title">Index</h2>
    <ul class="index">${items}</ul>
  `)
}

panelBody.addEventListener('click', (e) => {
  const button = e.target.closest('[data-open]')
  if (button) openHotspot(button.dataset.open)
})
panel.addEventListener('close', () => {
  world.paused = false
})
panel.addEventListener('click', (e) => {
  if (e.target === panel) panel.close()
})
document.querySelector('[data-index]').addEventListener('click', openIndex)
modeButton.addEventListener('click', toggleMode)

// ---------- Scroll chapters ----------

chaptersEl.innerHTML = TOUR.map(({ key }, i) => {
  const copy = CHAPTERS[key] ?? {}
  const item = HOTSPOTS[key]
  const kicker = copy.kicker ?? item?.kicker ?? ''
  const title = copy.title ?? item?.title ?? ''
  const number = String(i).padStart(2, '0')
  const open = item ? `<button type="button" class="btn" data-open="${key}">Open &rarr;</button>` : ''
  const side = i % 2 ? 'right' : 'left'
  return `
    <section class="chapter chapter--${side}" data-chapter="${i}">
      <div class="chapter__card">
        <p class="chapter__kicker"><span>(${number})</span> ${kicker}</p>
        <h2>${title}</h2>
        <p>${copy.blurb ?? ''}</p>
        ${open}
      </div>
    </section>`
}).join('')

chaptersEl.addEventListener('click', (e) => {
  const button = e.target.closest('[data-open]')
  if (button) openHotspot(button.dataset.open)
})

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const t = max > 0 ? window.scrollY / max : 0
  world.setProgress(t * (TOUR.length - 1))
  progressEl.style.setProperty('--p', t)
  const active = Math.round(t * (TOUR.length - 1))
  chaptersEl.querySelectorAll('.chapter').forEach((el, i) => el.classList.toggle('is-active', i === active))
}

// ---------- Boot ----------

const labels = { ...ACTION_LABELS }
for (const [id, item] of Object.entries(HOTSPOTS)) labels[id] = item.bubble

renderMode()
const world = new World(document.querySelector('#world'), {
  bubble: document.querySelector('#bubble'),
  say: document.querySelector('#say'),
  labels,
  lines: LINES,
  mode,
  drawings,
  onActivate: (id) => (id === 'lamp' ? toggleMode() : openHotspot(id)),
})
window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)
onScroll()

// Your typeface: put typeface.woff2 (or .otf) in public/fonts/ and the poster + specimen use it
const base = import.meta.env.BASE_URL
new FontFace('ParkerType', `url(${base}fonts/typeface.woff2) format('woff2'), url(${base}fonts/typeface.otf) format('opentype')`)
  .load()
  .then((face) => document.fonts.add(face))
  .catch(() => {})
  .finally(() => document.fonts.ready.then(() => world.room.poster.draw('ParkerType')))
