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
  candle: 'Blow me out',
  fire: 'Warm your hands',
  fridge: 'Open the fridge',
  plant: 'Water me',
  dog: 'Pet me!',
}

export const INDEX_ORDER = ['typeface', 'ouro', 'resume', 'about', 'drawings', 'aldente', 'brewing', 'contact']

// Scroll chapters, in TOUR order (see world/tour.js). Chapters that match a hotspot
// reuse its kicker/title; `blurb` is the short line on the scroll card.
export const CHAPTERS = {
  intro: { kicker: 'A beach house in San Diego', title: 'Design by Parker Allen', blurb: 'Scroll to walk up to the door. Hover anything that catches your eye.' },
  door: { kicker: 'Knock knock', title: 'Come on in', blurb: 'Mind the husky, it has a beach to run on.' },
  inside: { kicker: 'Make yourself at home', title: 'The whole place', blurb: 'Ocean out back, sun pouring in. Everything with a bubble is clickable.' },
  about: { blurb: 'Designer and illustrator. Pull up a chair by the lamp.' },
  typeface: { blurb: 'Letterforms I drew from scratch.' },
  contact: { blurb: 'The door is always open.' },
  ouro: { blurb: 'A home online for a music collective.' },
  drawings: { blurb: 'That one over the fireplace is mine. So are the rest, even the rug.' },
  aldente: { blurb: 'Pasta mid-cook, and my capstone too. Watch your noodles around the dog.' },
  resume: { blurb: 'Where I have worked and what I have learned.' },
  brewing: { blurb: 'Cold ones in the fridge. Click a can to crack it open.' },
  outro: { kicker: 'Thanks for stopping by', title: 'See you around', blurb: 'Flip the lights with the moon button up top. Say hi to the husky on your way out.' },
}

// What Parker says to you at each stop of the tour
export const LINES = {
  door: "Oh hi! Come on in, the ocean breeze is lovely today.",
  inside: "Make yourself at home. Go ahead, poke around!",
  about: "My reading lamp and my favorite chair. Want to know about me?",
  typeface: "I drew this typeface letter by letter.",
  contact: "The door's always open. Say hi anytime!",
  ouro: "I designed and built Ouro Room's site right here.",
  drawings: "I painted the one over the fireplace. The rest are mine too!",
  aldente: "I'm making pasta! Al Dente is my capstone, and it's cooking too.",
  resume: "Flip through those books. That's my experience.",
  brewing: "Grab a can! That's Bad Decisions Brewing, a product I designed.",
  outro: "Thanks for visiting! Come back soon.",
}
