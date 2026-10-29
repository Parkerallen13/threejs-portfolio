import './style.css'
import site from './data/site.json'
import { PROJECTS, PROJECT_ORDER, projectUrl } from './projects.js'
import { assetUrl } from './assets.js'
import { initThemeToggle } from './theme.js'
import { initAura, initBackdrop, initReveal } from './motion.js'

// Image folders become galleries, ordered by filename; "01-fall-rush.jpg" is titled "Fall rush".
const images = (modules) => Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    src,
    file: path.split('/').pop(),
    title: path.split('/').pop().replace(/\.[^.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase()),
  }))

const artwork = images(import.meta.glob('./assets/drawings/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }))
const cutouts = images(import.meta.glob('./assets/drawings/cutouts/*.png', { eager: true, query: '?url', import: 'default' }))
const posts = {
  hyperloop: images(import.meta.glob('./assets/experience/hyperloop/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' })),
  ktp: images(import.meta.glob('./assets/experience/ktp/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' })),
}

// Hooks for the local edit mode (src/edit.js), naming where each field lives. Left out of the build.
const DEV = import.meta.env.DEV
const edit = (path, file = 'site') => (DEV ? ` data-edit="${file}:${path}"` : '')
const editImg = (path) => (DEV ? ` data-edit-img="site:${path}"` : '')
const editList = (path) => (DEV ? ` data-edit-list="site:${path}"` : '')
const get = (path) => path.split('.').reduce((value, key) => value?.[key], site)
const pad = (n) => String(n).padStart(2, '0')

// ---------- Copy from site.json ----------

document.querySelectorAll('[data-text]').forEach((el) => {
  el.innerHTML = get(el.dataset.text)
  if (DEV) el.dataset.edit = `site:${el.dataset.text}`
})
document.querySelectorAll('[data-href]').forEach((el) => { el.href = assetUrl(get(el.dataset.href)) })
document.querySelectorAll('[data-img]').forEach((img) => {
  const { src, alt } = get(img.dataset.img)
  img.src = assetUrl(src)
  img.alt = alt
  if (DEV) img.dataset.editImg = `site:${img.dataset.img}.src`
})
document.querySelectorAll('[data-list]').forEach((list) => {
  list.innerHTML = get(list.dataset.list).map((item) => `<li>${item}</li>`).join('')
  if (DEV) list.dataset.editList = `site:${list.dataset.list}`
})

document.querySelector('[data-badge-fields]').innerHTML = site.intro.badge.fields.map((field, i) => `
  <div><dt${edit(`intro.badge.fields.${i}.label`)}>${field.label}</dt><dd${edit(`intro.badge.fields.${i}.value`)}>${field.value}</dd></div>`).join('')

document.querySelector('[data-focus-cards]').innerHTML = site.focus.cards.map((card, i) => `
  <li class="focus-card reveal" style="--reveal-delay: ${i * 90}ms">
    <span class="focus-card__index" aria-hidden="true">${pad(i + 1)}</span>
    <h3${edit(`focus.cards.${i}.title`)}>${card.title}</h3>
    <p${edit(`focus.cards.${i}.body`)}>${card.body}</p>
    <p class="focus-card__seen"${edit(`focus.cards.${i}.seen`)}>${card.seen}</p>
  </li>`).join('')

document.querySelector('[data-tool-groups]').innerHTML = site.tools.groups.map((group, i) => `
  <div class="tools__group reveal" style="--reveal-delay: ${i * 90}ms">
    <h3${edit(`tools.groups.${i}.name`)}>${group.name}</h3>
    <ul class="tool-list"${editList(`tools.groups.${i}.items`)}>${group.items.map((item) => `<li>${item}</li>`).join('')}</ul>
  </div>`).join('')

// ---------- Projects ----------

// Each work section lists its category's projects, in the admin's order
const projectCard = (id, index) => {
  const project = PROJECTS[id]
  const cover = project.image
    ? `<img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async" />`
    : project.coverText
      ? `<span class="project-card__cover-text">${project.coverText}</span>`
      : `<span class="project-card__number" aria-hidden="true">${pad(index + 1)}</span>`

  return `
    <article class="project-card reveal reveal--${index % 2 ? 'right' : 'left'}">
      <a class="project-card__link" href="${projectUrl(id)}" aria-label="View ${project.title}">
        <div class="project-card__cover project-card__cover--${project.tone}">
          ${cover}
          ${project.sticker ? `<span class="project-card__sticker">${project.sticker}</span>` : ''}
          ${project.logo ? `<span class="project-card__logo" style="--logo-bg: ${project.logo.bg}"><img src="${project.logo.src}" alt="" /></span>` : ''}
          <span class="project-card__arrow" aria-hidden="true">↗</span>
        </div>
        <div class="project-card__details">
          <p class="eyebrow"${edit(`projects.${id}.kicker`, 'projects')}>${project.kicker}</p>
          <h3>${project.title}</h3>
          <p class="project-card__tagline"${edit(`projects.${id}.tagline`, 'projects')}>${project.tagline}</p>
          <span class="project-card__action">View project <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`
}

