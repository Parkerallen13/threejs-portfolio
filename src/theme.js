import './lamp.css'
import palette from './data/theme.json'
import { INK, readable } from './contrast.js'

// Dark/light mode, toggled by the fringed corner lamp. Shared by the homepage and project pages.
const MODE_KEY = 'portfolio-mode'

// The theme from src/data/theme.json (picked in the local admin), layered over the stylesheets'
// defaults: per-mode colors, the mid-tone project fills, the halftone dots, and the font pairing.
const MODE_TOKENS = ['bg', 'fg', 'muted', 'tomato', 'mustard', 'teal']
const TONES = ['tomato', 'mustard', 'teal']
const isHex = (value) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)

// Every text color is held to WCAG AA (4.5:1) against its background, whatever the theme file says,
// and each project fill gets a text-safe twin per mode for labels drawn in that color.
function legible(colors = {}) {
  if (!isHex(colors.bg)) return {}
  return Object.fromEntries(MODE_TOKENS.filter((token) => isHex(colors[token]))
    .map((token) => [token, token === 'bg' ? colors.bg : readable(colors[token], colors.bg)]))
}

function applyPalette() {
  const dark = legible(palette.dark)
  const light = legible(palette.light)
  const tones = Object.fromEntries(TONES.filter((t) => isHex(palette.tones?.[t])).map((t) => [t, readable(palette.tones[t], INK)]))
  const vars = (colors) => Object.entries(colors).map(([token, value]) => `--${token}: ${value};`).join(' ')
  const toneVars = (bg) => Object.entries(tones)
    .map(([token, value]) => `--tone-${token}: ${value}; --tone-${token}-text: ${bg ? readable(value, bg) : value};`)
    .join(' ')
  const fonts = palette.fonts ?? {}
  const safe = (value) => (/^[\w\s'",.-]+$/.test(String(value)) ? value : null)
  const fontVars = ['heading', 'body', 'accent', 'display']
    .filter((role) => fonts[role] && safe(fonts[role]))
    .map((role) => `--font-${role}: ${fonts[role]};`)
    .concat(safe(fonts.tracking) ? `--heading-tracking: ${fonts.tracking};` : [])
    .concat(Number(fonts.scale) > 0 ? `--heading-scale: ${Number(fonts.scale)};` : [])
    .concat(Number(fonts.weight) > 0 ? `--heading-weight: ${Number(fonts.weight)};` : [])
    .join(' ')
  const style = document.createElement('style')
  style.dataset.theme = palette.name ?? ''
  style.textContent = [
    `:root { ${vars(dark)} ${toneVars(dark.bg)} ${fontVars}${palette.dots === false ? ' --halftone: none;' : ''} }`,
    `[data-mode='light'] { ${vars(light)} ${toneVars(light.bg)} }`,
  ].join('\n')
  document.head.append(style)
  if (fonts.google && /^[\w=:;,@.+&-]+$/.test(fonts.google)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.google}&display=swap`
    document.head.append(link)
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.dark?.bg ?? '#1d1a16')
}

// The shade's scalloped hem: three panels dipping between the seams.
const HEM = [
  [[7, 86], [24, 97], [41, 89]],
  [[41, 89], [60, 101], [79, 89]],
  [[79, 89], [96, 97], [113, 86]],
]
const HEM_CURVES = 'Q24 97 41 89Q60 101 79 89Q96 97 113 86'
const HEM_PATH = `M7 86${HEM_CURVES}`
const SHADE_PATH = `M41 18C31 20 28 44 17 60 10 70 6 78 7 86${HEM_CURVES}C114 78 110 70 103 60 92 44 89 20 79 18Z`
const SEAMS = 'M53 19C50 40 44 66 41 89M67 19C70 40 76 66 79 89'
// Flat cel shading over the right-hand panel
const SHADOW_PATH = 'M67 19C70 40 76 66 79 89Q96 97 113 86C114 78 110 70 103 60 92 44 89 20 79 18Z'

// Chunky tassels, a few per panel, drawn twice (ink, then yarn) so each one gets an outline.
function fringe() {
  const strands = []
  HEM.forEach(([a, b, c], seg) => {
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7
      const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t ** 2 * c[0]
      const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t ** 2 * c[1]
      const len = 11 + ((i * 5 + seg * 2) % 4)
      strands.push(`M${x.toFixed(1)} ${(y - 2).toFixed(1)}l${((i % 3) - 1) * 0.6} ${len}`)
    }
  })
  return strands.join('')
}

// Little light lines on either side of the shade, shown when the lamp is on
const RAYS = [-50, -20, 10, 170, 200, 230].map((deg) => {
  const angle = (deg * Math.PI) / 180
  const at = (r) => `${(60 + r * Math.cos(angle)).toFixed(1)} ${(52 + r * Math.sin(angle)).toFixed(1)}`
  return `M${at(58)}L${at(67)}`
}).join('')

const FRINGE = fringe()

const LAMP_SVG = `
  <svg viewBox="0 0 120 190" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="lamp-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset=".55" stop-color="#fff" />
        <stop offset="1" stop-color="#000" />
      </linearGradient>
      <mask id="lamp-stem-fade" maskUnits="userSpaceOnUse" x="0" y="100" width="120" height="90">
        <rect x="0" y="100" width="120" height="90" fill="url(#lamp-fade)" />
      </mask>
    </defs>

    <g class="lamp__glow">
      <ellipse cx="60" cy="64" rx="76" ry="66" />
      <ellipse cx="60" cy="64" rx="58" ry="50" />
    </g>
    <path class="lamp__rays" d="${RAYS}" />

    <g class="lamp__brass" mask="url(#lamp-stem-fade)">
      <rect x="56.5" y="127" width="7" height="66" rx="2" />
      <path d="M52 121q-1 8 4 11h8q5-3 4-11z" />
    </g>
    <ellipse class="lamp__brass" cx="60" cy="120" rx="12" ry="3.6" />
    <rect class="lamp__brass" x="55.5" y="101" width="9" height="18" rx="2" />

    <g class="lamp__chain">
      <path d="M75 96v31" />
      <circle cx="75" cy="130" r="3.4" />
    </g>

    <g class="lamp__body">
      <g class="lamp__fringe">
        <path class="lamp__fringe-ink" d="${FRINGE}" />
        <path class="lamp__fringe-yarn" d="${FRINGE}" />
      </g>
      <path class="lamp__shade" d="${SHADE_PATH}" />
      <path class="lamp__shadow" d="${SHADOW_PATH}" />
      <path class="lamp__seam" d="${SEAMS}" />
      <path class="lamp__shine" d="M38 30Q33 48 24 66M20 74l-1 3" />
      <path class="lamp__outline" d="${SHADE_PATH}" />
      <path class="lamp__trim-ink" d="${HEM_PATH}" />
      <path class="lamp__trim" d="${HEM_PATH}" />
      <ellipse class="lamp__rim" cx="60" cy="18" rx="19" ry="3.4" />
      <path class="lamp__brass" d="M56.5 16h7l-1-5h-5z" />
      <circle class="lamp__brass" cx="60" cy="8" r="4.2" />
    </g>
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

  applyPalette()
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
