import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

const C = {
  skin: '#f2cdb3',
  hair: '#9b6b45',
  hairDark: '#865a38',
  blouse: '#fbf7ef',
  skirt: '#6e4b37',
  shoe: '#4a3426',
  gold: '#d6a93c',
  jade: '#5fae8b',
  eyes: '#3b2f2a',
  blush: '#ee9e9a',
  lips: '#c9707a',
}

export const CHARACTER_STYLES = {
  storybook: 'Storybook',
  chibi: 'Chibi',
  rubberhose: '1930s',
  paper: 'Paper doll',
}

// Parker: wavy light-brown bob, white puff-sleeve blouse with a peter pan collar,
// gold chain necklace, long brown skirt. Faces +z. Four drawing styles:
//  storybook  - lanky Reccardi proportions, sleepy lidded eyes (the default)
//  chibi      - big round head on a little body, big sparkly eyes
//  rubberhose - 1930s cartoon: black noodle arms, white gloves, pie-cut eyes, big shoes
//  paper      - a flat paper-doll cutout on a little stand that always faces you
export function createCharacter(style = 'storybook') {
  const root = new THREE.Group()
  const figure = new THREE.Group() // everything; the paper doll flattens this
  const body = new THREE.Group()
  root.add(figure)
  figure.add(body)
  const hose = style === 'rubberhose'
  const chibi = style === 'chibi'

  const skin = toon(C.skin)
  const blouse = toon(C.blouse)

  // Skirt + shoes
  // Reccardi proportions: pinched waist, tall A-line skirt, long neck, big hair
  const skirt = inked(new THREE.CylinderGeometry(0.13, 0.36, 0.88, 24), toon(C.skirt))
  body.add(at(skirt, 0, 0.48, 0))
  for (const x of [-0.09, 0.09]) {
    const shoe = inked(new THREE.SphereGeometry(0.07, 12, 8), toon(hose ? '#141414' : C.shoe), 0.015)
    shoe.scale.set(hose ? 1.6 : 1, hose ? 0.8 : 0.6, hose ? 2.6 : 1.5)
    body.add(at(shoe, x * (hose ? 1.3 : 1), 0.05, hose ? 0.16 : 0.1))
  }

  // Blouse, puff sleeves, collar + bow
  body.add(at(inked(new THREE.CylinderGeometry(0.17, 0.12, 0.38, 20), blouse), 0, 1.1, 0))
  for (const x of [-0.2, 0.2]) body.add(at(inked(new THREE.SphereGeometry(0.1, 14, 10), blouse), x, 1.22, 0))
  body.add(at(inked(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 24), blouse, 0.012), 0, 1.29, 0))
  for (const x of [-0.035, 0.035]) body.add(at(inked(new THREE.SphereGeometry(0.03, 8, 6), blouse, 0.008), x, 1.23, 0.17))

  // Arms swing from the shoulders
  const arms = [-1, 1].map((side) => {
    const pivot = at(new THREE.Group(), side * 0.21, 1.2, 0)
    if (hose) {
      pivot.add(at(inked(new THREE.CapsuleGeometry(0.022, 0.4, 4, 8), toon('#141414'), 0.01), side * 0.03, -0.28, 0))
      const glove = inked(new THREE.SphereGeometry(0.07, 12, 8), toon('#ffffff'), 0.015)
      glove.scale.set(1, 0.9, 0.8)
      pivot.add(at(glove, side * 0.04, -0.52, 0.02))
    } else pivot.add(at(inked(new THREE.CapsuleGeometry(0.03, 0.36, 4, 8), skin, 0.015), side * 0.02, -0.26, 0))
    body.add(pivot)
    return pivot
  })

  // Neck + gold chain with a little jade pendant
  body.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.26, 12), skin), 0, 1.4, 0))
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 6, 24), toon(C.gold))
  chain.rotation.x = Math.PI / 2 - 0.25
  body.add(at(chain, 0, 1.33, 0.01))
  body.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), toon(C.jade)), 0, 1.31, 0.075))

  // Head
  const head = at(new THREE.Group(), 0, 1.72, 0)
  head.scale.set(0.94, 1.1, 0.96) // egg-shaped, Reccardi style
  if (chibi) head.scale.set(1.5, 1.45, 1.5)
  if (hose) head.scale.set(1.12, 1.05, 1.08)
  body.add(head)
  head.add(inked(new THREE.SphereGeometry(0.29, 24, 18), skin))

  // Wavy bob: a cap plus a ring of curls around the jaw, leaving the face open
  const hair = toon(C.hair)
  const cap = inked(new THREE.SphereGeometry(0.315, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), hair)
  head.add(at(cap, 0, 0.02, -0.02))
  const curlGeo = new THREE.SphereGeometry(0.11, 12, 10)
  for (let a = 0.8, i = 0; a < Math.PI * 2 - 0.8; a += 0.38, i++) {
    const curl = inked(curlGeo, i % 2 ? hair : toon(C.hairDark), 0.015)
    curl.scale.set(1, 1.2, 1)
    curl.position.set(Math.sin(a) * 0.27, -0.1 - (i % 2) * 0.05, Math.cos(a) * 0.25 - 0.02)
    head.add(curl)
  }
  const fringe = inked(new THREE.SphereGeometry(0.16, 16, 10), hair, 0.015)
  fringe.scale.set(1.35, 0.5, 0.8)
  fringe.rotation.z = -0.35
  head.add(at(fringe, 0.08, 0.19, 0.17))
  const sweep = inked(new THREE.SphereGeometry(0.09, 12, 8), hair, 0.012)
  sweep.scale.set(0.8, 1.3, 0.7)
  head.add(at(sweep, -0.2, 0.1, 0.18))

  // Face
  const eyeMat = new THREE.MeshBasicMaterial({ color: C.eyes })
  const white = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  for (const x of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 8), eyeMat)
    if (hose) {
      // Pie-cut eyes: tall black ovals with a little white wedge
      eye.scale.set(0.9, 2.3, 0.5)
      head.add(at(eye, x * 0.85, 0.03, 0.27))
      const wedge = new THREE.Mesh(new THREE.CircleGeometry(0.018, 3), white)
      head.add(at(wedge, x * 0.85 + 0.008, 0.06, 0.29))
    } else if (chibi) {
      // Big sparkly eyes
      eye.scale.set(1.5, 1.9, 0.5)
      head.add(at(eye, x * 1.05, -0.01, 0.27))
      head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), white), x * 1.05 + 0.018, 0.02, 0.29))
      head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), white), x * 1.05 - 0.012, -0.03, 0.29))
    } else {
      eye.scale.set(1, 1.3, 0.5)
      head.add(at(eye, x, 0.0, 0.27))
      head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), white), x + 0.012, -0.012, 0.288))
    }
    if (hose || chibi) {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.7 }))
      blush.scale.set(1.3, 0.7, 0.3)
      head.add(at(blush, x * 1.6, -0.07, 0.235))
      continue
    }
    // Heavy, sleepy lids with a flick of lashes
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin)
    lid.scale.set(1.08, 1.0, 0.62)
    head.add(at(lid, x, 0.002, 0.27))
    const lidLine = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.014, 0.01), eyeMat)
    lidLine.rotation.z = x > 0 ? -0.15 : 0.15
    head.add(at(lidLine, x, 0.004, 0.292))
    for (const [dx, dy, r] of [[0.045, 0.012, 0.9], [0.052, 0.0, 0.4]]) {
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.008), eyeMat)
      lash.rotation.z = Math.sign(x) * r
      head.add(at(lash, x + Math.sign(x) * dx, dy, 0.285))
    }
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.01), new THREE.MeshBasicMaterial({ color: C.hairDark }))
    brow.rotation.z = x > 0 ? -0.12 : 0.12
    head.add(at(brow, x, 0.085, 0.272))
    const blush = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.7 }),
    )
    blush.scale.set(1.3, 0.7, 0.3)
    head.add(at(blush, x * 1.6, -0.07, 0.235))
  }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6), new THREE.MeshBasicMaterial({ color: C.lips }))
  mouth.scale.set(1.4, 0.6, 0.4)
  head.add(at(mouth, 0, -0.13, 0.27))
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), skin), 0, -0.05, 0.29))

  if (chibi) {
    // Little body, big head
    for (const child of body.children) if (child !== head) child.scale.multiply(new THREE.Vector3(1, 0.62, 1))
    for (const child of body.children) if (child !== head) child.position.y *= 0.62
    head.position.y = 1.28
  }
  if (style === 'paper') {
    // Flat cardboard cutout with a little easel stand behind
    figure.scale.z = 0.1
    const stand = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 3), toon('#b08a5a'))
    stand.scale.z = 0.3
    root.add(at(stand, 0, 0.45, -0.12))
  }

  let phase = 0
  let elapsed = 0
  return {
    root,
    style,
    // The paper doll always turns to face the viewer
    billboard: style === 'paper',
    // amount: 0 = idle, 1 = full walk
    update(dt, amount) {
      elapsed += dt
      phase += dt * 10 * amount
      const swing = Math.sin(phase) * amount * (hose ? 1.6 : 1)
      // Rubber hose bounces way more, even standing still
      const bob = hose ? 0.12 : 0.06
      body.position.y = Math.abs(Math.sin(phase)) * bob * amount + Math.sin(elapsed * (hose ? 6 : 2)) * (hose ? 0.02 : 0.008)
      body.rotation.x = 0.07 * amount
      arms[0].rotation.x = swing * 0.7
      arms[1].rotation.x = -swing * 0.7
      skirt.rotation.z = swing * 0.05
      head.rotation.z = Math.sin(elapsed * 1.3) * 0.04 * (1 - amount)
    },
  }
}
