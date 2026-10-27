import * as THREE from 'three'
import { toon, logs, inked, block, at, hitbox } from './toon.js'
import * as tex from './textures.js'

// Inner wall faces: x = ±6, z = -5. The front (z = +5) is open like a dollhouse.
export const BOUNDS = { minX: -6, maxX: 6, minZ: -5, maxZ: 5 }

const C = {
  wall: '#efe2bf',
  trim: '#8a5634',
  door: '#7b4a2b',
  doorPanel: '#6a3e23',
  brass: '#c9a13b',
  white: '#f3efe6',
  cream: '#efe6d2',
  black: '#1f1d1c',
  pink: '#df8aa4',
  navy: '#2a3f66',
  mustard: '#e8b232',
  green: '#4f8a4b',
  leaf: '#5fa055',
  terracotta: '#c0643c',
  walnut: '#6b3f22',
  leather: '#24201d',
  rackGreen: '#2f6b4a',
  red: '#c8202a',
}

export function buildRoom({ drawings = [], screenArt } = {}) {
  const group = new THREE.Group()
  const colliders = []
  const hotspots = []
  const collide = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ })
  const hotspot = (id, object) => {
    object.userData.hotspot = id
    hotspots.push(object)
    return object
  }
  const add = (object) => (group.add(object), object)

  // Drawings fill these slots in order; Reccardi-style placeholders until then
  let slot = 0
  const drawing = (aspect) => {
    const url = drawings[slot]
    const variant = slot++
    return url ? tex.coverTexture(url, aspect) : tex.artReccardi(variant)
  }
  const frameMat = toon('#2a211b')
  const framed = (w, h) => {
    const frame = new THREE.Group()
    frame.add(block(w + 0.1, h + 0.1, 0.05, frameMat, 0.01))
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: drawing(w / h) }))
    face.position.z = 0.03
    frame.add(face)
    return frame
  }

  // ---------- Shell ----------
  const floorMat = toon('#ffffff', { map: tex.woodFloor() })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), floorMat)
  floor.rotation.x = -Math.PI / 2
  add(floor)
  add(at(block(12.4, 0.4, 10.2, toon('#5a3a22'), 0.05), 0, -0.23, -0.1))

  // ---------- Cottage: log walls, a real window hole, pitched timber roof ----------
  const wallMat = logs('#9a6a43')
  // Back wall is built around the window opening (x -2.25..-0.95, y 1.1..2.4) so you can see the woods
  add(at(block(3.95, 3.2, 0.2, wallMat, 0.01), -4.225, 1.6, -5.1))
  add(at(block(7.15, 3.2, 0.2, wallMat, 0.01), 2.625, 1.6, -5.1))
  add(at(block(1.3, 1.1, 0.2, wallMat, 0.01), -1.6, 0.55, -5.1))
  add(at(block(1.3, 0.8, 0.2, wallMat, 0.01), -1.6, 2.8, -5.1))
  add(at(block(0.2, 3.2, 10.2, wallMat, 0.01), -6.1, 1.6, -0.1))
  add(at(block(0.2, 3.2, 10.2, wallMat, 0.01), 6.1, 1.6, -0.1))

  // Back gable fills the triangle under the roof
  const gable = new THREE.Shape([new THREE.Vector2(-6.2, 0), new THREE.Vector2(6.2, 0), new THREE.Vector2(0, 2.0)])
  add(at(inked(new THREE.ExtrudeGeometry(gable, { depth: 0.2, bevelEnabled: false }), wallMat), 0, 3.2, -5.2))

  // Roof slabs: warm planks inside, mossy shingles on top
  const pitch = Math.atan2(2.0, 6.4)
  const planks = toon('#7a4e30')
  const shingles = toon('#5f5a3a')
  for (const side of [-1, 1]) {
    const slab = at(block(6.9, 0.2, 10.8, planks, 0.02), side * 3.2, 4.25, -0.1)
    slab.rotation.z = -side * pitch
    add(slab)
    const top = at(block(7.0, 0.14, 11.0, shingles, 0.05), side * 3.17, 4.42, -0.1)
    top.rotation.z = -side * pitch
    add(top)
  }
  // Exposed beams
  const beamMat = toon('#4a2f1d')
  for (const z of [-3.6, -1.1, 1.4, 3.9]) add(at(block(12.2, 0.22, 0.24, beamMat, 0.03), 0, 3.1, z))
  add(at(block(0.26, 0.26, 10.8, beamMat, 0.03), 0, 5.05, -0.1))
  for (const z of [-3.6, -1.1, 1.4, 3.9]) {
    const post = at(block(0.16, 1.8, 0.16, beamMat, 0.03), 0, 4.1, z)
    add(post)
  }
  const trimMat = toon(C.trim)
  add(at(block(12, 0.14, 0.05, trimMat, 0.01), 0, 0.07, -4.98))
  add(at(block(0.05, 0.14, 10, trimMat, 0.01), -5.98, 0.07, 0))
  add(at(block(0.05, 0.14, 10, trimMat, 0.01), 5.98, 0.07, 0))

  // ---------- Front door ----------
  const door = new THREE.Group()
  door.add(at(block(1.3, 2.4, 0.05, trimMat, 0.02), 0, 1.2, 0))
  door.add(at(block(1.05, 2.2, 0.08, toon(C.door), 0.02), 0, 1.1, 0.04))
  const panelMat = toon(C.doorPanel)
  for (const x of [-0.22, 0.22]) {
    door.add(at(block(0.34, 0.8, 0.03, panelMat, 0.06), x, 1.55, 0.09))
    door.add(at(block(0.34, 0.6, 0.03, panelMat, 0.02), x, 0.55, 0.09))
  }
  const brass = toon(C.brass)
  door.add(at(inked(new THREE.SphereGeometry(0.045, 16, 12), brass), 0.4, 1.05, 0.13))
  door.add(at(block(0.06, 0.22, 0.02, brass, 0.01), 0.4, 1.05, 0.09))
  add(hotspot('contact', at(door, -4.5, 0, -4.98)))

  // ---------- Window, curtains, paper chain ----------
  const win = new THREE.Group()
  win.add(at(block(1.5, 1.5, 0.1, trimMat, 0.02), 0, 1.75, 0))
  const glassMaterial = new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.15, depthWrite: false })
  win.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), glassMaterial), 0, 1.75, 0.06))
  win.add(at(block(0.05, 1.3, 0.04, trimMat, 0.01), 0, 1.75, 0.08))
  win.add(at(block(1.3, 0.05, 0.04, trimMat, 0.01), 0, 1.75, 0.08))
  win.add(at(block(1.7, 0.06, 0.2, trimMat, 0.02), 0, 0.98, 0.1))
  const curtainMat = toon(C.pink)
  for (const x of [-0.95, 0.95]) win.add(at(block(0.42, 2.3, 0.08, curtainMat, 0.04), x, 1.5, 0.15))
  const rod = inked(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), toon(C.black))
  rod.rotation.z = Math.PI / 2
  win.add(at(rod, 0, 2.68, 0.15))
  const chainColors = ['#f2a7a0', '#9ad0c2', '#f2c230', '#c3a6e0', '#f7f1e3', '#e86a5a']
  const linkGeo = new THREE.TorusGeometry(0.045, 0.014, 6, 12)
  for (let i = 0; i <= 26; i++) {
    const x = -1.25 + (i / 26) * 2.5
    const y = 2.62 - 0.28 * (1 - (x / 1.25) ** 2)
    const link = new THREE.Mesh(linkGeo, toon(chainColors[i % chainColors.length]))
    link.position.set(x, y, 0.22)
    link.rotation.y = i % 2 ? Math.PI / 2 : 0
    win.add(link)
  }
  // Hanging plants in the window
  const leafMat = toon(C.leaf)
  for (const [x, y] of [[-0.4, 2.15], [0.4, 2.3]]) {
    win.add(at(inked(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 12), toon(C.white)), x, y, 0.3))
    for (let i = 0; i < 6; i++) {
      const leaf = inked(new THREE.SphereGeometry(0.07, 10, 8), leafMat, 0.012)
      leaf.position.set(x + Math.sin(i * 2.1) * 0.1, y - 0.05 - i * 0.07, 0.3 + Math.cos(i * 2.1) * 0.06)
      win.add(leaf)
    }
  }
  add(at(win, -1.6, 0, -5.0))

  // ---------- Desk + computer (websites) ----------
  const desk = new THREE.Group()
  const deskMat = toon(C.white)
  desk.add(at(block(1.6, 0.06, 0.7, deskMat, 0.02), 0, 0.76, 0))
  for (const [x, z] of [[-0.74, -0.3], [0.74, -0.3], [-0.74, 0.3], [0.74, 0.3]])
    desk.add(at(block(0.05, 0.74, 0.05, deskMat, 0.01), x, 0.37, z))
  const blackMat = toon(C.black)
  desk.add(at(block(0.25, 0.02, 0.15, blackMat, 0.005), 0, 0.8, -0.15))
  desk.add(at(block(0.05, 0.2, 0.05, blackMat, 0.01), 0, 0.9, -0.15))
  desk.add(at(block(0.74, 0.46, 0.04, blackMat, 0.02), 0, 1.15, -0.15))
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.38), new THREE.MeshBasicMaterial({ map: screenArt ? tex.coverTexture(screenArt, 0.66 / 0.38) : tex.screen('OURO ROOM') }))
  desk.add(at(screen, 0, 1.15, -0.125))
  desk.add(at(inked(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 12), toon('#e9d8f0')), 0.6, 0.86, 0))
  for (const [i, color] of ['#f28c6b', '#f7b2c4', '#f2c230'].entries())
    desk.add(at(inked(new THREE.SphereGeometry(0.05, 10, 8), toon(color), 0.01), 0.57 + i * 0.03, 0.97 + (i % 2) * 0.04, 0.02 * i))
  // White gaming chair with black stripes
  const chair = new THREE.Group()
  chair.add(at(block(0.55, 0.1, 0.5, deskMat, 0.04), 0, 0.5, 0))
  const back = at(block(0.55, 0.85, 0.1, deskMat, 0.05), 0, 1.0, 0.27)
  back.rotation.x = 0.1
  chair.add(back)
  for (const x of [-0.12, 0.12]) {
    const stripe = at(block(0.07, 0.75, 0.02, blackMat, 0.005), x, 1.0, 0.33)
    stripe.rotation.x = 0.1
    chair.add(stripe)
  }
  chair.add(at(block(0.06, 0.4, 0.06, blackMat, 0.01), 0, 0.27, 0))
  chair.add(at(inked(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 5), blackMat), 0, 0.06, 0))
  desk.add(at(chair, 0, 0, 0.7))
  add(hotspot('ouro', at(desk, -1.6, 0, -4.5)))
  collide(-2.45, -0.75, -5, -3.45)

  // ---------- Wall art + typeface poster ----------
  add(hotspot('drawings', at(framed(0.75, 1.05), 0.35, 1.95, -4.97)))
  for (const [z, w, h] of [[-2.7, 0.8, 1.05], [1.0, 0.7, 0.9]]) {
    const poster = at(framed(w, h), -5.97, 1.9, z)
    poster.rotation.y = Math.PI / 2
    add(hotspot('drawings', poster))
  }
  const rightPoster = at(framed(0.7, 0.9), 5.97, 1.9, -0.2)
  rightPoster.rotation.y = -Math.PI / 2
  add(hotspot('drawings', rightPoster))

  const posterTexture = tex.typePoster()
  const poster = new THREE.Group()
  poster.add(at(block(0.05, 1.5, 1.1, toon(C.black), 0.01), 0, 1.85, 0))
  const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: posterTexture.texture }))
  posterFace.rotation.y = Math.PI / 2
  poster.add(at(posterFace, 0.03, 1.85, 0))
  add(hotspot('typeface', at(poster, -5.96, 0, -0.6)))

  // ---------- Antique floor lamp (light switch) ----------
  const lamp = new THREE.Group()
  const bronze = toon('#5b4227')
  lamp.add(at(inked(new THREE.CylinderGeometry(0.16, 0.24, 0.06, 20), bronze), 0, 0.03, 0))
  lamp.add(at(inked(new THREE.SphereGeometry(0.1, 14, 10), bronze), 0, 0.1, 0))
  lamp.add(at(inked(new THREE.CylinderGeometry(0.022, 0.03, 1.4, 10), brass), 0, 0.82, 0))
  for (const y of [0.45, 0.9, 1.3]) lamp.add(at(inked(new THREE.SphereGeometry(0.045, 12, 8), brass), 0, y, 0))
  const shadeMaterial = toon('#f6d77a', { side: THREE.DoubleSide, emissive: '#ffcf70', emissiveIntensity: 0 })
  lamp.add(at(inked(new THREE.CylinderGeometry(0.16, 0.36, 0.42, 24, 1, true), shadeMaterial), 0, 1.62, 0))
  lamp.add(at(inked(new THREE.CylinderGeometry(0.06, 0.16, 0.1, 16, 1, true), shadeMaterial), 0, 1.87, 0))
  lamp.add(at(inked(new THREE.SphereGeometry(0.035, 10, 8), brass), 0, 1.95, 0))
  // Scalloped fringe of little tassels
  const tasselMat = toon('#e3ad44')
  const tasselGeo = new THREE.CylinderGeometry(0.012, 0.004, 0.12, 5)
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    lamp.add(at(new THREE.Mesh(tasselGeo, tasselMat), Math.cos(a) * 0.36, 1.35 - (i % 2) * 0.03, Math.sin(a) * 0.36))
  }
  lamp.add(at(inked(new THREE.TorusGeometry(0.36, 0.018, 6, 32), tasselMat).rotateX(Math.PI / 2), 0, 1.41, 0))
  lamp.add(hitbox(0.7, 2, 0.7))
  add(hotspot('lamp', at(lamp, 1.55, 0, -4.4)))
  collide(1.3, 1.8, -4.65, -4.15)
  const lampLight = new THREE.PointLight('#ffc978', 0, 10, 1.2)
  lampLight.position.set(1.55, 1.55, -4.2)
  add(lampLight)

  // ---------- Big potted plant ----------
  const plant = new THREE.Group()
  plant.add(at(inked(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 16), toon(C.terracotta)), 0, 0.225, 0))
  plant.add(at(inked(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16), toon('#a8502e')), 0, 0.45, 0))
  const foliage = new THREE.Group()
  const leafGeo = new THREE.SphereGeometry(0.16, 12, 8)
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4
    const h = 0.25 + (i / 9) * 0.65
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 5), toon(C.green))
    stem.position.set(Math.cos(a) * 0.06, h / 2, Math.sin(a) * 0.06)
    stem.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
    foliage.add(stem)
    const leaf = inked(leafGeo, toon(i % 2 ? C.leaf : C.green), 0.012)
    leaf.scale.set(1.3, 0.35, 0.8)
    leaf.position.set(Math.cos(a) * (0.12 + h * 0.3), h, Math.sin(a) * (0.12 + h * 0.3))
    leaf.rotation.y = -a
    leaf.rotation.z = 0.3
    foliage.add(leaf)
  }
  plant.add(at(foliage, 0, 0.45, 0))
  plant.userData.foliage = foliage
  add(hotspot('plant', at(plant, 0.75, 0, -4.45)))
  collide(0.5, 1.0, -4.7, -4.2)

  // ---------- Fireplace + mantel ----------
  const brickMat = toon('#ffffff', { map: tex.brick() })
  add(at(block(0.8, 3.2, 3.0, brickMat, 0.01), 5.6, 1.6, -2.7))
  add(at(block(0.1, 0.95, 1.2, toon('#141210'), 0.01), 5.2, 0.62, -2.7))
  add(at(block(0.7, 0.22, 3.0, brickMat, 0.02), 4.95, 0.11, -2.7))
  add(at(block(0.9, 2.6, 1.0, brickMat, 0.02), 5.6, 4.5, -2.7))
  const woodMat = toon('#a8693a')
  add(at(block(0.55, 0.1, 3.3, woodMat, 0.02), 5.0, 1.95, -2.7))
  for (const z of [-3.8, -1.6]) add(at(block(0.3, 0.25, 0.08, woodMat, 0.02), 5.1, 1.78, z))
  // TV on the hearth
  add(at(block(0.06, 0.58, 1.0, blackMat, 0.01), 4.85, 0.55, -2.7))
  add(at(block(0.2, 0.04, 0.3, blackMat, 0.01), 4.85, 0.24, -2.7))
  collide(4.55, 6, -4.3, -1.1)

  // Mantel: art canvases (drawings)
  const art = new THREE.Group()
  for (const [z, h] of [[-0.55, 0.5], [0, 0.46], [0.6, 0.56]]) {
    const canvas = at(block(0.04, h, 0.42, toon('#ffffff', { map: drawing(0.42 / h) }), 0.005), 0.25, h / 2, z)
    canvas.rotation.z = -0.08
    art.add(canvas)
  }
  art.add(at(hitbox(0.5, 0.6, 1.6), 0.15, 0, 0))
  add(hotspot('drawings', at(art, 5.05, 2.0, -3.25)))

  // Mantel: stack of books (experience)
  const books = new THREE.Group()
  for (const [i, color] of ['#e04a2f', '#1f3b73', '#f2c230', '#2a8c84', '#f4ecd8'].entries()) {
    const book = at(block(0.3, 0.06, 0.22, toon(color), 0.01, 0.012), 0, 0.03 + i * 0.062, 0)
    book.rotation.y = (i % 2 ? 1 : -1) * 0.12
    books.add(book)
  }
  for (const [i, color] of ['#7a4fb0', '#e86aa6', '#f28c28'].entries())
    books.add(at(block(0.24, 0.3, 0.05, toon(color), 0.01, 0.012), 0.05, 0.15, -0.22 - i * 0.055))
  books.add(at(hitbox(0.4, 0.45, 0.5), 0, 0, -0.1))
  add(hotspot('resume', at(books, 5.15, 2.0, -2.0)))

  // Mantel: Bad Decisions Brewing bottle
  const bottle = new THREE.Group()
  const glass = toon('#5a2e12')
  bottle.add(at(inked(new THREE.CylinderGeometry(0.05, 0.055, 0.24, 14), glass, 0.012), 0, 0.12, 0))
  bottle.add(at(inked(new THREE.CylinderGeometry(0.02, 0.05, 0.08, 14), glass, 0.012), 0, 0.28, 0))
  bottle.add(at(inked(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 10), glass, 0.01), 0, 0.35, 0))
  bottle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.1, 14), toon('#f2b632')), 0, 0.12, 0))
  bottle.add(at(hitbox(0.25, 0.42, 0.25), 0, 0, 0))
  add(hotspot('brewing', at(bottle, 5.12, 2.0, -4.22)))

  // Mantel: candle + photo frame
  add(at(inked(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 14), toon('#f3e2c0'), 0.012), 5.12, 2.07, -1.45))
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' }))
  flame.scale.y = 1.8
  add(at(flame, 5.12, 2.18, -1.45))
  const candleLight = new THREE.PointLight('#ffb347', 0, 3, 1.5)
  candleLight.position.set(5.0, 2.3, -1.45)
  add(candleLight)
  const frame = at(block(0.03, 0.24, 0.2, blackMat, 0.005), 5.35, 2.12, -1.75)
  frame.rotation.z = -0.1
  add(frame)

  // ---------- Shoe rack + boots ----------
  const rack = new THREE.Group()
  const rackMat = toon(C.rackGreen)
  for (const [x, z] of [[-0.22, -0.55], [0.22, -0.55], [-0.22, 0.55], [0.22, 0.55]])
    rack.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), rackMat), x, 0.75, z))
  for (const y of [0.1, 0.55, 1.0, 1.45]) rack.add(at(block(0.46, 0.03, 1.12, rackMat, 0.01, 0.01), 0, y, 0))
  for (const [i, color] of ['#f2f2f2', '#9aa0a6', '#f2f2f2', '#2b2b2b'].entries())
    rack.add(at(block(0.28, 0.1, 0.16, toon(color), 0.04, 0.012), 0, 0.62 + (i > 1 ? 0.45 : 0), (i % 2 ? 0.2 : -0.2)))
  add(at(rack, 5.65, 0, 1.6))
  const redMat = toon(C.red)
  for (const z of [2.3, 2.48]) {
    add(at(inked(new THREE.CylinderGeometry(0.075, 0.085, 0.55, 12), redMat), 5.25, 0.3, z))
    add(at(block(0.24, 0.08, 0.16, redMat, 0.04), 5.18, 0.04, z))
  }
  for (const z of [0.9, 1.06]) add(at(inked(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 12), toon('#2c3329')), 5.25, 0.2, z))
  collide(5.0, 6, 0.75, 2.65)

  // ---------- Sofa ----------
  const sofa = new THREE.Group()
  const sofaMat = toon(C.cream)
  sofa.add(at(block(1.1, 0.4, 2.5, sofaMat, 0.1), 0, 0.3, 0))
  for (const z of [-0.6, 0.6]) sofa.add(at(block(0.85, 0.16, 1.15, sofaMat, 0.07), 0.08, 0.58, z))
  sofa.add(at(block(0.3, 0.65, 2.5, sofaMat, 0.12), -0.42, 0.75, 0))
  for (const z of [-1.3, 1.3]) sofa.add(at(block(1.1, 0.62, 0.28, sofaMat, 0.12), 0, 0.41, z))
  for (const [z, r] of [[-0.6, 0.15], [0.45, -0.1]]) {
    const pillow = at(block(0.2, 0.45, 0.75, sofaMat, 0.1), -0.2, 0.85, z)
    pillow.rotation.x = r
    sofa.add(pillow)
  }
  add(at(sofa, -2.6, 0, -0.3))
  collide(-3.2, -2.0, -1.75, 1.15)

  // ---------- Rug + coffee table ----------
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5), toon('#ffffff', { map: tex.rug() }))
  rugMesh.rotation.x = -Math.PI / 2
  add(at(rugMesh, -0.2, 0.02, -1.3))
  const rugArt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), toon('#ffffff', { map: drawing(2.5 / 1.7) }))
  rugArt.rotation.x = -Math.PI / 2
  add(at(rugArt, -0.2, 0.03, -1.3))

  const table = new THREE.Group()
  table.add(at(block(1.2, 0.12, 0.72, toon(C.navy), 0.04), 0, 0.44, 0))
  for (const [x, z] of [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]])
    table.add(at(inked(new THREE.CylinderGeometry(0.04, 0.03, 0.4, 8), blackMat), x, 0.2, z))
  table.add(at(inked(new THREE.CylinderGeometry(0.08, 0.11, 0.32, 14), toon('#2f5fb0')), -0.3, 0.66, -0.05))
  const lilyMat = toon('#f7f4ec')
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const lily = inked(new THREE.ConeGeometry(0.07, 0.14, 6, 1, true), lilyMat, 0.01)
    lily.position.set(-0.3 + Math.cos(a) * 0.12, 0.98 + (i % 2) * 0.06, -0.05 + Math.sin(a) * 0.12)
    lily.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8)
    table.add(lily)
    table.add(at(inked(new THREE.SphereGeometry(0.05, 8, 6), leafMat, 0.01), -0.3 + Math.cos(a + 0.6) * 0.09, 0.86, -0.05 + Math.sin(a + 0.6) * 0.09))
  }
  add(at(table, 0, 0, -1.4))
  collide(-0.65, 0.65, -1.8, -1.0)

  // Bowl of pasta (Al Dente capstone)
  const pasta = new THREE.Group()
  const bowlGeo = new THREE.SphereGeometry(0.18, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  const bowl = inked(bowlGeo, toon('#f6f1e6', { side: THREE.DoubleSide }), 0.012)
  bowl.scale.y = 0.6
  pasta.add(at(bowl, 0, 0.11, 0))
  const noodles = inked(new THREE.TorusKnotGeometry(0.09, 0.025, 80, 8, 3, 7), toon('#f1c96b'), 0.008)
  noodles.scale.y = 0.45
  pasta.add(at(noodles, 0, 0.13, 0))
  pasta.add(at(inked(new THREE.SphereGeometry(0.055, 12, 8), toon('#c8322a'), 0.01), 0.02, 0.17, 0))
  pasta.add(at(inked(new THREE.SphereGeometry(0.025, 8, 6), toon('#3f8f3a'), 0.006), -0.03, 0.21, 0.02))
  const fork = at(block(0.025, 0.3, 0.012, toon('#c9ccd2'), 0.004, 0.006), 0.08, 0.25, 0)
  fork.rotation.z = -0.4
  pasta.add(fork)
  pasta.add(hitbox(0.5, 0.4, 0.5))
  add(hotspot('aldente', at(pasta, 0.25, 0.5, -1.35)))

  // ---------- Yellow lounge chair with striped blanket ----------
  const lounge = new THREE.Group()
  const mustardMat = toon(C.mustard)
  lounge.add(at(block(1.1, 0.38, 1.0, mustardMat, 0.18), 0, 0.19, 0))
  const loungeBack = at(block(1.1, 0.95, 0.45, mustardMat, 0.2), 0, 0.6, -0.4)
  loungeBack.rotation.x = -0.35
  lounge.add(loungeBack)
  const blanketMat = toon('#ffffff', { map: tex.blanketStripes() })
  const drape = at(block(0.8, 0.95, 0.05, blanketMat, 0.02, 0.012), 0.1, 0.68, -0.15)
  drape.rotation.x = -0.35
  lounge.add(drape)
  lounge.add(at(block(0.8, 0.05, 0.55, blanketMat, 0.02, 0.012), 0.1, 0.41, 0.15))
  lounge.rotation.y = -0.6
  add(at(lounge, 2.6, 0, 0.3))
  collide(1.95, 3.25, -0.35, 0.95)

  // ---------- Mid-century lounge chair + ottoman (about me) ----------
  const mcm = new THREE.Group()
  const walnut = toon(C.walnut)
  const leather = toon(C.leather)
  const aluminum = toon('#b9bcc2')
  for (let i = 0; i < 5; i++) {
    const leg = at(block(0.42, 0.04, 0.07, aluminum, 0.02, 0.012), 0, 0.06, 0)
    leg.rotation.y = (i / 5) * Math.PI * 2
    leg.translateX(0.2)
    mcm.add(leg)
  }
  mcm.add(at(inked(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), aluminum), 0, 0.2, 0))
  const seat = new THREE.Group()
  seat.add(at(block(0.82, 0.08, 0.78, walnut, 0.06), 0, 0, 0))
  seat.add(at(block(0.72, 0.14, 0.7, leather, 0.06), 0, 0.1, 0.02))
  for (const x of [-0.42, 0.42]) {
    seat.add(at(block(0.1, 0.06, 0.6, walnut, 0.03), x, 0.3, 0.02))
    seat.add(at(block(0.06, 0.28, 0.06, aluminum, 0.02), x, 0.15, 0.1))
  }
  seat.rotation.x = -0.12
  mcm.add(at(seat, 0, 0.4, 0))
  const backrest = new THREE.Group()
  backrest.add(at(block(0.8, 0.62, 0.08, walnut, 0.06), 0, 0, 0))
  backrest.add(at(block(0.7, 0.55, 0.14, leather, 0.07), 0, 0.02, 0.09))
  backrest.add(at(block(0.74, 0.34, 0.08, walnut, 0.06), 0, 0.5, 0))
  backrest.add(at(block(0.64, 0.28, 0.14, leather, 0.07), 0, 0.5, 0.09))
  backrest.rotation.x = -0.32
  mcm.add(at(backrest, 0, 0.82, -0.4))
  mcm.add(hitbox(0.9, 1.4, 0.9))
  mcm.rotation.y = Math.PI / 2.4
  add(hotspot('about', at(mcm, -4.9, 0, 2.6)))
  collide(-5.4, -4.35, 2.05, 3.15)

  const ottoman = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const leg = at(block(0.3, 0.04, 0.06, aluminum, 0.02, 0.012), 0, 0.05, 0)
    leg.rotation.y = (i / 4) * Math.PI * 2 + Math.PI / 4
    leg.translateX(0.14)
    ottoman.add(leg)
  }
  ottoman.add(at(inked(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), aluminum), 0, 0.14, 0))
  ottoman.add(at(block(0.58, 0.07, 0.5, walnut, 0.05), 0, 0.26, 0))
  ottoman.add(at(block(0.52, 0.12, 0.44, leather, 0.05), 0, 0.34, 0))
  ottoman.rotation.y = Math.PI / 2.4
  add(at(ottoman, -4.15, 0, 2.95))
  collide(-4.45, -3.85, 2.7, 3.2)

  return {
    group,
    colliders,
    hotspots,
    lampLight,
    candleLight,
    flame,
    glassMaterial,
    shadeMaterial,
    poster: posterTexture,
  }
}
