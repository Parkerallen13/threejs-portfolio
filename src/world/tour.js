// Scroll chapters, seen through *your* eyes. You start outside in the snowy redwoods
//
// walk up to the cottage, the door swings open (the husky bolts out for a run), then
// Parker shows you around inside, standing beside each thing and talking to you.
// `key` matches a hotspot id in content.js (other keys are just views).
// `via` routes the camera through the front door instead of through a wall.
// `face` is where Parker looks once arrived (defaults to you).
// `lens` is fisheye strength; `tint` + `grade` give each stop a soft storybook color wash.
export const DOOR_OPEN_AT = 1 // the door is fully open by this chapter

export const TOUR = [
  { key: 'intro', cam: [5.0, 4.2, 31], look: [1.5, 6.0, -20], stand: [1.3, 3.8], lens: 0.15, tint: '#9fb4c8', grade: 0.1 },
  { key: 'door', cam: [0.3, 1.75, 8.6], look: [0.3, 1.45, 3.0], stand: [1.3, 3.8], lens: 0.2, tint: '#e8b46a', grade: 0.08 },
  { key: 'inside', via: [0.3, 1.8, 4.6], cam: [-5.0, 2.8, 4.3], look: [1.8, 0.6, -2.4], stand: [-1.0, 3.0], lens: 0.25, tint: '#e8b46a', grade: 0.08 },
  // Clockwise around the room from the door: left wall, back wall, fireplace, kitchen, back to the door
  { key: 'typeface', cam: [-1.6, 2.1, 0.0], look: [-6, 1.8, -0.6], stand: [-5.0, 0.2], lens: 0.18, tint: '#c97b84', grade: 0.15 },
  { key: 'ouro', cam: [-0.3, 2.1, -0.9], look: [-1.6, 1.1, -4.6], stand: [-0.2, -3.0], lens: 0.25, tint: '#e8b46a', grade: 0 },
  { key: 'resume', cam: [1.3, 1.9, 0.6], look: [0.1, 0.5, -1.5], stand: [-1.3, -2.3], lens: 0.22, tint: '#5f8a6e', grade: 0.12 },
  { key: 'about', cam: [0.5, 1.9, -0.8], look: [2.2, 1.2, -4.0], stand: [1.1, -2.6], lens: 0.22, tint: '#7d9a5b', grade: 0.12 },
  { key: 'drawings', cam: [1.8, 2.3, -1.2], look: [5.2, 2.6, -2.7], stand: [3.9, -0.6], lens: 0.18, tint: '#e8b46a', grade: 0 },
  { key: 'aldente', cam: [2.4, 2.0, -0.6], look: [5.4, 1.1, 1.6], stand: [4.75, 1.0], face: [5.6, 1.0], lens: 0.22, tint: '#d9874a', grade: 0.12 },
  { key: 'brewing', cam: [2.3, 1.75, 2.3], look: [5.4, 1.0, 4.0], stand: [4.5, 1.9], face: [5.2, 4.1], lens: 0.22, tint: '#b5773b', grade: 0.12 },
  { key: 'contact', cam: [-1.8, 2.1, 1.2], look: [0.3, 1.3, 5.0], stand: [-0.4, 3.8], lens: 0.2, tint: '#6b88b0', grade: 0.18 },
  // Up the spiral stairs to Parker's room
  { key: 'stairs', cam: [-3.4, 1.7, -2.2], look: [-5.3, 3.8, -4.3], stand: [-4.2, -3.1], lens: 0.25, tint: '#e8b46a', grade: 0.08 },
  { key: 'bedroom', via: [-5.25, 5.3, -4.25], cam: [0.5, 6.5, -5.4], look: [-2.4, 5.0, 0.3], stand: [-3.6, -1.6], floor: 1, lens: 0.3, tint: '#e8a05a', grade: 0.12 },
  { key: 'outro', via: [-1.6, 6.4, 2.6], cam: [-7.0, 6.5, 33], look: [1.5, 4.0, -20], stand: [0.3, 3.8], lens: 0.15, tint: '#9fb4c8', grade: 0.12 },
]
