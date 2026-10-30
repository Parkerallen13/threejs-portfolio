import './project.css'
import { PROJECTS, PROJECT_ORDER, projectUrl } from './projects.js'
import { initThemeToggle } from './theme.js'
import { initAura } from './motion.js'
import { initAnalytics } from './analytics.js'

const slug = document.body.dataset.project
const project = PROJECTS[slug]

const home = import.meta.env.BASE_URL
// Pages outside the project order (the About page) skip the numbering and lead into the first project
const index = PROJECT_ORDER.indexOf(slug)
const nextSlug = PROJECT_ORDER[(index + 1) % PROJECT_ORDER.length]
const next = PROJECTS[nextSlug]
const number = index >= 0 ? String(index + 1).padStart(2, '0') : null

// Hooks for the local edit mode (src/edit.js): where each piece of text or image lives in
// src/data/projects.json. Left out of the production build.
const edit = (path) => (import.meta.env.DEV ? ` data-edit="projects:projects.${slug}.${path}"` : '')
const editImg = (path) => (import.meta.env.DEV ? ` data-edit-img="projects:projects.${slug}.${path}"` : '')

const meta = project.meta
  .map(([label, value], i) => `<div><dt${edit(`meta.${i}.0`)}>${label}</dt><dd${edit(`meta.${i}.1`)}>${value}</dd></div>`)
  .join('')

const figure = (item, path, prefix = '') => `
  <figure class="case-gallery__item">
    <a href="${item.src}" target="_blank" rel="noopener">
      <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async"${editImg(`${path}.src`)} />
    </a>
    ${item.caption ? `<figcaption>${prefix}<span${edit(`${path}.caption`)}>${item.caption}</span></figcaption>` : ''}
  </figure>`

// The video's src is attached only as it nears the viewport, so the page never downloads it up front.
const videoFigure = (v, path) => `
  <figure class="demo-video">
    <video data-src="${v.src}" poster="${v.poster}" preload="none" controls muted loop playsinline aria-label="${v.label}" data-lazy-video></video>
    <figcaption${edit(`${path}.caption`)}>${v.caption}</figcaption>
  </figure>`

const swatches = ({ label, colors }, path) => `
  <div class="palette">
    <p class="palette__label"${edit(`${path}.label`)}>${label}</p>
    <ul>
      ${colors.map((c, i) => `
        <li>
          <span class="palette__chip" style="--swatch: ${c.hex}"></span>
          <strong${edit(`${path}.colors.${i}.name`)}>${c.name}</strong>
          <span${edit(`${path}.colors.${i}.use`)}>${c.use}</span>
          <code${edit(`${path}.colors.${i}.hex`)}>${c.hex}</code>
        </li>`).join('')}
    </ul>
  </div>`

const body = (s, path) => (s.body ? `<div class="block__body"${edit(`${path}.body`)}>${s.body}</div>` : '')
const list = (s, path) => (s.list
  ? `<ul class="stars">${s.list.map((li, j) => `<li${edit(`${path}.list.${j}`)}>${li}</li>`).join('')}</ul>`
  : '')

