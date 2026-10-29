# threejs-portfolio

Parker Allen's lightweight, responsive design portfolio, built with [Vite](https://vite.dev).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Editing content

All text, images, and theme settings live in `src/data/`:

```text
src/data/site.json       homepage copy, focus areas, tools, marketing orgs, drawing layout
src/data/projects.json   every project page (plus the About page) and the homepage order
src/data/theme.json      active colors, fonts, and halftone dots
```

Media paths in those files start with `assets/` (files in `src/assets/`) or `public/`
(files served as-is from `public/`).

### Local admin

`npm run dev` also serves a private admin at http://localhost:5173/admin/. It never
ships: the production build has no admin, no edit controls, and no login.

- **Admin page:** pick a theme or fonts, add, reorder, draft, or delete projects, and
  hide or restore marketing posts.
- **Edit mode:** after logging in, an "Edit page" button appears on the site. Click
  outlined text to rewrite it, click a dashed photo to replace it, and use
  "Arrange drawings" on the homepage to place the background drawings.
- Changes save straight to the files above; push to GitHub to publish them.

Set or change the login (stored only as a hash in the gitignored `.env.local`):

```bash
node admin/set-password.mjs <username> <password>
```

## Structure

```text
index.html, about.html      homepage and About page
projects/*.html             project pages (new ones are picked up by vite.config.js)
src/main.js                 renders the homepage from site.json and projects.json
src/project.js, project.css project and About page template
src/motion.js, motion.css   scroll reveals, drifting drawings, cursor glow
src/theme.js, src/lamp.css  theme colors and fonts, plus the dark/light lamp toggle
src/contrast.js             WCAG contrast checks that keep every theme legible
src/edit.js, edit.css       local edit mode (dev server only)
admin/                      local admin page, its API (plugin.js), and theme presets
src/assets/experience/      marketing posts; hidden posts move to _hidden/
src/assets/drawings/        drawings gallery; cutouts/ holds the background drawings
public/documents/           resume and the UX audit PDF
```

The Ouro demo video is re-encoded for the web (1280px H.264, no audio) and only
attaches its source as it scrolls near the viewport. The original room scene
remains in `src/world/`.
