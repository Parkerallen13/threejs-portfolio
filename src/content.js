// Everything you can click in the living room. `bubble` is the hover speech bubble.
export const HOTSPOTS = {
  about: {
    bubble: 'About me',
    kicker: 'About',
    title: "Hi, I'm Parker",
    body: `<p>I'm a designer and illustrator who builds websites that feel like places, like this one. You're standing in a cartoon version of my actual living room.</p>
      <p>Walk around and poke at things. Most of them lead somewhere.</p>`,
    links: [{ label: 'Instagram', href: 'https://www.instagram.com/designbyparkerallen/' }],
  },
  ouro: {
    bubble: "Websites I've built",
    kicker: 'Website · Design + Build',
    title: 'Ouro Room',
    body: '<p>Site for a music collective: events, DJ mixes, artist profiles, a photo gallery, and a custom admin for adding it all.</p>',
    links: [{ label: 'Visit ouroroomcollective.com', href: 'https://ouroroomcollective.com/home' }],
  },
  aldente: {
    bubble: 'Al Dente: my capstone',
    kicker: 'Capstone · In Production',
    title: 'Al Dente',
    body: '<p>My capstone project, still cooking. Follow along as it comes together.</p>',
    links: [{ label: '@aldentecapstone', href: 'https://www.instagram.com/aldentecapstone/' }],
  },
  brewing: {
    bubble: 'Bad Decisions Brewing',
    kicker: 'Product Design',
    title: 'Bad Decisions Brewing',
    body: '<p>A product design assignment. Full case study coming soon.</p>',
    links: [],
  },
  drawings: {
    bubble: 'My drawings',
    kicker: 'Illustration',
    title: 'Drawings',
    body: '<p>Sketchbook pages, posters, and characters.</p>',
    links: [{ label: '@designbyparkerallen', href: 'https://www.instagram.com/designbyparkerallen/' }],
  },
  typeface: {
    bubble: 'A typeface I designed',
    kicker: 'Type Design',
    title: 'My Typeface',
    body: `<div class="specimen">
        <p class="specimen__big">Aa</p>
        <p class="specimen__set">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 &amp;!?</p>
        <p class="specimen__line">Bad decisions make good stories.</p>
      </div>`,
    links: [],
  },
  resume: {
    bubble: 'My experience',
    kicker: 'Experience',
    title: 'Experience',
    body: '<p>Resume coming soon.</p>',
    links: [],
  },
  contact: {
    bubble: 'Say hi!',
    kicker: 'Contact',
    title: 'Say hi!',
    body: '<p>Got a project, a question, or a good pasta recipe?</p>',
    links: [
      { label: 'hello@example.com', href: 'mailto:hello@example.com' },
      { label: '@designbyparkerallen', href: 'https://www.instagram.com/designbyparkerallen/' },
    ],
  },
}

HOTSPOTS.me = { ...HOTSPOTS.about, bubble: "Hi, I'm Parker!" }

// Things that do something in the room instead of opening a panel
export const ACTION_LABELS = {
  lamp: 'Lights!',
  plant: 'Water me',
  mini: 'Beep beep!',
}

export const INDEX_ORDER = ['about', 'ouro', 'aldente', 'brewing', 'drawings', 'typeface', 'resume', 'contact']

// Scroll chapters, in TOUR order (see world/tour.js). Chapters that match a hotspot
// reuse its kicker/title; `blurb` is the short line on the scroll card.
export const CHAPTERS = {
  intro: { kicker: 'Welcome in', title: 'Design by Parker Allen', blurb: "This is my living room. Scroll to look around; hover anything that catches your eye." },
  about: { blurb: "Designer and illustrator. Pull up a chair." },
  typeface: { blurb: 'Letterforms I drew from scratch.' },
  contact: { blurb: 'The door is always open.' },
  ouro: { blurb: 'A home online for a music collective.' },
  drawings: { blurb: 'Procreate pieces hung all over the house, even the rug.' },
  aldente: { blurb: 'My capstone, still simmering.' },
  resume: { blurb: 'Where I have worked and what I have learned.' },
  brewing: { blurb: 'A product design assignment with a good name.' },
  outro: { kicker: 'Thanks for stopping by', title: 'See you around', blurb: 'Click the lamp to flip the lights. Watch out for the Mini.' },
}
