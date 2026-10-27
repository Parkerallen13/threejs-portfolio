# threejs-portfolio

A personal portfolio built with [Three.js](https://threejs.org) and [Vite](https://vite.dev).

## Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Structure

```
index.html              HTML overlay (hero, work, contact sections)
src/main.js             entry point
src/style.css           overlay styles
src/scene/Experience.js Three.js scene: camera, lights, objects, scroll + pointer animation
public/                 static assets (models, textures, fonts) served as-is
```

## Next steps

- Swap the placeholder meshes for your own models (`GLTFLoader` from `three/addons/loaders/GLTFLoader.js`)
- Fill in real projects and contact info in `index.html`
