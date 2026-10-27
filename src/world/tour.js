// Scroll chapters: where the camera sits, what it looks at, and where Parker walks to.
// Parker stands off to the side so the shot stays clear.
// `key` matches a hotspot id in content.js (intro/outro are just views).
// `lens` is fisheye strength; `tint` + `grade` wash the view in one Reccardi-style
// limited palette (ochre, magenta, navy...) so every perspective feels like its own painting.
export const TOUR = [
  { key: 'intro', cam: [0, 6.2, 8.6], look: [0, 0.6, -1.2], stand: [0.6, 1.0], lens: 0.38, tint: '#f2b632', grade: 0 },
  { key: 'about', cam: [-1.9, 2.1, 5.0], look: [-4.6, 0.9, 2.4], stand: [-3.5, 1.7], lens: 0.5, tint: '#e2a33a', grade: 0.4 },
  { key: 'typeface', cam: [-2.6, 2.0, -0.5], look: [-6, 1.8, -0.6], stand: [-5.0, 1.0], lens: 0.3, tint: '#b4507a', grade: 0.42 },
  { key: 'contact', cam: [-2.6, 2.0, -1.4], look: [-4.5, 1.3, -5], stand: [-5.35, -3.3], lens: 0.45, tint: '#2f4a73', grade: 0.42 },
  { key: 'ouro', cam: [-1.0, 2.3, -1.0], look: [-1.6, 1.1, -4.6], stand: [-0.2, -3.0], lens: 0.7, tint: '#f2b632', grade: 0 },
  { key: 'drawings', cam: [0.9, 2.0, -1.6], look: [0.5, 1.7, -5], stand: [2.2, -3.3], lens: 0.2, tint: '#f2b632', grade: 0 },
  { key: 'aldente', cam: [1.6, 2.2, 0.6], look: [0.1, 0.5, -1.4], stand: [-1.2, -2.4], lens: 0.55, tint: '#e86a3a', grade: 0.35 },
  { key: 'resume', cam: [3.0, 2.5, -0.2], look: [5.2, 2.1, -2.0], stand: [3.6, -3.2], lens: 0.4, tint: '#2a8c84', grade: 0.38 },
  { key: 'brewing', cam: [3.2, 2.5, -2.6], look: [5.1, 2.2, -4.2], stand: [2.4, -4.3], lens: 0.5, tint: '#8f3b1f', grade: 0.38 },
  { key: 'outro', cam: [0, 6.8, 9.2], look: [0, 0.4, -0.6], stand: [0.6, 1.2], lens: 0.38, tint: '#f2b632', grade: 0 },
]
