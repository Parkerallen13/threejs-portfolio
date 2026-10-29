// Color tokens each theme sets: per-mode colors, plus the mid-tone fills used on project covers and
// case-study pages (`tones`, which sit behind dark text). The saved themes themselves live in
// admin/themes.json so they can be added, shuffled, and deleted from the admin.
export const TOKENS = {
  dark: ['bg', 'fg', 'muted', 'tomato', 'mustard', 'teal'],
  light: ['bg', 'fg', 'muted', 'tomato', 'mustard', 'teal'],
  tones: ['tomato', 'mustard', 'teal'],
}

// Font pairings for the admin's font picker, saved into theme.json as `fonts`. `google` is the
// Google Fonts query for any web fonts the pairing needs ('' when it only uses system fonts);
// `tracking`, `scale`, and `weight` tune the big headings so each face sits well.
export const FONT_PAIRS = [
  {
    name: 'Classic',
    note: 'Helvetica headings, Georgia italics, Impact stamps.',
    heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    accent: "Georgia, 'Times New Roman', serif",
    display: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
    tracking: '-0.06em',
    scale: 1,
    weight: 700,
    google: '',
  },
  {
    name: 'Letterpress',
    note: 'A sturdy grotesque like an old ID card, Plex for reading, and typewriter italics.',
    heading: "'Archivo', Helvetica, Arial, sans-serif",
    body: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
    accent: "'Courier Prime', 'Courier New', monospace",
    display: "'Archivo Narrow', 'Arial Narrow', sans-serif",
    tracking: '-0.04em',
    scale: 0.96,
    weight: 800,
    google: 'family=Archivo:wght@500;800&family=Archivo+Narrow:wght@700&family=IBM+Plex+Sans:ital,wght@0,400;0,700;1,400&family=Courier+Prime:ital,wght@0,400;1,400',
  },
  {
    name: 'Marquee',
    note: 'Tall title-card capitals, a clean sans for reading, and a refined serif italic.',
    heading: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
    body: "'Manrope', Helvetica, Arial, sans-serif",
    accent: "'Cormorant Garamond', Georgia, serif",
    display: "'Bebas Neue', Impact, sans-serif",
    tracking: '0.01em',
    scale: 1.12,
    weight: 400,
    google: 'family=Bebas+Neue&family=Manrope:wght@400;700&family=Cormorant+Garamond:ital,wght@1,500',
  },
]
