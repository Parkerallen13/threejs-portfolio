import './style.css'
import { PROJECTS, PROJECT_ORDER, projectUrl } from './projects.js'
import { initThemeToggle } from './theme.js'

const artwork = Object.entries(
  import.meta.glob('./assets/drawings/*.{png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    src,
    title: path.split('/').pop().replace(/\.[^.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase()),
  }))

const projectsEl = document.querySelector('#projects')
const artworkTrack = document.querySelector('[data-artwork-track]')
const artworkEmpty = document.querySelector('[data-artwork-empty]')
const artworkControls = document.querySelector('[data-artwork-controls]')

document.querySelectorAll('[data-project]').forEach((link) => {
  link.href = projectUrl(link.dataset.project)
})

projectsEl.innerHTML = PROJECT_ORDER.map((id, index) => {
  const project = PROJECTS[id]
  const number = String(index + 1).padStart(2, '0')
  const cover = project.image
    ? `<img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async" />`
    : `<span class="project-card__number" aria-hidden="true">${number}</span>`

  return `
    <article class="project-card">
      <a class="project-card__link" href="${projectUrl(id)}" aria-label="View ${project.title}">
        <div class="project-card__cover project-card__cover--${project.tone}${id === 'aldente' ? ' project-card__cover--bowl' : ''}">
          ${cover}
          ${project.logo ? `<span class="project-card__logo" style="--logo-bg: ${project.logo.bg}"><img src="${project.logo.src}" alt="" /></span>` : ''}
          <span class="project-card__arrow" aria-hidden="true">↗</span>
        </div>
        <div class="project-card__details">
          <p class="eyebrow">${project.kicker}</p>
          <h3>${project.title}</h3>
          <p class="project-card__tagline">${project.tagline}</p>
          <span class="project-card__action">View project <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`
}).join('')

if (artwork.length) {
  artworkTrack.innerHTML = artwork.map(({ src, title }) => `
    <figure class="artwork-card">
      <a href="${src}" target="_blank" rel="noopener" aria-label="View drawing: ${title}">
        <img src="${src}" alt="${title}" loading="lazy" decoding="async" />
      </a>
      <figcaption>${title}</figcaption>
    </figure>
  `).join('')
  artworkEmpty.hidden = true
  artworkControls.hidden = false
}

document.querySelector('[data-artwork-prev]').addEventListener('click', () => {
  artworkTrack.scrollBy({ left: -artworkTrack.clientWidth * 0.8, behavior: 'smooth' })
})
document.querySelector('[data-artwork-next]').addEventListener('click', () => {
  artworkTrack.scrollBy({ left: artworkTrack.clientWidth * 0.8, behavior: 'smooth' })
})

initThemeToggle(document.querySelector('[data-mode-toggle]'))
