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

// Chibi Parker: wavy light-brown bob, white puff-sleeve blouse with a
// peter pan collar, gold chain necklace, long brown skirt. Faces +z.
export function createCharacter() {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const skin = toon(C.skin)
  const blouse = toon(C.blouse)

  // Skirt + shoes
  const skirt = inked(new THREE.CylinderGeometry(0.19, 0.34, 0.78, 24), toon(C.skirt))
  body.add(at(skirt, 0, 0.45, 0))
  for (const x of [-0.09, 0.09]) {
    const shoe = inked(new THREE.SphereGeometry(0.07, 12, 8), toon(C.shoe), 0.015)
    shoe.scale.set(1, 0.6, 1.5)
    body.add(at(shoe, x, 0.05, 0.1))
  }

  // Blouse, puff sleeves, collar + bow
  body.add(at(inked(new THREE.CylinderGeometry(0.15, 0.2, 0.36, 20), blouse), 0, 1.0, 0))
  for (const x of [-0.21, 0.21]) body.add(at(inked(new THREE.SphereGeometry(0.105, 14, 10), blouse), x, 1.1, 0))
  body.add(at(inked(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 24), blouse, 0.012), 0, 1.18, 0))
  for (const x of [-0.035, 0.035]) body.add(at(inked(new THREE.SphereGeometry(0.03, 8, 6), blouse, 0.008), x, 1.12, 0.17))

  // Arms swing from the shoulders
  const arms = [-1, 1].map((side) => {
    const pivot = at(new THREE.Group(), side * 0.23, 1.08, 0)
    pivot.add(at(inked(new THREE.CapsuleGeometry(0.042, 0.28, 4, 8), skin, 0.015), side * 0.02, -0.22, 0))
    body.add(pivot)
    return pivot
  })

  // Neck + gold chain with a little jade pendant
  body.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 12), skin), 0, 1.27, 0))
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 6, 24), toon(C.gold))
  chain.rotation.x = Math.PI / 2 - 0.25
  body.add(at(chain, 0, 1.22, 0.01))
  body.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), toon(C.jade)), 0, 1.2, 0.08))

  // Head
  const head = at(new THREE.Group(), 0, 1.58, 0)
  head.scale.set(0.94, 1.1, 0.96) // egg-shaped, Reccardi style
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
  for (const x of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 8), eyeMat)
    eye.scale.set(1, 1.3, 0.5)
    head.add(at(eye, x, 0.0, 0.27))
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })), x + 0.012, -0.012, 0.288))
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

  let phase = 0
  let elapsed = 0
  return {
    root,
    // amount: 0 = idle, 1 = full walk
    update(dt, amount) {
      elapsed += dt
      phase += dt * 10 * amount
      const swing = Math.sin(phase) * amount
      body.position.y = Math.abs(Math.sin(phase)) * 0.06 * amount + Math.sin(elapsed * 2) * 0.008
      body.rotation.x = 0.07 * amount
      arms[0].rotation.x = swing * 0.7
      arms[1].rotation.x = -swing * 0.7
      skirt.rotation.z = swing * 0.05
      head.rotation.z = Math.sin(elapsed * 1.3) * 0.04 * (1 - amount)
    },
  }
}
