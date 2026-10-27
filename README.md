# threejs-portfolio

Parker Allen's portfolio: a scroll-through tour of a cartoon version of my living room,
built with [Three.js](https://threejs.org) and [Vite](https://vite.dev).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Structure

```
index.html                 page shell: top bar, scroll chapters, speech bubble, panel dialog
src/main.js                boots the world, builds the scroll chapters, opens panels
src/content.js             all the words: hotspot bubbles + panels, chapter blurbs
src/style.css              cartoon-dark UI (Fraunces + Pinyon Script + Space Mono)
src/assets/drawings/       drop images here: they hang on the walls, mantel and rug in filename order
src/assets/screen/         art on the desk monitor
src/world/World.js         renderer, camera tour, Parker + the Mini, hover/click, day/night
src/world/tour.js          scroll chapters: camera position, look target, lens + color wash
src/world/room.js          the living room, piece by piece, and which objects are clickable
src/world/character.js     Parker, built from primitives, animated on twos
src/world/car.js           the black Mini convertible
src/world/lensPass.js      fisheye + line boil, dry-brush mottling, paper grain, palette wash
src/world/toon.js          toon materials, ink outlines, hand-drawn wobble
src/world/textures.js      canvas-drawn textures (floor, brick, blanket, posters)
public/fonts/              put typeface.woff2 or typeface.otf here for the type poster
```
