// Scroll chapters, seen through *your* eyes. You start outside in the snowy redwoods,
// walk up to the cottage, the door swings open (the husky bolts out for a run), then
// Parker shows you around inside, standing beside each thing and talking to you.
// `key` matches a hotspot id in content.js (other keys are just views).
// `via` routes the camera through the front door instead of through a wall.
// `face` is where Parker looks once arrived (defaults to you).
// `lens` is fisheye strength; `tint` + `grade` give each stop a soft storybook color wash.
export const DOOR_OPEN_AT = 1 // the door is fully open by this chapter

export const TOUR = [
  { key: 'intro', cam: [0.3, 2.6, 19.5], look: [0.3, 2.4, 4.5], stand: [1.3, 3.8], lens: 0.15, tint: '#9fb4c8', grade: 0.1 },
  { key: 'door', cam: [0.3, 1.75, 8.6], look: [0.3, 1.45, 3.0], stand: [1.3, 3.8], lens: 0.2, tint: '#e8b46a', grade: 0.08 },
  { key: 'inside', via: [0.3, 1.8, 4.6], cam: [-5.0, 2.8, 4.3], look: [1.8, 0.6, -2.4], stand: [-1.0, 3.0], lens: 0.25, tint: '#e8b46a', grade: 0.08 },
  { key: 'about', cam: [-1.4, 2.0, 0.9], look: [-4.9, 0.8, 2.7], stand: [-3.3, 3.7], lens: 0.22, tint: '#7d9a5b', grade: 0.18 },
  { key: 'drawings', cam: [0.6, 2.1, 0.6], look: [-0.4, 1.8, -5], stand: [2.3, -3.2], lens: 0.18, tint: '#e8b46a', grade: 0 },
  { key: 'typeface', cam: [-1.2, 2.0, 0.4], look: [-6, 1.8, -0.6], stand: [-4.8, 1.0], lens: 0.18, tint: '#c97b84', grade: 0.18 },
  { key: 'ouro', cam: [-0.3, 2.1, -0.9], look: [-1.6, 1.1, -4.6], stand: [-0.2, -3.0], lens: 0.25, tint: '#e8b46a', grade: 0 },
  { key: 'aldente', cam: [1.3, 2.1, 0.4], look: [5.3, 1.1, 2.0], stand: [4.75, 1.0], face: [5.6, 1.0], lens: 0.22, tint: '#d9874a', grade: 0.15 },
  { key: 'resume', cam: [1.9, 2.1, 0.3], look: [5.15, 2.0, -2.0], stand: [3.6, -0.9], lens: 0.2, tint: '#5f8a6e', grade: 0.15 },
  { key: 'brewing', cam: [2.2, 2.2, -1.2], look: [5.1, 1.6, -3.8], stand: [2.6, -4.3], lens: 0.22, tint: '#b5773b', grade: 0.15 },
  { key: 'contact', cam: [-1.8, 2.1, 1.2], look: [0.3, 1.3, 5.0], stand: [-0.4, 3.8], lens: 0.2, tint: '#6b88b0', grade: 0.18 },
  { key: 'outro', via: [0.3, 1.9, 5.6], cam: [-3.0, 3.6, 20], look: [0.3, 2.2, 4.0], stand: [0.3, 3.8], lens: 0.15, tint: '#9fb4c8', grade: 0.12 },
]
