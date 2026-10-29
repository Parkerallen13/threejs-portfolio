# threejs-portfolio

Parker Allen's lightweight, responsive design portfolio, built with [Vite](https://vite.dev).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Structure

```text
index.html                 homepage: name, portrait, focus areas, projects, experience, sketchbook
src/main.js                renders project cards and local drawing features
src/theme.js, src/lamp.css  fringed corner lamp that toggles and remembers dark/light mode
src/projects.js             project content, images, and detail page links
src/style.css               responsive portfolio styles
projects/*.html             project case studies, rendered by src/project.js
src/project.js              project detail page template
src/project.css             project detail page styles
src/assets/drawings/        optional images for the drawings gallery
src/assets/projects/        project images
src/assets/hyperdrive/      Hyperdrive before-redesign screenshots
src/assets/ouro/            Ouro logos, logo exploration sheet, spring-site demo video + poster
src/assets/aldente/         Al Dente logo directions
src/assets/about/           portrait (resized, metadata stripped)
public/fonts/               optional custom typeface files
public/documents/           UX audit report and presentation PDFs
```

The landing page and project detail pages use system fonts and do not load the
Three.js scene; the original room scene remains in `src/world/`. The Ouro demo
video is re-encoded for the web (1280px H.264, no audio) and only attaches its
source as it scrolls near the viewport.
