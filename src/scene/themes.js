// Each style recolors the same scene, in a light and dark mode. Roles map to the shapes:
// primary = nucleus, secondary = electrons + starburst, accent/accent2 = boomerangs
export const THEMES = {
  cartoon: {
    light: {
      background: '#f4ecd8',
      outline: '#1d1a16',
      ring: '#1d1a16',
      primary: '#e0482f',
      secondary: '#f2b632',
      accent: '#2a8c84',
      accent2: '#f2a7a0',
      emissive: 0,
      bloom: false,
    },
    dark: {
      background: '#1d1a16',
      outline: '#f4ecd8',
      ring: '#f4ecd8',
      primary: '#e0482f',
      secondary: '#f2b632',
      accent: '#2a8c84',
      accent2: '#f2a7a0',
      emissive: 0,
      bloom: false,
    },
  },
  neon: {
    // Motel sign by day: unlit tubes on a dusty pink wall
    light: {
      background: '#efe4ea',
      outline: '#2b1f4a',
      ring: '#2b1f4a',
      primary: '#e8364a',
      secondary: '#e5a500',
      accent: '#13a89e',
      accent2: '#e0489c',
      emissive: 0.15,
      bloom: false,
    },
    dark: {
      background: '#14122b',
      outline: '#ff3d9a',
      ring: '#5ff2e6',
      primary: '#ff4f5e',
      secondary: '#ffd23f',
      accent: '#3ff2e0',
      accent2: '#ff7ad9',
      emissive: 0.35,
      bloom: true,
    },
  },
  pixel: {
    light: {
      background: '#a3ab84',
      outline: '#1f2618',
      ring: '#1f2618',
      primary: '#46542f',
      secondary: '#dfe4c0',
      accent: '#6f7d4c',
      accent2: '#2c3520',
      emissive: 0,
      bloom: false,
      pixelated: true,
    },
    // Backlit screen
    dark: {
      background: '#1f2618',
      outline: '#a3ab84',
      ring: '#a3ab84',
      primary: '#8fa05c',
      secondary: '#dfe4c0',
      accent: '#5d6b3c',
      accent2: '#c9d1a8',
      emissive: 0.1,
      bloom: false,
      pixelated: true,
    },
  },
}

export function getTheme(style, mode) {
  return (THEMES[style] ?? THEMES.cartoon)[mode] ?? THEMES.cartoon.light
}
