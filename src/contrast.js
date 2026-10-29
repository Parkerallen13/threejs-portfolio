// WCAG 2 contrast checks for theme colors. theme.js uses these to keep every theme legible on the
// live site; the admin uses them to audit and fix themes before saving.

export const INK = '#1d1a16' // the dark text that sits on the mid-tone project fills
export const AA_TEXT = 4.5

const toRgb = (hex) => {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex
  const n = parseInt(full.slice(1, 7), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

function toHsl(hex) {
  const [r, g, b] = toRgb(hex).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s * 100, l * 100]
}

export function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n) => Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
  return `#${[channel(0), channel(8), channel(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// The same hue, nudged darker on light backgrounds (or lighter on dark ones) until it reaches `min`
export function readable(hex, against, min = AA_TEXT) {
  if (contrast(hex, against) >= min) return hex
  const darker = luminance(against) > 0.18
  const [h, s, start] = toHsl(hex)
  for (let l = start; l >= 0 && l <= 100; l += darker ? -1 : 1) {
    const candidate = hslToHex(h, s, l)
    if (contrast(candidate, against) >= min) return candidate
  }
  return darker ? '#000000' : '#ffffff'
}

const MODE_TEXT = ['fg', 'muted', 'tomato', 'mustard', 'teal']
const TONES = ['tomato', 'mustard', 'teal']

// Every text-on-background pair a theme produces, with the ones under WCAG AA flagged
export function auditTheme(theme) {
  const issues = []
  for (const mode of ['dark', 'light']) {
    for (const token of MODE_TEXT) {
      const ratio = contrast(theme[mode][token], theme[mode].bg)
      if (ratio < AA_TEXT) issues.push({ where: `${mode} mode`, token, ratio })
    }
  }
  for (const token of TONES) {
    const ratio = contrast(INK, theme.tones[token])
    if (ratio < AA_TEXT) issues.push({ where: 'project fills', token, ratio })
  }
  return issues
}

// A copy of the theme with every failing color nudged until it passes
export function fixTheme(theme) {
  const fixed = structuredClone(theme)
  for (const mode of ['dark', 'light']) {
    for (const token of MODE_TEXT) fixed[mode][token] = readable(fixed[mode][token], fixed[mode].bg)
  }
  for (const token of TONES) fixed.tones[token] = readable(fixed.tones[token], INK)
  return fixed
}
