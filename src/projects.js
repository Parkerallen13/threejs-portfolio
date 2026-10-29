import ouroHome from './assets/projects/ouro-home.jpg'
import ouroLogoRecord from './assets/ouro/ouro-logo-record.png'
import ouroLogoMotion from './assets/ouro/ouro-logo-motion.png'
import ouroExplorations from './assets/ouro/ouro-logo-explorations.jpg'
import ouroDemo from './assets/ouro/ouro-spring-demo.mp4'
import ouroDemoPoster from './assets/ouro/ouro-spring-poster.jpg'
import hyperdriveBeforeHome from './assets/hyperdrive/before-home.jpg'
import hyperdriveBeforeMel from './assets/hyperdrive/before-mel.jpg'
import aldenteBowl from './assets/projects/aldente-bowl.svg'
import aldenteIcon from './assets/aldente/logo-icon-tan.png'
import aldenteWordmark from './assets/aldente/logo-wordmark.png'
import aldenteNoodle from './assets/aldente/logo-icon-noodle.png'
import brewingLineup from './assets/brewing/cans-lineup.jpg'
import brewingAngle from './assets/brewing/cans-angle.jpg'
import brewingDetail from './assets/brewing/cans-detail.jpg'
import typeStudy from './assets/projects/type-study.svg'

