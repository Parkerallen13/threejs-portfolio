// Scroll chapters, seen through *your* eyes: you walk up to the cottage through the woods,
// step inside, and Parker shows you around, standing beside each thing and talking to you.
// `key` matches a hotspot id in content.js (intro/outro are just views).
// `lens` is fisheye strength; `tint` + `grade` give each stop a soft storybook color wash.
const EYE = 1.55

export const TOUR = [
  { key: 'intro', cam: [0.3, 2.3, 11.5], look: [0.2, 1.8, 0], stand: [0.9, 3.4], lens: 0.25, tint: '#e8b46a', grade: 0.12 },
  { key: 'about', cam: [-2.6, EYE, 3.9], look: [-4.9, 0.8, 2.6], stand: [-4.2, 1.6], lens: 0.35, tint: '#7d9a5b', grade: 0.22 },
  { key: 'typeface', cam: [-3.7, EYE, -0.6], look: [-6, 1.8, -0.6], stand: [-5.0, 0.6], lens: 0.22, tint: '#c97b84', grade: 0.22 },
  { key: 'contact', cam: [-3.3, EYE, -1.3], look: [-4.5, 1.3, -5], stand: [-5.3, -3.4], lens: 0.3, tint: '#6b88b0', grade: 0.25 },
  { key: 'ouro', cam: [-0.9, EYE + 0.25, -1.7], look: [-1.6, 1.15, -4.6], stand: [-0.3, -3.1], lens: 0.45, tint: '#e8b46a', grade: 0 },
  { key: 'drawings', cam: [0.6, EYE + 0.05, -2.6], look: [0.4, 1.8, -5], stand: [2.2, -3.3], lens: 0.2, tint: '#e8b46a', grade: 0 },
  { key: 'aldente', cam: [1.2, EYE - 0.05, 0.2], look: [0.2, 0.5, -1.4], stand: [-1.0, -2.4], lens: 0.4, tint: '#d9874a', grade: 0.18 },
  { key: 'resume', cam: [3.3, EYE + 0.15, -0.8], look: [5.15, 2.1, -2.0], stand: [3.9, -2.6], lens: 0.3, tint: '#5f8a6e', grade: 0.2 },
  { key: 'brewing', cam: [3.4, EYE + 0.25, -3.0], look: [5.1, 2.15, -4.2], stand: [2.6, -4.3], lens: 0.35, tint: '#b5773b', grade: 0.2 },
  { key: 'outro', cam: [0.3, EYE + 0.15, 4.4], look: [0, 1.6, -2], stand: [0.9, 1.5], lens: 0.28, tint: '#e8b46a', grade: 0.1 },
]
