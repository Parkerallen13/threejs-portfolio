import { defineConfig } from 'vite'

// GitHub Pages serves this repo at /threejs-portfolio/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/threejs-portfolio/' : '/',
}))
