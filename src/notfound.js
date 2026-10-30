import './style.css'
import { initThemeToggle } from './theme.js'
import { initAura } from './motion.js'
import { initAnalytics } from './analytics.js'

// The 404 page shares the site's theme, lamp, and cursor glow
initThemeToggle(document.querySelector('[data-mode-toggle]'))
initAura()
initAnalytics()
