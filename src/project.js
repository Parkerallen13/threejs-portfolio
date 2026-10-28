import './project.css'
import { PROJECTS, PROJECT_ORDER, projectUrl } from './projects.js'

// Drawings dropped into src/assets/drawings show up in the drawings gallery
const drawings = Object.entries(
  import.meta.glob('./assets/drawings/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const MODE_KEY = 'portfolio-mode'
const root = document.documentElement
const slug = document.body.dataset.project
const project = PROJECTS[slug]

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) ?? 'dark'
  } catch {
    return 'dark'
  }
}

let mode = readMode()

function renderMode() {
  root.dataset.mode = mode
  const button = document.querySelector('[data-mode-toggle]')
  button.textContent = mode === 'dark' ? '☾' : '☀'
  button.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
}

const home = import.meta.env.BASE_URL
const nextSlug = PROJECT_ORDER[(PROJECT_ORDER.indexOf(slug) + 1) % PROJECT_ORDER.length]
const next = PROJECTS[nextSlug]
const number = String(PROJECT_ORDER.indexOf(slug) + 1).padStart(2, '0')

const meta = project.meta.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')

const sections = project.sections
  .map(
    (s) => `
    <section class="block">
      <h2>${s.heading}</h2>
      ${s.body ?? ''}
      ${s.list ? `<ul class="stars">${s.list.map((li) => `<li>${li}</li>`).join('')}</ul>` : ''}
    </section>`,
  )
  .join('')

const gallery = project.gallery
  ? `<section class="block">
      <h2>Gallery</h2>
      ${
        drawings.length
          ? `<div class="gallery">${drawings.map((src) => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="" loading="lazy" /></a>`).join('')}</div>`
          : '<p class="note">New drawings are being hung. Peek at Instagram in the meantime.</p>'
      }
    </section>`
  : ''

const specimen = project.specimen
  ? `<section class="block specimen">
      <p class="specimen__big">Aa</p>
      <p class="specimen__set">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 &amp;!?</p>
      <p class="specimen__waterfall" style="font-size: 3rem">Bad decisions make good stories.</p>
      <p class="specimen__waterfall" style="font-size: 2rem">Bad decisions make good stories.</p>
      <p class="specimen__waterfall" style="font-size: 1.25rem">Bad decisions make good stories.</p>
    </section>`
  : ''

const links = project.links
  .map((l) => `<a class="poster__link" href="${l.href}" target="_blank" rel="noopener">${l.label} &rarr;</a>`)
  .join('')

document.title = `${project.title} — Parker Allen`
document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="back" href="${home}">&larr; Back to the cottage</a>
    <p class="brand"><span class="brand__script">Design by</span> <span class="brand__name">Parker Allen</span></p>
    <button type="button" class="mode" data-mode-toggle>☾</button>
  </header>

  <main class="page tone-${project.tone}">
    <section class="hero">
      <p class="script">Now showing</p>
      <p class="kicker"><span>(${number})</span> ${project.kicker}</p>
      <h1>${project.title}</h1>
      <p class="lede">${project.tagline}</p>
    </section>

    <div class="ticket">
      <dl class="ticket__main">${meta}</dl>
      <div class="ticket__stub"><span>Admit</span><strong>${number}</strong><span>One</span></div>
    </div>

    ${project.image ? `<figure class="shot"><img src="${project.image.src}" alt="${project.image.alt}" /></figure>` : ''}
    ${sections}
    ${specimen}
    ${gallery}
    ${links ? `<section class="poster"><p>Take a look for yourself</p>${links}</section>` : ''}

    <a class="next ticket" href="${projectUrl(nextSlug)}">
      <div class="ticket__main"><p class="kicker">Next feature</p><h3>${next.title}</h3></div>
      <div class="ticket__stub"><span>Next</span><strong>&rarr;</strong></div>
    </a>
  </main>
`

renderMode()
document.querySelector('[data-mode-toggle]').addEventListener('click', () => {
  mode = mode === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {}
  renderMode()
})

// Your typeface, if added to public/fonts/
const base = import.meta.env.BASE_URL
new FontFace('ParkerType', `url(${base}fonts/typeface.woff2) format('woff2'), url(${base}fonts/typeface.otf) format('opentype')`)
  .load()
  .then((face) => document.fonts.add(face))
  .catch(() => {})
