import './style.css'
import { Experience } from './scene/Experience.js'

const STYLE_KEY = 'portfolio-style'
const MODE_KEY = 'portfolio-mode'
const root = document.documentElement
const styleButtons = document.querySelectorAll('[data-style-option]')
const modeButton = document.querySelector('[data-mode-toggle]')

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

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
let style = read(STYLE_KEY) ?? 'cartoon'
let mode = read(MODE_KEY) ?? (prefersDark ? 'dark' : 'light')

function render() {
  root.dataset.style = style
  root.dataset.mode = mode
  styleButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.styleOption === style)))
  modeButton.setAttribute('aria-pressed', String(mode === 'dark'))
  modeButton.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
  modeButton.textContent = mode === 'dark' ? '☾' : '☀'
}

render()
const experience = new Experience(document.querySelector('#webgl'), style, mode)

styleButtons.forEach((button) =>
  button.addEventListener('click', () => {
    style = button.dataset.styleOption
    write(STYLE_KEY, style)
    render()
    experience.setTheme(style, mode)
  }),
)

modeButton.addEventListener('click', () => {
  mode = mode === 'dark' ? 'light' : 'dark'
  write(MODE_KEY, mode)
  render()
  experience.setTheme(style, mode)
})
