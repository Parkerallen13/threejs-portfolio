import './lamp.css'

// Dark/light mode, toggled by the fringed corner lamp. Shared by the homepage and project pages.
const MODE_KEY = 'portfolio-mode'

// The shade's scalloped hem: three panels dipping between the braided seams.
const HEM = [
  [[7, 86], [24, 97], [41, 89]],
  [[41, 89], [60, 101], [79, 89]],
  [[79, 89], [96, 97], [113, 86]],
]
const HEM_CURVES = 'Q24 97 41 89Q60 101 79 89Q96 97 113 86'
const HEM_PATH = `M7 86${HEM_CURVES}`
const SHADE_PATH = `M41 18C31 20 28 44 17 60 10 70 6 78 7 86${HEM_CURVES}C114 78 110 70 103 60 92 44 89 20 79 18Z`

function fringe() {
  const strands = []
  HEM.forEach(([a, b, c], seg) => {
    for (let i = 0; i <= 18; i++) {
      const t = i / 18
      const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t ** 2 * c[0]
      const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t ** 2 * c[1]
      const len = 15 + ((i * 7 + seg * 3) % 5)
      strands.push(`M${x.toFixed(1)} ${(y - 1).toFixed(1)}l${((i % 3) - 1) * 0.4} ${len}`)
    }
  })
  return strands.join('')
}

const LAMP_SVG = `
  <svg viewBox="0 0 120 190" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="lamp-halo">
        <stop offset="0" stop-color="#ffd98a" stop-opacity=".55" />
        <stop offset=".55" stop-color="#ffc56a" stop-opacity=".16" />
        <stop offset="1" stop-color="#ffc56a" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="lamp-shade" x1="0" x2="1">
        <stop class="lamp__shade-edge" offset="0" />
        <stop class="lamp__shade-mid" offset=".5" />
        <stop class="lamp__shade-edge" offset="1" />
      </linearGradient>
      <pattern id="lamp-sprig" width="9" height="10" patternUnits="userSpaceOnUse">
        <path d="M2 8q2-3 4-2M4 7V4m0 0q-1.5-1-1.5-2M4 4q1.5-1 2-2.5" />
      </pattern>
      <linearGradient id="lamp-brass" x1="0" x2="1">
        <stop offset="0" stop-color="#6f5530" />
        <stop offset=".4" stop-color="#d4b27a" />
        <stop offset=".6" stop-color="#b48d4f" />
        <stop offset="1" stop-color="#5e4626" />
      </linearGradient>
      <linearGradient id="lamp-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset=".55" stop-color="#fff" />
        <stop offset="1" stop-color="#000" />
      </linearGradient>
      <mask id="lamp-stem-fade" maskUnits="userSpaceOnUse" x="0" y="100" width="120" height="90">
        <rect x="0" y="100" width="120" height="90" fill="url(#lamp-fade)" />
      </mask>
    </defs>

    <ellipse class="lamp__halo" cx="60" cy="72" rx="78" ry="70" fill="url(#lamp-halo)" />

    <g mask="url(#lamp-stem-fade)">
      <rect x="57.5" y="128" width="5" height="62" fill="url(#lamp-brass)" />
      <path d="M53 122q-1.5 6 3 9h8q4.5-3 3-9z" fill="url(#lamp-brass)" />
      <rect x="54.5" y="130" width="11" height="3" rx="1" fill="url(#lamp-brass)" />
    </g>
    <ellipse cx="60" cy="120" rx="12" ry="3.2" fill="url(#lamp-brass)" />
    <ellipse class="lamp__gadroon" cx="60" cy="120" rx="11.5" ry="2.8" />
    <rect x="56" y="104" width="8" height="15" fill="url(#lamp-brass)" />

    <g class="lamp__chain">
      <path d="M75 98v30" />
      <circle cx="75" cy="130.5" r="2.4" />
    </g>

    <path class="lamp__fringe lamp__fringe--back" d="${fringe()}" />

    <path d="M58 17h4l-.6-5q1.8-2 0-4.2l-.4-2.3h-2l-.4 2.3q-1.8 2.2 0 4.2z" fill="url(#lamp-brass)" />
    <path class="lamp__shade" d="${SHADE_PATH}" />
    <path class="lamp__sprig" d="${SHADE_PATH}" />
    <g class="lamp__trim">
      <path d="M41 18C31 20 28 44 17 60 10 70 6 78 7 86M79 18C89 20 92 44 103 60 110 70 114 78 113 86" />
      <path d="M53 19C50 40 44 66 41 89M67 19C70 40 76 66 79 89" />
      <path d="${HEM_PATH}" />
      <ellipse cx="60" cy="18" rx="19" ry="2.8" />
    </g>
    <g class="lamp__trim lamp__trim--braid">
      <path d="M41 18C31 20 28 44 17 60 10 70 6 78 7 86M79 18C89 20 92 44 103 60 110 70 114 78 113 86" />
      <path d="M53 19C50 40 44 66 41 89M67 19C70 40 76 66 79 89" />
      <path d="${HEM_PATH}" />
    </g>

    <path class="lamp__fringe" d="${fringe()}" />
  </svg>`

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) ?? 'dark'
  } catch {
    return 'dark'
  }
}

export function initThemeToggle(button) {
  const root = document.documentElement
  let mode = readMode()

  function render() {
    root.dataset.mode = mode
    const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    button.setAttribute('aria-label', label)
    button.title = label
  }

  button.innerHTML = LAMP_SVG
  render()

  button.addEventListener('click', () => {
    mode = mode === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(MODE_KEY, mode)
    } catch {
      // Theme switching still works for this page view without browser storage.
    }
    render()
    button.classList.remove('is-pulled')
    void button.offsetWidth // restart the pull-chain animation
    button.classList.add('is-pulled')
  })
}