// Each section picks a layout by `type`; plain heading + copy is the default.
const BLOCKS = {
  text: (s, p) => `${body(s, p)}${list(s, p)}`,
  process: (s, p) => `
    ${body(s, p)}
    ${s.video ? videoFigure(s.video, `${p}.video`) : ''}
    ${s.changesHeading ? `<h3 class="block__subhead"${edit(`${p}.changesHeading`)}>${s.changesHeading}</h3>` : ''}
    <ol class="changes">
      ${s.changes.map((c, j) => `
        <li>
          <details>
            <summary><h4${edit(`${p}.changes.${j}.what`)}>${c.what}</h4></summary>
            <p${edit(`${p}.changes.${j}.why`)}>${c.why}</p>
          </details>
        </li>`).join('')}
    </ol>`,
  // Big, scannable principle names; each one's details open on hover or keyboard focus
  principles: (s, p) => `
    ${body(s, p)}
    <p class="principles__hint" aria-hidden="true">Hover a principle for how it shows up</p>
    <ul class="principles">
      ${s.items.map((item, j) => `
        <li class="principle" tabindex="0">
          <span class="principle__title"${edit(`${p}.items.${j}.title`)}>${item.title}</span>
          <span class="principle__desc"${edit(`${p}.items.${j}.body`)}>${item.body}</span>
        </li>`).join('')}
    </ul>`,
  table: (s, p) => `
    ${body(s, p)}
    <div class="table-wrap">
      <table class="findings">
        <thead><tr>${s.columns.map((column, k) => `<th scope="col"${edit(`${p}.columns.${k}`)}>${column}</th>`).join('')}</tr></thead>
        <tbody>
          ${s.rows.map((row, j) => `<tr>${row.map((cell, k) => `<td${edit(`${p}.rows.${j}.${k}`)}>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`,
  // Only shows once a font file is set (`font`, e.g. "public/fonts/my-type.woff2")
  typeTester: (s, p) => `
    ${body(s, p)}
    <div class="type-tester">
      <label class="type-tester__controls">
        <span>Size</span>
        <input type="range" min="24" max="160" value="72" data-tester-size />
      </label>
      <p class="type-tester__preview" contenteditable="plaintext-only" spellcheck="false" aria-label="Type to try the typeface" data-tester>${s.sample}</p>
    </div>`,
  dropdowns: (s, p) => `
    ${body(s, p)}
    <div class="dropdowns">
      ${s.items.map((item, j) => `
        <details class="dropdown">
          <summary><span${edit(`${p}.items.${j}.title`)}>${item.title}</span></summary>
          <div class="dropdown__body"${edit(`${p}.items.${j}.body`)}>${item.body}</div>
        </details>`).join('')}
    </div>`,
  palette: (s, p) => `
    ${body(s, p)}
    <div class="palettes">${swatches(s.before, `${p}.before`)}${swatches(s.after, `${p}.after`)}</div>
    ${list(s, p)}`,
  identity: (s, p) => `
    ${body(s, p)}
    ${s.logos ? `<div class="identity__logos">
      ${s.logos.map((logo, j) => `
        <figure class="identity__logo">
          <div style="--logo-bg: ${logo.bg}"><img src="${logo.src}" alt="${logo.alt}" loading="lazy" decoding="async"${editImg(`${p}.logos.${j}.src`)} /></div>
          <figcaption${edit(`${p}.logos.${j}.caption`)}>${logo.caption}</figcaption>
        </figure>`).join('')}
    </div>` : ''}
    ${s.figures ? `<div class="case-gallery">${s.figures.map((f, j) => figure(f, `${p}.figures.${j}`)).join('')}</div>` : ''}`,
  gallery: (s, p) => `
    ${body(s, p)}
    <div class="case-gallery">${s.figures.map((f, j) => figure(f, `${p}.figures.${j}`)).join('')}</div>`,
  compare: (s, p) => `
    ${body(s, p)}
    ${s.pairs.map((pair, j) => `
      <div class="compare">
        ${pair.title ? `<h3 class="block__subhead"${edit(`${p}.pairs.${j}.title`)}>${pair.title}</h3>` : ''}
        <div class="compare__pair">
          ${figure(pair.before, `${p}.pairs.${j}.before`, 'Before · ')}
          ${figure(pair.after, `${p}.pairs.${j}.after`, 'After · ')}
        </div>
        ${pair.note ? `<p${edit(`${p}.pairs.${j}.note`)}>${pair.note}</p>` : ''}
      </div>`).join('')}`,
  video: (s, p) => `${body(s, p)}${videoFigure(s.video, `${p}.video`)}`,
  live: (s, p) => `
    ${body(s, p)}
    <a class="live-preview__link" href="${s.href}" target="_blank" rel="noopener noreferrer"><span${edit(`${p}.label`)}>${s.label}</span> &rarr;<span class="visually-hidden"> (opens in a new tab)</span></a>`,
}

// Sections that have something to show (a type tester waits for its font file)
const shown = project.sections
  .map((s, i) => ({ s, i, id: `section-${i}` }))
  .filter(({ s }) => s.type !== 'typeTester' || s.font)

const sections = shown
  .map(({ s, i, id }) => `
    <section class="block block--${s.type ?? 'text'}" id="${id}">
      <h2${edit(`sections.${i}.heading`)}>${s.heading}</h2>
      ${BLOCKS[s.type ?? 'text'](s, `sections.${i}`)}
    </section>`)
  .join('')

// Jump links so a skimming reader can go straight to process, results, or learnings
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
const jump = shown.length >= 3
  ? `<nav class="jump" aria-label="On this page">
      <span>On this page</span>
      ${shown.map(({ s, id }) => `<a href="#${id}">${plain(s.heading).replace(/:.*$/, '')}</a>`).join('')}
    </nav>`
  : ''

const outcome = project.outcome
  ? `<section class="outcome" aria-label="Outcome">
      <p class="outcome__label">Outcome</p>
      <p class="outcome__value"${edit('outcome.value')}>${project.outcome.value}</p>
      <p class="outcome__text"${edit('outcome.text')}>${project.outcome.text}</p>
    </section>`
  : ''

// A live site or document in a browser-style window, in place of a static screenshot
const embed = project.embed
  ? `<figure class="embed${project.embed.narrow ? ' embed--narrow' : ''}">
      <div class="embed__window">
        <div class="embed__bar">
          <span class="embed__dots" aria-hidden="true"></span>
          <span class="embed__url">${project.embed.url}</span>
          <a href="${project.embed.href ?? project.embed.src}" target="_blank" rel="noopener noreferrer">Open in a new tab &nearr;</a>
        </div>
        <iframe src="${project.embed.src}" title="${project.embed.title}" loading="lazy" style="aspect-ratio: ${project.embed.ratio}"></iframe>
      </div>
      ${project.embed.caption ? `<figcaption${edit('embed.caption')}>${project.embed.caption}</figcaption>` : ''}
    </figure>`
  : ''

// A click-through of an app's real screens, in place of a screen recording
const tour = project.tour
  ? `<figure class="embed tour">
      <div class="embed__window">
        <div class="embed__bar">
          <span class="embed__dots" aria-hidden="true"></span>
          <span class="embed__url" data-tour-url>${project.tour.url}/${project.tour.screens[0].label.toLowerCase().replace(/\s+/g, '-')}</span>
        </div>
        <div class="tour__tabs" role="group" aria-label="Pages in ${project.title}">
          ${project.tour.screens.map((screen, i) => `<button type="button" data-tour-tab="${i}" aria-pressed="${i === 0}">${screen.label}</button>`).join('')}
        </div>
        <div class="tour__screen">
          ${project.tour.screens.map((screen, i) => `<img src="${screen.src}" alt="${screen.alt}" data-tour-screen="${i}"${i ? ' hidden loading="lazy"' : ''} decoding="async"${editImg(`tour.screens.${i}.src`)} />`).join('')}
        </div>
      </div>
      <figcaption${edit('tour.caption')}>${project.tour.caption}</figcaption>
    </figure>`
  : ''

const shot = project.image && !project.comingSoon
  ? `<figure class="shot">
      <img src="${project.image.src}" alt="${project.image.alt}"${editImg('image.src')} />
      ${project.logo ? `<span class="shot__logo" style="--logo-bg: ${project.logo.bg}"><img src="${project.logo.src}" alt="${project.logo.alt}" /></span>` : ''}
    </figure>`
  : ''

const comingSoon = project.comingSoon
  ? `<section class="poster coming-soon"><p>Status</p><strong>Coming soon</strong></section>`
  : ''

const title = project.titleLogo
  ? `<h1 class="title-logo"><img src="${project.titleLogo.src}" alt="${project.titleLogo.alt ?? project.title}"${editImg('titleLogo.src')} /></h1>`
  : `<h1${project.titleStyle === 'plain' ? ' class="title-plain"' : ''}${edit('title')}>${project.title}</h1>`

const links = project.links
  .map((l) => `<a class="poster__link" href="${l.href}"${l.href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>${l.label} &rarr;</a>`)
  .join('')

document.title = `${project.title} — Parker Allen`
document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <span class="progress" aria-hidden="true"><span data-progress></span></span>
    <a class="back" href="${home}">&larr; All projects</a>
    <p class="brand"><span class="brand__script">Design by</span> <span class="brand__name">Parker Allen</span></p>
  </header>
  <button type="button" class="lamp-toggle" data-mode-toggle aria-label="Switch to light mode" title="Switch to light mode"></button>

  ${import.meta.env.DEV && project.draft ? '<p class="draft-banner">Draft preview: only you can see this page. Post it from the admin when it’s ready.</p>' : ''}
  <main class="page tone-${project.tone}">
    <section class="hero">
      <p class="script"${edit('script')}>${project.script ?? 'Case study'}</p>
      <p class="kicker">${number ? `<span>(${number})</span> ` : ''}<span${edit('kicker')}>${project.kicker}</span></p>
      ${title}
      <p class="lede"${edit('tagline')}>${project.tagline}</p>
    </section>

    <section class="tldr" aria-labelledby="tldr-label">
      <p class="tldr__label" id="tldr-label">TL;DR</p>
      <p${edit('tldr')}>${project.tldr}</p>
    </section>
    ${project.crossLink ? `<a class="cross-link" href="${home}${project.crossLink.href}"><span${edit('crossLink.label')}>${project.crossLink.label}</span> <span aria-hidden="true">&rarr;</span></a>` : ''}

    ${outcome}

    <div class="ticket">
      <dl class="ticket__main">${meta}</dl>
      <div class="ticket__stub">${number ? `<span>Project</span><strong>${number}</strong>` : '<span>Hello</span><strong>✦</strong>'}</div>
    </div>

    ${jump}
    ${embed || tour || shot}
    ${comingSoon}
    ${sections}
    ${links ? `<section class="poster"><p>${project.linksLabel ?? 'Take a look for yourself'}</p>${links}</section>` : ''}

    <a class="next ticket" href="${projectUrl(nextSlug)}">
      <div class="ticket__main"><p class="kicker">${number ? 'Next project' : 'See my work'}</p><h3>${next.title}</h3></div>
      <div class="ticket__stub"><span>Next</span><strong>&rarr;</strong></div>
    </a>
  </main>
`

initThemeToggle(document.querySelector('[data-mode-toggle]'))
initAura()
initAnalytics()
if (import.meta.env.DEV) import('./edit.js').then(({ initEditMode }) => initEditMode())

document.querySelector('.tour')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tour-tab]')
  if (!tab) return
  const tour = tab.closest('.tour')
  tour.querySelectorAll('[data-tour-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button === tab)))
  tour.querySelectorAll('[data-tour-screen]').forEach((img) => { img.hidden = img.dataset.tourScreen !== tab.dataset.tourTab })
  tour.querySelector('[data-tour-url]').textContent = `${project.tour.url}/${tab.textContent.toLowerCase().replace(/\s+/g, '-')}`
})

// Reading progress along the bottom of the top bar
const progress = document.querySelector('[data-progress]')
let progressFrame = 0
const showProgress = () => {
  progressFrame = 0
  const scrollable = document.documentElement.scrollHeight - innerHeight
  progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, scrollY / scrollable) : 0})`
}
addEventListener('scroll', () => { progressFrame ||= requestAnimationFrame(showProgress) }, { passive: true })
showProgress()

// Type tester: load the font file and let the slider set the size
const tester = document.querySelector('[data-tester]')
if (tester) {
  const { font } = project.sections.find((s) => s.type === 'typeTester')
  const face = new FontFace('PortfolioTypeface', `url(${font})`)
  face.load().then((loaded) => { document.fonts.add(loaded); tester.style.fontFamily = 'PortfolioTypeface, var(--font-display)' }).catch(() => {})
  document.querySelector('[data-tester-size]').addEventListener('input', (event) => { tester.style.fontSize = `${event.target.value}px` })
}

const lazyVideos = document.querySelectorAll('[data-lazy-video]')
const attachSource = (v) => { if (!v.src) v.src = v.dataset.src }
if (!('IntersectionObserver' in window)) {
  lazyVideos.forEach(attachSource)
} else {
  const loader = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { attachSource(target); loader.unobserve(target) }
    })
  }, { rootMargin: '300px 0px' })
  // Muted autoplay while on screen, unless the visitor prefers reduced motion.
  const player = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { attachSource(target); target.play().catch(() => {}) }
      else target.pause()
    })
  }, { threshold: 0.35 })
  const autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches
  lazyVideos.forEach((v) => { loader.observe(v); if (autoplay) player.observe(v) })
}