// One entry per project page (projects/<slug>.html). Keep facts here; the page template
// in project.js lays them out as a case study with a spec card.
export const PROJECTS = {
  ouro: {
    title: 'Ouro Room',
    kicker: 'Website · Design + Build',
    tone: 'teal',
    tagline: 'A room for music, people, and the moment.',
    meta: [
      ['Type', 'Brand identity + website'],
      ['Role', 'Founding member · logo, identity, web design + build'],
      ['Built with', 'Illustrator, Photoshop, React + Vite'],
      ['Timeline', '2024 – present · Live'],
    ],
    image: { src: ouroHome, alt: 'The Ouro Room homepage: upcoming events as poster cards on a starry black background' },
    logo: { src: ouroLogoRecord, alt: 'Ouro Music Collective record logo', bg: '#fff4f8' },
    live: {
      heading: 'Step inside',
      note: 'The live site opens in a new tab, starting from its opening splash screen. It doesn’t load inside this page, so the demo below shows it in motion.',
      label: 'Enter Ouro Room',
      href: 'https://ouroroomcollective.com/opening',
    },
    video: {
      heading: 'The spring site, in motion',
      src: ouroDemo,
      poster: ouroDemoPoster,
      caption: 'Screen recording of the spring version of the Ouro Room site.',
      label: 'Demo video of the spring Ouro Room website, scrolling through the events page',
    },
    sections: [
      {
        heading: 'The name',
        body: '<p>Ouro comes from the ouroboros, the snake eating its own tail. Music is always changing, and we believe every ending is a new beginning.</p>',
      },
      {
        heading: 'The brief',
        body: '<p>Ouro Room is a music collective I helped found in 2024 after a Boiler Room show. We book local DJs and bands, find venues for them to play, and give them a platform to grow their audiences. The collective needed a home online for its nights, its sound, and its people.</p>',
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
    identity: {
      heading: 'The identity',
      note: 'I designed the logo and visual identity, moving from Pinterest mood boards and Coolors palettes to concepts in Illustrator and Photoshop, then revising with the team’s feedback.',
      logos: [
        { src: ouroLogoRecord, alt: 'OU·RO Music Collective logo: red italic letters on a pink record-shaped oval', caption: 'Record logo', bg: '#fff' },
        { src: ouroLogoMotion, alt: 'OURO wordmark in yellow italic letters with pink and orange motion offsets', caption: 'Motion wordmark', bg: '#fff' },
      ],
      sheet: {
        src: ouroExplorations,
        alt: 'Illustrator sheet of Ouro logo explorations: the record logo in pink, blue, yellow, and green, plus italic wordmarks in yellow, light blue, gray, and pink',
        caption: 'Exploring color and wordmark variations in Illustrator',
      },
    },
    links: [{ label: 'ouroroomcollective.com', href: 'https://ouroroomcollective.com/opening' }],
  },
  hyperdrive: {
    title: 'Hyperdrive',
    kicker: 'Web App · UX + Front-end',
    tone: 'mustard',
    tagline: 'Making a club’s finances and equipment easier to navigate.',
    meta: [
      ['Type', 'Internal web application'],
      ['Role', 'UI redesign, data visualization, documentation'],
      ['Built with', 'React, TypeScript + Mantine'],
      ['Status', 'Redesign in progress'],
    ],
    image: {
      src: hyperdriveBeforeHome,
      alt: 'Original Hyperdrive home screen with links to equipment, inventory, contacts, expenses, and budget',
    },
    sections: [
      {
        heading: 'The project',
        body: '<p>Hyperdrive is an internal tool for CU Boulder’s Hyperloop team to manage equipment, inventory, contacts, expenses, and budgets. I contributed to the interface redesign, spending visualizations, and project documentation as part of a team.</p>',
      },
      {
        heading: 'Starting point',
        body: '<p>The original screens show the home page and Master Equipment List before the redesign. The dense table made it difficult to scan equipment details, and its columns did not stay aligned across the full width. I’m documenting this baseline while the updated experience is still in progress.</p>',
      },
      {
        heading: 'My contribution',
        list: [
          'Redesigning the interface for clearer hierarchy, readability, and accessibility',
          'Adding visualizations to help the team understand spending',
          'Connecting the tool’s interface to Hyperloop’s visual identity',
          'Documenting the tool’s purpose, features, and how it works',
        ],
      },
    ],
    screenshots: [
      {
        src: hyperdriveBeforeHome,
        alt: 'Original Hyperdrive home screen with a photographic background and navigation buttons',
        caption: 'Before · Home screen',
      },
      {
        src: hyperdriveBeforeMel,
        alt: 'Original Master Equipment List with columns misaligned across the wide table',
        caption: 'Before · Master Equipment List',
      },
    ],
    screenshotHeading: 'Before',
    screenshotNote: 'The redesign is still in progress. These original screens show where the work started; updated comparisons will be added when they’re ready.',
    links: [],
  },
  'ux-audit': {
    title: 'DonorsChoose UX Audit',
    kicker: 'UX Research · Accessibility',
    tone: 'teal',
    tagline: 'Finding ways to make classroom giving easier to navigate.',
    image: {
      src: `${import.meta.env.BASE_URL}images/ux-audit-cover.jpg`,
      alt: 'Title slide for the DonorsChoose UX audit presentation',
    },
    meta: [
      ['Type', 'UX audit'],
      ['Role', 'Research and evaluation'],
      ['Methods', 'Heuristics, WCAG review, persona + user flow'],
      ['Context', 'UX Design 2 · April 2026'],
    ],
    sections: [
      {
        heading: 'The question',
        body: '<p>How might DonorsChoose make it easier for teachers to find support and for donors to confidently fund a classroom? I reviewed key journeys through the public platform, with attention to the homepage, Find a Classroom, About Us, Partner with Us, and Help Center.</p>',
      },
      {
        heading: 'How I evaluated it',
        list: [
          'Reviewed the experience against Nielsen’s 10 usability heuristics',
          'Evaluated screen-reader order, keyboard navigation, focus visibility, and color contrast',
          'Mapped the information architecture and a donor’s path to supporting a classroom',
          'Created a donor persona and reviewed visual design, content, and navigation',
        ],
      },
      {
        heading: 'What I found',
        list: [
          'Strong foundations: clear typography, generous whitespace, helpful teacher information, and keyboard-accessible controls with visible focus',
          'Wayfinding gaps: internal pages often lacked back navigation or clear location cues, making it hard to retrace a path',
          'Unclear calls to action: similar actions used inconsistent labels, and some links led to overlapping information',
          'Accessibility refinements: improve CTA hover contrast, remove redundant nested links and unhelpful status markers, and clarify filter behavior',
          'Mobile opportunity: shorten long pages and address the map layering issue identified in the audit',
        ],
      },
      {
        heading: 'Priorities',
        body: '<p>I prioritized navigation dropdowns and page context, simpler and less repetitive content paths, visible back navigation, and clearer filter rules. Medium-priority improvements included standardizing CTA language, moving teacher stories higher, and increasing hover-state contrast. The audit also calls out strengths to preserve, including keyboard navigation, visible focus, and the platform’s warm visual language.</p>',
      },
    ],
    links: [
      { label: 'Read the full UX audit (PDF)', href: `${import.meta.env.BASE_URL}documents/donorschoose-ux-audit.pdf` },
      { label: 'View the presentation slides (PDF)', href: `${import.meta.env.BASE_URL}documents/donorschoose-ux-audit-slides.pdf` },
    ],
  },
  aldente: {
    title: 'Al Dente',
    kicker: 'Capstone · UX Research',
    tone: 'tomato',
    tagline: 'A community app for recipes and dinner parties, still cooking.',
    image: {
      src: aldenteBowl,
      alt: 'Illustrated three-dimensional bowl of fresh pasta for the Al Dente capstone',
    },
    logo: { src: aldenteIcon, alt: 'Al Dente app icon: green script lettering on a tan rounded square', bg: '#fff' },
    meta: [
      ['Type', 'Capstone · team of 3'],
      ['Role', 'UX research lead'],
      ['Methods', 'Interviews, affinity mapping, Figma prototypes'],
      ['Status', 'In production · Fall 2026 – Spring 2027'],
    ],
    live: {
      heading: 'Follow along',
      note: 'The capstone team posts progress on Instagram while the app comes together.',
      label: '@aldentecapstone on Instagram',
      href: 'https://www.instagram.com/aldentecapstone/',
    },
    sections: [
      {
        heading: "What's cooking",
        body: '<p>Al Dente is a community app for saving recipes, sharing what you cook, and hosting dinner parties to meet people in your neighborhood. It pairs with an e-ink cookbook for mess-free, distraction-free cooking. I lead the research that shapes what we build; the full case study lands here when it is served.</p>',
      },
    ],
    identity: {
      heading: 'Logo directions',
      logos: [
        { src: aldenteIcon, alt: 'Al Dente logo: green script on a tan rounded square', caption: 'Tan app icon', bg: '#fff' },
        { src: aldenteWordmark, alt: 'Al Dente wordmark in green script', caption: 'Wordmark', bg: '#fff' },
        { src: aldenteNoodle, alt: 'Al Dente logo: black script on cream with tan noodle lines in the corner', caption: 'Noodle app icon', bg: '#b3b3b3' },
      ],
    },
    links: [{ label: '@aldentecapstone', href: 'https://www.instagram.com/aldentecapstone/' }],
  },
  brewing: {
    title: 'Bad Decisions Brewing',
    kicker: 'Packaging Design',
    tone: 'mustard',
    tagline: 'A bold, self-aware beer brand with a three-can lineup.',
    meta: [
      ['Type', 'Packaging design'],
      ['Status', 'Packaging renders added · Case study in progress'],
    ],
    image: {
      src: brewingLineup,
      alt: 'Three Bad Decisions Brewing beer-can packaging mockups in pink, mint, and mango',
    },
    sections: [
      {
        heading: 'A little bad, on purpose',
        body: '<p>Bad Decisions Brewing pairs a self-aware voice with a colorful three-flavor Blonde Ale lineup. These 3D renders show Golden Intent, Nonchalant Nectar, and Bold-Move Mango from a few different angles.</p>',
      },
    ],
    screenshots: [
      {
        src: brewingLineup,
        alt: 'Pink, mint, and mango Bad Decisions Brewing cans lined up side by side',
        caption: 'The three-can lineup',
      },
      {
        src: brewingAngle,
        alt: 'Angled 3D view of the three Bad Decisions Brewing can designs',
        caption: 'A closer look at the labels',
      },
      {
        src: brewingDetail,
        alt: 'Side view of the mango can with the Bad Decisions Brewing label',
        caption: 'Packaging from another angle',
      },
    ],
    screenshotHeading: 'Packaging renders',
    screenshotNote: 'These are 3D mockups of the can artwork, not photographs of printed cans.',
    links: [],
  },
  typeface: {
    title: 'My Typeface',
    kicker: 'Type Design',
    tone: 'teal',
    tagline: 'Letterforms I drew from scratch.',
    image: {
      src: typeStudy,
      alt: 'Illustrated type-design preview marked as in progress, not a specimen of the finished custom font',
    },
    meta: [
      ['Type', 'Typeface'],
      ['Status', 'In progress'],
    ],
    sections: [],
    specimen: true,
    links: [],
  },
}

export const PROJECT_ORDER = ['ouro', 'hyperdrive', 'ux-audit', 'aldente', 'brewing', 'typeface']

export const projectUrl = (slug) => `${import.meta.env.BASE_URL}projects/${slug}.html`
