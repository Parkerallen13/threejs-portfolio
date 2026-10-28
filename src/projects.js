import ouroHome from './assets/projects/ouro-home.jpg'

// One entry per project page (projects/<slug>.html). Keep facts here; the page template
// in project.js lays them out in the retro ticket-stub style.
export const PROJECTS = {
  ouro: {
    title: 'Ouro Room',
    kicker: 'Website · Design + Build',
    tone: 'teal',
    tagline: 'A room for music, people, and the moment.',
    meta: [
      ['Type', 'Website'],
      ['Role', 'Design + development'],
      ['Built with', 'React + Vite'],
      ['Status', 'Live'],
    ],
    image: { src: ouroHome, alt: 'The Ouro Room homepage: upcoming events as poster cards on a starry black background' },
    sections: [
      {
        heading: 'The brief',
        body: '<p>Ouro Room is a music collective of local selectors and friends. They needed a home online for their nights, their sound, and their people.</p>',
      },
      {
        heading: 'What I made',
        list: [
          'Upcoming and past events, each with its own poster and details',
          'DJ mixes from SoundCloud, Spotify, or uploaded audio',
          'Artist profiles, linked both ways to their mixes',
          'A photo gallery from nights at the room',
          'A custom admin so the collective can add events, mixes, artists, and photos themselves',
        ],
      },
    ],
    links: [{ label: 'Visit ouroroomcollective.com', href: 'https://ouroroomcollective.com/home' }],
  },
  aldente: {
    title: 'Al Dente',
    kicker: 'Capstone · In Production',
    tone: 'tomato',
    tagline: 'My capstone project, still cooking.',
    meta: [
      ['Type', 'Capstone'],
      ['Status', 'In production'],
    ],
    sections: [
      {
        heading: "What's cooking",
        body: '<p>Al Dente is my capstone project. Follow along on Instagram as it comes together; the full case study lands here when it is served.</p>',
      },
    ],
    links: [{ label: '@aldentecapstone', href: 'https://www.instagram.com/aldentecapstone/' }],
  },
  brewing: {
    title: 'Bad Decisions Brewing',
    kicker: 'Product Design',
    tone: 'mustard',
    tagline: 'A product design assignment with a good name.',
    meta: [
      ['Type', 'Product design'],
      ['Status', 'Case study coming soon'],
    ],
    sections: [
      {
        heading: 'On tap soon',
        body: '<p>The full case study for this product design assignment is on its way.</p>',
      },
    ],
    links: [],
  },
  drawings: {
    title: 'Drawings',
    kicker: 'Illustration',
    tone: 'tomato',
    tagline: 'Sketchbook pages, posters, and characters.',
    meta: [
      ['Type', 'Illustration'],
      ['Medium', 'Procreate + ink'],
    ],
    sections: [],
    gallery: true,
    links: [{ label: '@designbyparkerallen', href: 'https://www.instagram.com/designbyparkerallen/' }],
  },
  typeface: {
    title: 'My Typeface',
    kicker: 'Type Design',
    tone: 'teal',
    tagline: 'Letterforms I drew from scratch.',
    meta: [
      ['Type', 'Typeface'],
      ['Status', 'In progress'],
    ],
    sections: [],
    specimen: true,
    links: [],
  },
}

export const PROJECT_ORDER = ['ouro', 'aldente', 'brewing', 'drawings', 'typeface']

export const projectUrl = (slug) => `${import.meta.env.BASE_URL}projects/${slug}.html`
