import './project.css'
import { PROJECTS, PROJECT_ORDER, projectUrl } from './projects.js'
import { initThemeToggle } from './theme.js'

const slug = document.body.dataset.project
const project = PROJECTS[slug]

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

const specimen = project.specimen
  ? `<section class="block specimen">
      <p class="specimen__note">Layout preview only: the custom font file has not been added yet, so the finished typeface specimen is still to come.</p>
      <p class="specimen__big">Aa</p>
      <p class="specimen__set">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 &amp;!?</p>
      <p class="specimen__waterfall" style="font-size: 3rem">Bad decisions make good stories.</p>
      <p class="specimen__waterfall" style="font-size: 2rem">Bad decisions make good stories.</p>
      <p class="specimen__waterfall" style="font-size: 1.25rem">Bad decisions make good stories.</p>
    </section>`
  : ''

const screenshots = project.screenshots?.length
  ? `<section class="block screenshot-section">
      <h2>${project.screenshotHeading ?? 'Screenshots'}</h2>
      ${project.screenshotNote ? `<p class="note">${project.screenshotNote}</p>` : ''}
      <div class="case-gallery">
        ${project.screenshots.map((shot) => `
          <figure class="case-gallery__item">
            <a href="${shot.src}" target="_blank" rel="noopener">
              <img src="${shot.src}" alt="${shot.alt}" loading="lazy" decoding="async" />
            </a>
            <figcaption>${shot.caption}</figcaption>
          </figure>`).join('')}
      </div>
    </section>`
  : ''

const live = project.live
  ? `<section class="block live-preview">
      <h2>${project.live.heading}</h2>
      <p class="note">${project.live.note}</p>
      <a class="live-preview__link" href="${project.live.href}" target="_blank" rel="noopener noreferrer">${project.live.label} &rarr;<span class="visually-hidden"> (opens in a new tab)</span></a>
    </section>`
  : ''

// The video's src is attached only as it nears the viewport, so the page never downloads it up front.
const video = project.video
  ? `<section class="block demo-video">
      <h2>${project.video.heading}</h2>
      <figure class="demo-video__frame">
        <video data-src="${project.video.src}" poster="${project.video.poster}" preload="none" controls muted loop playsinline aria-label="${project.video.label}" data-lazy-video></video>
        <figcaption>${project.video.caption}</figcaption>
      </figure>
    </section>`
  : ''

const identity = project.identity
  ? `<section class="block identity">
      <h2>${project.identity.heading}</h2>
      ${project.identity.note ? `<p>${project.identity.note}</p>` : ''}
      <div class="identity__logos">
        ${project.identity.logos.map((logo) => `
          <figure class="identity__logo">
            <div style="--logo-bg: ${logo.bg}"><img src="${logo.src}" alt="${logo.alt}" loading="lazy" decoding="async" /></div>
            <figcaption>${logo.caption}</figcaption>
          </figure>`).join('')}
      </div>
      ${project.identity.sheet ? `
        <figure class="case-gallery__item identity__sheet">
          <a href="${project.identity.sheet.src}" target="_blank" rel="noopener">
            <img src="${project.identity.sheet.src}" alt="${project.identity.sheet.alt}" loading="lazy" decoding="async" />
          </a>
          <figcaption>${project.identity.sheet.caption}</figcaption>
        </figure>` : ''}
    </section>`
  : ''

const shot = project.image
  ? `<figure class="shot">
      <img src="${project.image.src}" alt="${project.image.alt}" />
      ${project.logo ? `<span class="shot__logo" style="--logo-bg: ${project.logo.bg}"><img src="${project.logo.src}" alt="${project.logo.alt}" /></span>` : ''}
    </figure>`
  : ''

const links = project.links
  .map((l) => `<a class="poster__link" href="${l.href}" target="_blank" rel="noopener">${l.label} &rarr;</a>`)
  .join('')

document.title = `${project.title} — Parker Allen`
document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="back" href="${home}">&larr; All projects</a>
    <p class="brand"><span class="brand__script">Design by</span> <span class="brand__name">Parker Allen</span></p>
  </header>
  <button type="button" class="lamp-toggle" data-mode-toggle aria-label="Switch to light mode" title="Switch to light mode"></button>

  <main class="page tone-${project.tone}">
    <section class="hero">
      <p class="script">Case study</p>
      <p class="kicker"><span>(${number})</span> ${project.kicker}</p>
      <h1>${project.title}</h1>
      <p class="lede">${project.tagline}</p>
    </section>

    <div class="ticket">
      <dl class="ticket__main">${meta}</dl>
      <div class="ticket__stub"><span>Project</span><strong>${number}</strong></div>
    </div>

    ${shot}
    ${live}
    ${video}
    ${sections}
    ${identity}
    ${specimen}
    ${screenshots}
    ${links ? `<section class="poster"><p>Take a look for yourself</p>${links}</section>` : ''}

    <a class="next ticket" href="${projectUrl(nextSlug)}">
      <div class="ticket__main"><p class="kicker">Next project</p><h3>${next.title}</h3></div>
      <div class="ticket__stub"><span>Next</span><strong>&rarr;</strong></div>
    </a>
  </main>
`

initThemeToggle(document.querySelector('[data-mode-toggle]'))

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