document.querySelectorAll('[data-projects]').forEach((list) => {
  list.innerHTML = PROJECT_ORDER
    .filter((id) => (PROJECTS[id].category ?? 'ux') === list.dataset.projects)
    .map(projectCard)
    .join('')
})

// ---------- Experience ----------

const postItems = (folder) => (posts[folder] ?? []).map(({ src, title, file }) => `
  <li class="post"${DEV ? ` data-post="${folder}/${file}"` : ''}>
    <a href="${src}" target="_blank" rel="noopener" aria-label="View full size: ${title}">
      <img src="${src}" alt="${title}" loading="lazy" decoding="async" />
    </a>
  </li>`).join('')

document.querySelector('[data-orgs]').innerHTML = site.experience.orgs.map((org, i) => {
  const at = `experience.orgs.${i}`
  return `
    <article class="experience-card reveal reveal--${i % 2 ? 'right' : 'left'}" id="${org.posts}">
      <header class="experience-card__heading">
        <span class="experience-card__logo"><img src="${assetUrl(org.logo.src)}" alt="" width="${org.logo.width}" height="${org.logo.height}"${editImg(`${at}.logo.src`)} /></span>
        <div>
          <h3${edit(`${at}.name`)}>${org.name}</h3>
          <p class="experience-card__role"${edit(`${at}.role`)}>${org.role}</p>
        </div>
        <a class="pill-link pill-link--instagram" href="${org.instagram.href}" target="_blank" rel="noopener noreferrer"><span${edit(`${at}.instagram.label`)}>${org.instagram.label}</span> <span aria-hidden="true">↗</span></a>
      </header>
      <p class="experience-card__made"${edit(`${at}.made`)}>${org.made}</p>
      <ul class="tool-list" aria-label="Tools"${editList(`${at}.tools`)}>${org.tools.map((tool) => `<li>${tool}</li>`).join('')}</ul>
      <ul class="posts" aria-label="${org.name} designs">${postItems(org.posts)}</ul>
      ${org.crossLink ? `<a class="cross-link" href="${projectUrl(org.crossLink.project)}"><span${edit(`${at}.crossLink.label`)}>${org.crossLink.label}</span> <span aria-hidden="true">→</span></a>` : ''}
    </article>`
}).join('')

document.querySelectorAll('[data-project]').forEach((link) => {
  link.href = projectUrl(link.dataset.project)
})

// ---------- Drawings ----------

const artworkTrack = document.querySelector('[data-artwork-track]')
if (artwork.length) {
  artworkTrack.innerHTML = artwork.map(({ src, title }) => `
    <figure class="artwork-card">
      <a href="${src}" target="_blank" rel="noopener" aria-label="View artwork: ${title}">
        <img src="${src}" alt="${title}" loading="lazy" decoding="async" />
      </a>
    </figure>
  `).join('')
  document.querySelector('[data-artwork-empty]').hidden = true
  document.querySelector('[data-artwork-controls]').hidden = false
}

document.querySelector('[data-artwork-prev]').addEventListener('click', () => {
  artworkTrack.scrollBy({ left: -artworkTrack.clientWidth * 0.8, behavior: 'smooth' })
})
document.querySelector('[data-artwork-next]').addEventListener('click', () => {
  artworkTrack.scrollBy({ left: artworkTrack.clientWidth * 0.8, behavior: 'smooth' })
})

// ---------- Floating header ----------

// Highlight the link for the section you're reading
const spyLinks = [...document.querySelectorAll('[data-spy]')]
const spy = () => {
  const line = innerHeight * 0.35
  let current = null
  for (const link of spyLinks) {
    const section = document.getElementById(link.dataset.spy)
    if (section && section.getBoundingClientRect().top < line) current = link
  }
  spyLinks.forEach((link) => link.setAttribute('aria-current', String(link === current)))
}
addEventListener('scroll', spy, { passive: true })
spy()

// The admin only exists on the local dev server, so its link does too
if (DEV) {
  document.querySelector('[data-nav]').insertAdjacentHTML('beforeend', `
    <a class="floating-nav__admin" href="/admin/" aria-label="Admin: edit the site" title="Admin: edit the site">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19.3 8.7a2.1 2.1 0 0 0-3-3L5 17v3Zm10.5-12.5 3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>`)
}

initThemeToggle(document.querySelector('[data-mode-toggle]'))
initBackdrop(document.querySelector('[data-backdrop]'), cutouts, site.backdrop)
initReveal()
initAura()
if (DEV) import('./edit.js').then(({ initEditMode }) => initEditMode())
