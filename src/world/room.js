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

export function buildRoom({ drawings = [], screenArt, canArt } = {}) {
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
    frame.add(block(w + 0.1, h + 0.1, 0.05, frameMat, 0.01, undefined, false))
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: drawing(w / h) }))
    face.position.z = 0.04
    frame.add(face)
    return frame
  }

  // ---------- Shell ----------
  const floorMat = toon('#ffffff', { map: tex.woodFloor() })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), floorMat)
  floor.rotation.x = -Math.PI / 2
  add(floor)
  add(at(block(12.4, 0.4, 10.2, toon('#5a3a22'), 0.05), 0, -0.23, -0.1))

  // ---------- Mid-century modern cabin: board siding, low roof with deep overhangs ----------
  const wallMat = toon('#f4f1ea') // white stucco
  const WALL_H = 4.2 // tall, airy ceilings
  const RISE = 1.0 // low-slung roof
  const plaster = toon('#f7f4ee') // bright white plaster
  // Each wall piece is siding outside with a warm plaster lining inside
  const wallPiece = (x0, x1, y0, y1, z) => {
    const inward = -Math.sign(z)
    add(at(block(x1 - x0, y1 - y0, 0.12, wallMat, 0.01), (x0 + x1) / 2, (y0 + y1) / 2, z - inward * 0.04))
    add(at(block(x1 - x0, y1 - y0, 0.08, plaster, 0.01, undefined, false), (x0 + x1) / 2, (y0 + y1) / 2, z + inward * 0.06))
  }
  const sidePiece = (z0, z1, y0, y1, x) => {
    const inward = -Math.sign(x)
    add(at(block(0.12, y1 - y0, z1 - z0, wallMat, 0.01), x - inward * 0.04, (y0 + y1) / 2, (z0 + z1) / 2))
    add(at(block(0.08, y1 - y0, z1 - z0, plaster, 0.01, undefined, false), x + inward * 0.06, (y0 + y1) / 2, (z0 + z1) / 2))
  }
  // Same idea for the side walls, which run along z
  const sideWallWithHoles = (x, holes) => {
    let cursor = -5.2
    for (const h of holes) {
      if (h.z0 > cursor) sidePiece(cursor, h.z0, 0, WALL_H, x)
      if (h.y0 > 0) sidePiece(h.z0, h.z1, 0, h.y0, x)
      if (h.y1 < WALL_H) sidePiece(h.z0, h.z1, h.y1, WALL_H, x)
      cursor = h.z1
    }
    sidePiece(cursor, 5.2, 0, WALL_H, x)
  }
  // A wall along x with rectangular holes (sorted left to right)
  const wallWithHoles = (z, holes) => {
    let cursor = -6.2
    for (const h of holes) {
      if (h.x0 > cursor) wallPiece(cursor, h.x0, 0, WALL_H, z)
      if (h.y0 > 0) wallPiece(h.x0, h.x1, 0, h.y0, z)
      if (h.y1 < WALL_H) wallPiece(h.x0, h.x1, h.y1, WALL_H, z)
      cursor = h.x1
    }
    wallPiece(cursor, 6.2, 0, WALL_H, z)
  }
  const DOOR = { x0: -0.3, x1: 0.9, y0: 0, y1: 2.3 }
  // Big Frank Lloyd Wright-style window walls either side of the door
  const FRONT_WINDOWS = [{ x0: -5.8, x1: -0.9, y0: 0.15, y1: 3.9 }, { x0: 1.5, x1: 5.8, y0: 0.15, y1: 3.9 }]
  // Back: the desk window plus a big picture window over the pond
  const BACK_WINDOW = { x0: 0.75, x1: 5.0, y0: 0.3, y1: 3.9 }
  const DESK_WINDOW = { x0: -3.6, x1: 0.2, y0: 0.3, y1: 3.9 }
  wallWithHoles(-5.1, [DESK_WINDOW, BACK_WINDOW])
  wallWithHoles(5.1, [FRONT_WINDOWS[0], DOOR, FRONT_WINDOWS[1]])
  // Sides: windows between the posters on the left; one by the fireplace and one over the kitchen counter on the right
  const LEFT_WINDOWS = [{ z0: -4.9, z1: -3.25, y0: 0.4, y1: 3.8 }, { z0: 1.6, z1: 4.9, y0: 0.4, y1: 3.8 }]
  const RIGHT_WINDOWS = [{ z0: -1.05, z1: 0.45, y0: 0.4, y1: 3.8 }]
  sideWallWithHoles(-6.1, LEFT_WINDOWS)
  sideWallWithHoles(6.1, RIGHT_WINDOWS)

  // Flat roof: warm planks underneath, a light roof membrane on top, overhanging the porch
  const planks = toon('#7a4e30')
  const snow = toon('#e9e4da') // light roof membrane (was snow)
  const ROOF_T = 0.25
  const F2 = WALL_H + ROOF_T // top of the roof
  const roofUnder = () => WALL_H - 0.02
  add(at(block(13.2, ROOF_T, 14.2, planks, 0.02, undefined, false), 0, WALL_H + ROOF_T / 2, 1.5))
  add(at(block(13.2, 0.14, 14.2, snow, 0.06, undefined, false), 0, F2 + 0.06, 1.5))
  // Exposed beams inside
  const beamMat = toon('#d8c7ad') // whitewashed oak beams
  for (const z of [-3.2, -1.1, 1.4, 3.9]) add(at(block(12.2, 0.22, 0.24, beamMat, 0.03), 0, WALL_H - 0.1, z))
  const trimMat = toon(C.trim)
  add(at(block(12, 0.14, 0.05, trimMat, 0.01), 0, 0.07, -4.98))
  add(at(block(0.05, 0.14, 10, trimMat, 0.01), -5.98, 0.07, 0))
  add(at(block(0.05, 0.14, 10, trimMat, 0.01), 5.98, 0.07, 0))

  // ---------- Front door (swings open at the start of the tour) ----------
  const brass = toon(C.brass)
  const doorFrame = new THREE.Group()
  for (const x of [DOOR.x0 - 0.06, DOOR.x1 + 0.06]) doorFrame.add(at(block(0.12, 2.42, 0.32, trimMat, 0.02), x, 1.21, 0))
  doorFrame.add(at(block(1.44, 0.14, 0.32, trimMat, 0.02), 0.3, 2.37, 0))
  add(at(doorFrame, 0, 0, 5.1))
  const doorHinge = at(new THREE.Group(), DOOR.x0, 0, 5.1)
  const doorLeaf = new THREE.Group()
  doorLeaf.add(at(block(1.18, 2.28, 0.1, toon('#c8322a'), 0.02), 0, 1.14, 0)) // classic mid-century red door
  const panelMat = toon('#a8261f')
  for (const z of [-0.06, 0.06]) {
    for (const y of [0.5, 0.95, 1.4, 1.85]) doorLeaf.add(at(block(0.9, 0.06, 0.03, panelMat, 0.01, 0.008), 0, y, z))
    doorLeaf.add(at(inked(new THREE.SphereGeometry(0.045, 16, 12), brass), 0.45, 1.05, z * 1.8))
  }
  doorLeaf.add(at(inked(new THREE.TorusGeometry(0.2, 0.06, 8, 20), toon('#3d6b45')), 0, 1.75, 0.1))
  doorLeaf.add(at(inked(new THREE.SphereGeometry(0.05, 8, 6), toon('#f2b632'), 0.01), 0, 1.55, 0.14))
  doorLeaf.position.x = 0.59
  doorHinge.add(doorLeaf)
  add(hotspot('contact', doorHinge))

  // Frank Lloyd Wright window walls: teak frames, a grid of mullions, and a band of
  // art-glass accents (little red, gold and teal squares) across the transom
  const glassMaterial = new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })
  const teak = toon('#5b3a22')
  const accents = ['#c8322a', '#e8b232', '#2a8c84'].map((c) => new THREE.MeshBasicMaterial({ color: c }))
  for (const w of FRONT_WINDOWS) {
    const width = w.x1 - w.x0
    const height = w.y1 - w.y0
    const cx = (w.x0 + w.x1) / 2
    add(at(new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMaterial), cx, (w.y0 + w.y1) / 2, 5.1))
    const panes = Math.round(width / 0.8)
    for (let i = 0; i <= panes; i++) {
      const x = w.x0 + (i / panes) * width
      add(at(block(i === 0 || i === panes ? 0.1 : 0.05, height, 0.24, teak, 0.01, 0.01), x, (w.y0 + w.y1) / 2, 5.1))
    }
    const transom = w.y1 - 0.55
    for (const y of [w.y0, transom, w.y1]) add(at(block(width, y === transom ? 0.04 : 0.1, 0.24, teak, 0.01, 0.01), cx, y, 5.1))
    add(at(block(width, 0.03, 0.24, teak, 0.01, 0.01), cx, transom + 0.12, 5.1))
    add(at(block(width, 0.03, 0.24, teak, 0.01, 0.01), cx, w.y1 - 0.12, 5.1))
    for (let i = 0; i < panes; i++) {
      const x = w.x0 + ((i + 0.5) / panes) * width
      for (const [k, dx] of [-0.12, 0, 0.12].entries()) {
        const square = new THREE.Mesh(new THREE.PlaneGeometry(k === 1 ? 0.1 : 0.06, k === 1 ? 0.1 : 0.06), accents[(i + k) % 3])
        square.position.set(x + dx, transom + 0.27, 5.105)
        add(square)
        const back = square.clone()
        back.position.z = 5.095
        back.rotation.y = Math.PI
        add(back)
      }
      // Paired thin verticals, a Prairie-school detail
      for (const dx of [-0.06, 0.06]) add(at(block(0.015, 0.4, 0.22, teak, 0.004, 0.004), x + dx, transom + 0.3, 5.1))
    }
  }

  // Teak-framed glass for the back picture window and side windows
  const gridWindow = (cx, cy, cz, width, height, alongZ) => {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMaterial)
    if (alongZ) glass.rotation.y = Math.PI / 2
    add(at(glass, cx, cy, cz))
    const bar = (w, h, x, y, z) => add(at(alongZ ? block(0.24, h, w, teak, 0.01, 0.01, false) : block(w, h, 0.24, teak, 0.01, 0.01, false), x, y, z))
    const panes = Math.max(1, Math.round(width / 0.75))
    for (let i = 0; i <= panes; i++) {
      const o = -width / 2 + (i / panes) * width
      bar(i === 0 || i === panes ? 0.1 : 0.05, height, alongZ ? cx : cx + o, cy, alongZ ? cz + o : cz)
    }
    for (const o of [-height / 2, height / 2]) bar(width, 0.1, cx, cy + o, cz)
    bar(width, 0.04, cx, cy + height / 2 - 0.45, cz)
  }
  for (const w of [DESK_WINDOW, BACK_WINDOW]) gridWindow((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, -5.1, w.x1 - w.x0, w.y1 - w.y0, false)
  for (const [x, list] of [[-6.1, LEFT_WINDOWS], [6.1, RIGHT_WINDOWS]])
    for (const w of list) gridWindow(x, (w.y0 + w.y1) / 2, (w.z0 + w.z1) / 2, w.z1 - w.z0, w.y1 - w.y0, true)

  // Parker can't walk through the front wall, only the doorway
  collide(-6.2, DOOR.x0, 4.95, 5.25)
  collide(DOOR.x1, 6.2, 4.95, 5.25)

  // ---------- Cozy covered porch ----------
  const deckMat = toon('#9a6a43')
  const deck = at(block(12.8, 0.3, 3.2, deckMat, 0.03), 0, -0.15, 6.85)
  add(deck)
  for (let i = 0; i < 16; i++) add(at(block(0.02, 0.01, 3.1, toon('#7a5233'), 0.004, 0.004), -6 + i * 0.8, 0.005, 6.85))
  // Steps down to the snow, in front of the door
  for (const [i, h] of [0.28, 0.14].entries()) add(at(block(2.2, h, 0.45, deckMat, 0.03), 0.3, -0.44 + h / 2, 8.68 + i * 0.45))
  // Posts holding up the roof overhang, and a low railing
  for (const x of [-6.1, -3.0, 3.6, 6.1]) {
    add(at(block(0.2, roofUnder(x), 0.2, teak, 0.03), x, roofUnder(x) / 2, 8.3))
    if (Math.abs(x) > 5) continue
  }
  for (const [x0, x1] of [[-6.1, -0.9], [1.5, 6.1]]) {
    add(at(block(x1 - x0, 0.08, 0.1, teak, 0.02), (x0 + x1) / 2, 0.85, 8.3))
    for (let x = x0 + 0.4; x < x1; x += 0.4) add(at(block(0.04, 0.85, 0.04, teak, 0.01, 0.008), x, 0.42, 8.3))
  }
  // Two mid-century porch chairs with throws, a side table with mugs, a lantern and a plant
  const chairWood = toon('#6b4426')
  const cushion = [toon('#e8b232'), toon('#2a8c84')]
  const throwMat = toon('#f6f3ec')
  for (const [i, [x, r]] of [[-3.9, 0.3], [-2.3, -0.3]].entries()) {
    const chair = new THREE.Group()
    for (const [lx, lz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) {
      const leg = at(block(0.05, 0.4, 0.05, chairWood, 0.02, 0.01), lx, 0.2, lz)
      leg.rotation.x = lz > 0 ? 0.15 : -0.15
      chair.add(leg)
    }
    chair.add(at(block(0.62, 0.06, 0.55, chairWood, 0.03), 0, 0.4, 0))
    chair.add(at(block(0.56, 0.1, 0.5, cushion[i], 0.05), 0, 0.48, 0.02))
    const back = at(block(0.6, 0.6, 0.06, chairWood, 0.03), 0, 0.78, -0.26)
    back.rotation.x = -0.25
    chair.add(back)
    const backCushion = at(block(0.54, 0.5, 0.08, cushion[i], 0.05), 0, 0.8, -0.2)
    backCushion.rotation.x = -0.25
    chair.add(backCushion)
    for (const ax of [-0.31, 0.31]) chair.add(at(block(0.05, 0.05, 0.5, chairWood, 0.02, 0.01), ax, 0.62, 0.0))
    if (i === 0) {
      const drape = at(block(0.5, 0.6, 0.04, throwMat, 0.02, 0.01), 0.05, 0.65, -0.12)
      drape.rotation.x = -0.25
      chair.add(drape)
    }
    chair.rotation.y = r
    add(at(chair, x, 0, 7.4))
  }
  const sideTable = new THREE.Group()
  sideTable.add(at(inked(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), chairWood), 0, 0.5, 0))
  sideTable.add(at(inked(new THREE.CylinderGeometry(0.03, 0.05, 0.48, 8), chairWood), 0, 0.25, 0))
  for (const [dx, color] of [[-0.08, '#c8322a'], [0.08, '#f4ecd8']]) {
    sideTable.add(at(inked(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), toon(color), 0.006), dx, 0.565, 0))
    const steamPuff = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4 }))
    sideTable.add(at(steamPuff, dx, 0.66, 0))
  }
  add(at(sideTable, -3.1, 0, 7.55))
  const lantern = new THREE.Group()
  lantern.add(at(block(0.18, 0.28, 0.18, toon('#2b2b2b'), 0.03), 0, 0.14, 0))
  lantern.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), new THREE.MeshBasicMaterial({ color: '#ffcf7a' })), 0, 0.14, 0))
  add(at(lantern, 1.25, 0, 5.55))
  const porchLight = new THREE.PointLight('#ffc978', 2.5, 6, 1.5)
  porchLight.position.set(-3, 2.2, 7.2)
  add(porchLight)
  const porchPine = new THREE.Group()
  porchPine.add(at(inked(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 14), toon('#c0643c')), 0, 0.2, 0))
  for (let i = 0; i < 3; i++) {
    const cone = inked(new THREE.SphereGeometry(0.32 - i * 0.05, 10, 6), toon('#3f7a3f'), 0.015)
    cone.scale.set(0.5, 1.4, 1.2)
    cone.position.set((i - 1) * 0.12, 0.75 + i * 0.25, 0)
    porchPine.add(cone)
  }
  add(at(porchPine, 4.8, 0, 7.6))
  // Warm string lights along the porch roof edge
  const bulbMats = ['#ffcf7a', '#ffb347', '#ffe8a8'].map((c) => new THREE.MeshBasicMaterial({ color: c }))
  for (let i = 0; i <= 30; i++) {
    const x = -6.1 + (i / 30) * 12.2
    const sag = 0.18 * Math.sin(((i % 6) / 6) * Math.PI)
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bulbMats[i % 3])
    bulb.position.set(x, roofUnder(x) - 0.12 - sag, 8.45)
    add(bulb)
  }
  add(at(block(1.1, 0.02, 0.6, toon('#7a5233'), 0.01, 0.006), 0.3, 0.012, 5.6)) // welcome mat
  // Little lantern sconces on the front wall: either side of the door and along the porch
  const sconceGlass = new THREE.MeshBasicMaterial({ color: '#ffd28a' })
  for (const x of [-0.65, 1.25, -5.95, 5.95]) {
    const sconce = new THREE.Group()
    sconce.add(at(block(0.06, 0.3, 0.08, toon('#1f1d1c'), 0.01, 0.008), 0, 0, -0.02))
    sconce.add(at(block(0.16, 0.24, 0.16, toon('#1f1d1c'), 0.02, 0.01), 0, -0.02, 0.12))
    sconce.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.11), sconceGlass), 0, -0.02, 0.12))
    sconce.add(at(inked(new THREE.ConeGeometry(0.13, 0.1, 4), toon('#1f1d1c'), 0.008), 0, 0.15, 0.12))
    add(at(sconce, x, 1.9, 5.2))
    if (Math.abs(x) < 2) {
      const glow = new THREE.PointLight('#ffc978', 1.6, 4, 1.6)
      glow.position.set(x, 1.85, 5.6)
      add(glow)
    }
  }

  const leafMat = toon(C.leaf)

  // ---------- Linen curtains framing the desk window ----------
  const curtainMat = toon('#e8dccb') // linen
  for (const x of [-3.85, 0.45]) add(at(block(0.45, 3.7, 0.08, curtainMat, 0.04), x, 1.95, -4.88))
  const rod = inked(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 8), toon(C.black))
  rod.rotation.z = Math.PI / 2
  add(at(rod, -1.7, 3.95, -4.85))

  // ---------- Big walnut desk + mid-century shell chair (websites) ----------
  const desk = new THREE.Group()
  const walnutDesk = toon('#6b4428')
  const blackMat = toon(C.black)
  desk.add(at(block(2.6, 0.07, 0.85, walnutDesk, 0.03), 0, 0.76, 0))
  desk.add(at(block(0.6, 0.4, 0.8, walnutDesk, 0.03), 0.95, 0.52, 0)) // drawer pedestal
  for (const y of [0.42, 0.6]) desk.add(at(block(0.02, 0.02, 0.2, toon(C.brass), 0.008, 0.005), 0.64, y, 0))
  for (const [x, z] of [[-1.22, -0.36], [-1.22, 0.36], [0.6, -0.36], [0.6, 0.36]])
    desk.add(at(block(0.035, 0.74, 0.035, blackMat, 0.012), x, 0.37, z))
  desk.add(at(block(0.28, 0.02, 0.17, blackMat, 0.005), -0.2, 0.8, -0.18))
  desk.add(at(block(0.05, 0.22, 0.05, blackMat, 0.01), -0.2, 0.91, -0.18))
  desk.add(at(block(0.84, 0.5, 0.04, blackMat, 0.02), -0.2, 1.18, -0.18))
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.42), new THREE.MeshBasicMaterial({ map: screenArt ? tex.coverTexture(screenArt, 0.76 / 0.42) : tex.screen('OURO ROOM') }))
  desk.add(at(screen, -0.2, 1.18, -0.155))
  desk.add(at(inked(new THREE.CylinderGeometry(0.06, 0.08, 0.16, 14), toon('#c9b79c')), 0.95, 0.88, -0.2)) // ceramic cup of pens
  for (const [i, color] of ['#b5522f', '#efe6d2', '#c9a46a'].entries())
    desk.add(at(block(0.28, 0.04, 0.2, toon(color), 0.01, 0.01), 0.85, 0.82 + i * 0.042, 0.15))
  // Molded shell chair on a wire "Eiffel" base
  const chair = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4), toon('#efe6d6', { side: THREE.DoubleSide }))
  shell.scale.set(1, 1.1, 1)
  shell.rotation.x = Math.PI
  chair.add(at(shell, 0, 0.82, 0))
  const shellBack = inked(new THREE.CylinderGeometry(0.3, 0.26, 0.42, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8), toon('#efe6d6', { side: THREE.DoubleSide }), 0.01)
  chair.add(at(shellBack, 0, 0.78, 0.02))
  chair.add(at(block(0.5, 0.05, 0.46, toon('#efe6d6'), 0.06), 0, 0.5, 0))
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    const leg = at(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.52, 4), toon('#c9ccd2')), x * 0.9, 0.24, z * 0.9)
    leg.rotation.set(z * 0.5, 0, -x * 0.5)
    chair.add(leg)
  }
  chair.rotation.y = Math.PI
  desk.add(at(chair, -0.2, 0, 0.75))
  add(hotspot('ouro', at(desk, -1.7, 0, -4.4)))
  collide(-3.05, -0.35, -5, -3.4)

  // ---------- Wall art + typeface poster ----------
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
  poster.add(at(block(0.05, 1.5, 1.1, toon(C.black), 0.01, undefined, false), 0, 1.85, 0))
  const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: posterTexture.texture }))
  posterFace.rotation.y = Math.PI / 2
  poster.add(at(posterFace, 0.04, 1.85, 0))
  add(hotspot('typeface', at(poster, -5.96, 0, -0.6)))

  // ---------- Antique floor lamp (the "about me" stop, with the reading chair in its light) ----------
  const lamp = new THREE.Group()
  const bronze = toon('#5b4227')
  lamp.add(at(inked(new THREE.CylinderGeometry(0.16, 0.24, 0.06, 20), bronze), 0, 0.03, 0))
  lamp.add(at(inked(new THREE.SphereGeometry(0.1, 14, 10), bronze), 0, 0.1, 0))
  lamp.add(at(inked(new THREE.CylinderGeometry(0.022, 0.03, 1.4, 10), brass), 0, 0.82, 0))
  for (const y of [0.45, 0.9, 1.3]) lamp.add(at(inked(new THREE.SphereGeometry(0.045, 12, 8), brass), 0, y, 0))
  const shadeMaterial = toon('#f1e6cf', { side: THREE.DoubleSide, emissive: '#ffcf70', emissiveIntensity: 0 })
  lamp.add(at(inked(new THREE.CylinderGeometry(0.3, 0.32, 0.4, 28, 1, true), shadeMaterial), 0, 1.65, 0)) // linen drum shade
  lamp.add(at(inked(new THREE.SphereGeometry(0.035, 10, 8), brass), 0, 1.95, 0))
  lamp.add(hitbox(0.7, 2, 0.7))
  add(hotspot('about', at(lamp, 1.55, 0, -4.4)))
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
  const brickMat = toon('#e3d4bf') // limewashed plaster
  const hearthStone = toon('#cdbfa8')
  add(at(block(0.8, WALL_H, 3.0, brickMat, 0.01), 5.6, WALL_H / 2, -2.7))
  add(at(block(0.1, 1.05, 1.3, toon('#141210'), 0.01), 5.2, 0.72, -2.7))
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 24, 1, false, 0, Math.PI), toon('#141210'))
  arch.rotation.set(0, Math.PI / 2, Math.PI / 2)
  add(at(arch, 5.2, 1.24, -2.7))
  add(at(block(0.7, 0.22, 3.0, hearthStone, 0.02), 4.95, 0.11, -2.7))
  add(at(block(0.9, 2.6, 1.0, brickMat, 0.02), 5.6, WALL_H + 1.3, -2.7))
  const woodMat = toon('#6b4a30')
  add(at(block(0.5, 0.24, 3.4, woodMat, 0.03), 5.0, 2.15, -2.7)) // reclaimed beam mantel
  // The fire: crossed logs + flickering cartoon flames (animated in World)
  const fire = new THREE.Group()
  const logMat = toon('#5a3a22')
  for (const r of [0.5, -0.5]) {
    const log = inked(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 8), logMat, 0.015)
    log.rotation.set(Math.PI / 2, r, 0)
    fire.add(at(log, 0, 0.3, 0))
  }
  const flameMats = ['#ff7a2f', '#ffb347', '#ffe08a'].map((color) => new THREE.MeshBasicMaterial({ color }))
  const flames = []
  for (let i = 0; i < 7; i++) {
    const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.09 - (i % 3) * 0.02, 0.45 - (i % 3) * 0.1, 6), flameMats[i % 3])
    flameMesh.position.set(0.02 * (i % 3), 0.5, -0.35 + (i / 6) * 0.7)
    flameMesh.userData.base = flameMesh.position.y
    fire.add(flameMesh)
    flames.push(flameMesh)
  }
  fire.add(hitbox(0.4, 1.0, 1.2))
  add(hotspot('fire', at(fire, 5.0, 0, -2.7)))
  const fireLight = new THREE.PointLight('#ff8a3d', 4, 7, 1.4)
  fireLight.position.set(4.6, 0.8, -2.7)
  add(fireLight)
  collide(4.55, 6, -4.3, -1.1)

  // Big painting above the fireplace
  const painting = framed(1.5, 1.1)
  painting.rotation.y = -Math.PI / 2
  add(hotspot('drawings', at(painting, 5.18, 3.05, -2.7)))

  // Mantel: a little pottery collection
  for (const [z, r, h, color] of [[-1.1, 0.07, 0.22, '#c9b79c'], [-0.95, 0.05, 0.14, '#2f4a3a'], [-4.0, 0.08, 0.3, '#b5522f']])
    add(at(inked(new THREE.CylinderGeometry(r * 0.6, r, h, 16), toon(color), 0.01), 5.15, 2.0 + h / 2, z))

  // Mantel: candle + photo frame
  const candle = new THREE.Group()
  candle.add(at(inked(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 16), toon('#f3e2c0'), 0.012), 0, 0.12, 0))
  candle.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 4), blackMat), 0, 0.26, 0))
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' }))
  flame.scale.y = 1.8
  candle.add(at(flame, 0, 0.31, 0))
  candle.add(hitbox(0.3, 0.45, 0.3))
  add(hotspot('candle', at(candle, 5.12, 2.0, -1.4)))
  const candleLight = new THREE.PointLight('#ffb347', 0, 3, 1.5)
  candleLight.position.set(5.0, 2.3, -1.45)
  add(candleLight)
  const frame = at(block(0.03, 0.24, 0.2, blackMat, 0.005), 5.35, 2.12, -1.75)
  frame.rotation.z = -0.1
  add(frame)

  // ---------- Shoe rack + boots ----------
  const rack = new THREE.Group()
  const rackMat = toon('#1f1d1c')
  for (const [x, z] of [[-0.22, -0.55], [0.22, -0.55], [-0.22, 0.55], [0.22, 0.55]])
    rack.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), rackMat), x, 0.75, z))
  for (const y of [0.1, 0.55, 1.0, 1.45]) rack.add(at(block(0.46, 0.03, 1.12, rackMat, 0.01, 0.01), 0, y, 0))
  for (const [i, color] of ['#f2f2f2', '#9aa0a6', '#f2f2f2', '#2b2b2b'].entries())
    rack.add(at(block(0.28, 0.1, 0.16, toon(color), 0.04, 0.012), 0, 0.62 + (i > 1 ? 0.45 : 0), (i % 2 ? 0.2 : -0.2)))
  rack.rotation.y = Math.PI / 2
  add(at(rack, -1.3, 0, 4.7))
  const redMat = toon(C.red)
  for (const x of [-2.2, -2.38]) {
    add(at(inked(new THREE.CylinderGeometry(0.075, 0.085, 0.55, 12), redMat), x, 0.3, 4.65))
    add(at(block(0.16, 0.08, 0.24, redMat, 0.04), x, 0.04, 4.58))
  }
  for (const x of [-2.7, -2.86]) add(at(inked(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 12), toon('#2c3329')), x, 0.2, 4.65))
  collide(-2.95, -0.7, 4.35, 5)

  // ---------- Kitchen: long counter run, glass-front uppers, range hood, big island ----------
  // Parker is mid-way through making pasta: water boiling, sauce simmering, a batch
  // draining in the sink, fresh pasta drying on a rack, prep all over the island.
  const cabinet = toon('#f4f1ea') // white shaker
  const quartz = toon('#efece6')
  const zellige = toon('#5f9fbf') // ocean-blue tile backsplash
  // Base cabinets + counter along the right wall
  add(at(block(0.75, 0.9, 3.1, cabinet, 0.03), 5.62, 0.45, 2.1))
  for (const z of [0.95, 1.7, 2.45, 3.2]) {
    add(at(block(0.03, 0.7, 0.62, toon('#e8e3da'), 0.02, 0.01), 5.23, 0.45, z))
    add(at(block(0.02, 0.02, 0.22, brass, 0.008, 0.005), 5.2, 0.72, z))
  }
  add(at(block(0.85, 0.07, 3.2, quartz, 0.02), 5.58, 0.935, 2.1))
  add(at(block(0.04, 1.0, 3.2, zellige, 0.01, undefined, false), 5.96, 1.48, 2.1))
  // Glass-front upper cabinets with dishes inside
  add(at(block(0.4, 1.0, 2.0, cabinet, 0.03), 5.78, 2.55, 2.6))
  for (const z of [1.85, 2.35, 2.85, 3.35]) {
    add(at(block(0.03, 0.85, 0.44, toon('#e8e3da'), 0.02, 0.01), 5.57, 2.55, z))
    add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.7), new THREE.MeshBasicMaterial({ color: '#cfe4ea', transparent: true, opacity: 0.45 })).rotateY(-Math.PI / 2), 5.55, 2.55, z))
    for (let k = 0; k < 3; k++) add(at(inked(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14).rotateZ(Math.PI / 2), toon('#f6f3ee'), 0.006), 5.8, 2.35, z - 0.08 + k * 0.08))
    add(at(inked(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10), toon('#7fb7d6'), 0.006), 5.8, 2.72, z))
  }
  // Range: stainless stove with a white plaster hood above
  const stove = new THREE.Group()
  stove.add(at(block(0.8, 0.9, 0.85, toon('#c9ccd2'), 0.04), 0, 0.45, 0))
  stove.add(at(block(0.78, 0.04, 0.83, blackMat, 0.01), 0, 0.92, 0))
  const burnerGlow = new THREE.MeshBasicMaterial({ color: '#ff7a3a' })
  for (const z of [-0.2, 0.2]) {
    stove.add(at(inked(new THREE.TorusGeometry(0.11, 0.015, 6, 16).rotateX(Math.PI / 2), blackMat, 0.008), 0.08, 0.95, z))
    stove.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 4, 16).rotateX(Math.PI / 2), burnerGlow), 0.08, 0.945, z))
    stove.add(at(inked(new THREE.SphereGeometry(0.035, 8, 6), blackMat, 0.008), -0.42, 0.75, z))
  }
  stove.add(at(block(0.03, 0.3, 0.6, blackMat, 0.02, 0.01), -0.41, 0.4, 0))
  add(at(stove, 5.6, 0, 0.0))
  const hood = new THREE.Group()
  hood.add(at(inked(new THREE.CylinderGeometry(0.35, 0.6, 0.7, 4, 1).rotateY(Math.PI / 4), toon('#f4f1ea'), 0.02), 0, 0, 0))
  hood.add(at(block(0.6, 1.3, 0.6, toon('#f4f1ea'), 0.03), 0, 1.0, 0))
  add(at(hood, 5.65, 2.3, 0.0))
  const hoodLight = new THREE.PointLight('#ffd9a0', 1.5, 3, 1.5)
  hoodLight.position.set(5.4, 1.8, 0)
  add(hoodLight)

  // Big pot at a rolling boil, spaghetti softening into the water
  const pot = new THREE.Group()
  pot.add(at(inked(new THREE.CylinderGeometry(0.2, 0.18, 0.28, 18, 1, true), toon('#b9bcc2', { side: THREE.DoubleSide })), 0, 0.14, 0))
  pot.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.19, 18).rotateX(-Math.PI / 2), toon('#d6e9ee')), 0, 0.24, 0))
  for (const side of [-1, 1]) pot.add(at(block(0.06, 0.03, 0.1, blackMat, 0.01, 0.008), 0, 0.24, side * 0.24))
  const noodleMat = toon('#f1c96b')
  for (let i = 0; i < 14; i++) {
    const noodle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.38, 4), noodleMat)
    noodle.rotation.set((i - 7) * 0.06, 0, 0.3 + (i % 4) * 0.1)
    noodle.position.set(0.05, 0.33, -0.1 + i * 0.015)
    pot.add(noodle)
  }
  const bubbleMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const bubbles = []
  for (let i = 0; i < 10; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), bubbleMat)
    b.userData.phase = i / 10
    b.userData.a = i * 2.4
    pot.add(b)
    bubbles.push(b)
  }
  const steamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false })
  const steam = []
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), steamMat.clone())
    puff.userData.phase = i / 7
    pot.add(puff)
    steam.push(puff)
  }
  pot.add(hitbox(0.5, 0.6, 0.5))
  add(hotspot('aldente', at(pot, 5.52, 0.95, -0.2)))
  // Saute pan of tomato sauce simmering, wooden spoon resting in it
  const sauce = new THREE.Group()
  sauce.add(at(inked(new THREE.CylinderGeometry(0.17, 0.15, 0.06, 18), toon('#2b2b2b'), 0.008), 0, 0.03, 0))
  sauce.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.15, 18).rotateX(-Math.PI / 2), toon('#b8322a')), 0, 0.062, 0))
  sauce.add(at(block(0.3, 0.02, 0.03, toon('#2b2b2b'), 0.01, 0.006), -0.28, 0.05, 0))
  for (let i = 0; i < 6; i++) sauce.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), toon('#d9473a')), Math.cos(i * 1.7) * 0.08, 0.068, Math.sin(i * 1.7) * 0.08))
  const spoon = at(block(0.36, 0.02, 0.03, toon('#b08a5a'), 0.01, 0.006), 0.05, 0.12, 0.05)
  spoon.rotation.set(0, 0.6, 0.35)
  sauce.add(spoon)
  for (let i = 0; i < 4; i++) sauce.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), toon('#4f8a3f')), Math.cos(i * 2) * 0.06, 0.07, Math.sin(i * 2) * 0.06)) // basil
  add(at(sauce, 5.55, 0.95, 0.22))
  // Sink with a colander of drained spaghetti
  add(at(block(0.5, 0.04, 0.7, toon('#c9ccd2'), 0.02, 0.01, false), 5.55, 0.97, 2.1))
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), toon('#c9ccd2')), 5.85, 1.15, 2.1))
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6).rotateZ(Math.PI / 2), toon('#c9ccd2')), 5.73, 1.32, 2.1))
  add(at(inked(new THREE.SphereGeometry(0.17, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#e8e3da', { side: THREE.DoubleSide }), 0.008), 5.55, 1.13, 2.1))
  const drained = inked(new THREE.TorusKnotGeometry(0.1, 0.025, 80, 8, 3, 7), noodleMat, 0.006)
  drained.scale.y = 0.4
  add(at(drained, 5.55, 1.08, 2.1))
  // Countertop bits: olive oil, salt, garlic, a spaghetti box
  add(at(inked(new THREE.CylinderGeometry(0.04, 0.05, 0.26, 10), toon('#5f7a2f'), 0.008), 5.7, 1.1, 0.7))
  add(at(inked(new THREE.CylinderGeometry(0.07, 0.05, 0.06, 12), toon('#f6f3ee'), 0.006), 5.65, 1.0, 0.9))
  add(at(block(0.08, 0.28, 0.2, toon('#2f5fb0'), 0.01, 0.006), 5.75, 1.1, 1.3))

  // Island with three counter stools; fresh pasta drying on a rack, prep in progress
  const island = new THREE.Group()
  island.add(at(block(1.1, 0.9, 2.0, cabinet, 0.04), 0, 0.45, 0))
  island.add(at(block(1.3, 0.08, 2.25, quartz, 0.03), 0, 0.94, 0))
  for (const z of [-0.65, 0, 0.65]) {
    const stool = new THREE.Group()
    stool.add(at(inked(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), toon('#c9a46a'), 0.01), 0, 0.72, 0))
    for (const [lx, lz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) stool.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 4), toon('#6b4428')), lx, 0.35, lz))
    island.add(at(stool, -0.9, 0, z))
  }
  // Cutting board: tomatoes, chopped basil, garlic, a knife
  island.add(at(block(0.4, 0.03, 0.55, toon('#b08a5a'), 0.01), 0.15, 0.995, -0.45))
  for (const [x, z] of [[0.1, -0.6], [0.22, -0.52], [0.15, -0.38]]) island.add(at(inked(new THREE.SphereGeometry(0.045, 10, 8), toon('#d9473a'), 0.006), x, 1.04, z))
  for (let i = 0; i < 8; i++) island.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), toon('#4f8a3f')), 0.05 + (i % 4) * 0.05, 1.02, -0.3 + Math.floor(i / 4) * 0.04))
  for (const x of [0.25, 0.32]) island.add(at(inked(new THREE.SphereGeometry(0.03, 8, 6), toon('#f3ead8'), 0.006), x, 1.02, -0.25))
  island.add(at(block(0.03, 0.01, 0.24, toon('#c9ccd2'), 0.004, 0.004), 0.28, 1.02, -0.6))
  // Pasta drying rack with fresh ribbons
  const dryingRack = new THREE.Group()
  dryingRack.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), toon('#b08a5a')), 0, 0.27, 0))
  for (let k = 0; k < 3; k++) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 4).rotateZ(Math.PI / 2), toon('#b08a5a'))
    arm.rotation.y = (k / 3) * Math.PI
    arm.position.y = 0.52
    dryingRack.add(arm)
    for (let n = 0; n < 4; n++) {
      const strand = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.35), toon('#f3d98a', { side: THREE.DoubleSide }))
      const off = -0.18 + n * 0.12
      strand.position.set(Math.cos((k / 3) * Math.PI) * off, 0.36, -Math.sin((k / 3) * Math.PI) * off)
      strand.rotation.y = (k / 3) * Math.PI
      dryingRack.add(strand)
    }
  }
  island.add(at(dryingRack, 0.1, 0.98, 0.35))
  // Flour dusting, parmesan wedge + grater, a stack of bowls
  const flour = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fbf8f1', transparent: true, opacity: 0.8 }))
  island.add(at(flour, -0.15, 0.985, 0.35))
  island.add(at(inked(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 3), toon('#f2d38a'), 0.006), -0.25, 1.02, 0.75))
  island.add(at(inked(new THREE.CylinderGeometry(0.035, 0.05, 0.22, 4), toon('#c9ccd2'), 0.006), -0.05, 1.09, 0.8))
  for (let k = 0; k < 3; k++) island.add(at(inked(new THREE.CylinderGeometry(0.12 - k * 0.01, 0.08, 0.06, 16), toon('#f6f3ee'), 0.006), 0.3, 1.0 + k * 0.06, 0.8))
  add(at(island, 3.4, 0, 2.2))
  collide(2.75, 4.05, 1.1, 3.3)
  collide(5.15, 6, -0.45, 3.65)

  // ---------- Retro fridge full of Bad Decisions Brewing cans ----------
  const mint = toon('#a8d5c2')
  const fridgeChrome = toon('#d3d6dc')
  const fridge = new THREE.Group()
  // Body is open at the front (-x) so you can see inside when the door swings open
  const W = 0.9 // along z
  const D = 0.75 // along x
  const H = 1.85
  fridge.add(at(block(D, 0.08, W, mint, 0.03), 0, H - 0.04, 0))
  fridge.add(at(block(D, 0.12, W, mint, 0.03), 0, 0.06, 0))
  fridge.add(at(block(0.06, H, W, mint, 0.02), D / 2 - 0.03, H / 2, 0))
  for (const side of [-1, 1]) fridge.add(at(block(D, H, 0.06, mint, 0.02), 0, H / 2, side * (W / 2 - 0.03)))
  const interior = toon('#f3f6f4')
  fridge.add(at(block(0.02, H - 0.2, W - 0.12, interior, 0.005, 0.006), D / 2 - 0.07, H / 2, 0))
  const shelfYs = [0.55, 0.95, 1.35]
  for (const y of shelfYs) fridge.add(at(block(D - 0.12, 0.02, W - 0.12, toon('#dfe8e6'), 0.005, 0.006), 0.02, y, 0))

  // Aluminum cans: label wraps the side, silver lid + tab on top
  const label = canArt ? tex.wrapTexture(canArt) : tex.canLabel()
  const canSide = toon('#ffffff', { map: label })
  const canMetal = toon('#c9ccd2')
  const makeCan = () => {
    const can = new THREE.Group()
    can.add(at(inked(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 24, 1, true), canSide, 0.008), 0, 0.1, 0))
    can.add(at(inked(new THREE.CylinderGeometry(0.052, 0.06, 0.025, 24), canMetal, 0.006), 0, 0.212, 0))
    can.add(at(inked(new THREE.CylinderGeometry(0.06, 0.05, 0.02, 24), canMetal, 0.006), 0, -0.008, 0))
    can.add(at(block(0.03, 0.006, 0.05, canMetal, 0.003, 0.003), 0, 0.227, 0.01))
    return can
  }
  const cans = new THREE.Group()
  for (const [i, y] of shelfYs.entries()) {
    for (let k = 0; k < (i === 1 ? 4 : 3); k++) {
      const can = makeCan()
      can.position.set(-0.12 + (k % 2) * 0.12, y + 0.02, -0.28 + k * 0.18)
      can.rotation.y = -Math.PI / 2 + (k - 1) * 0.3
      cans.add(can)
    }
  }
  // The hero can, front and center
  const hero = makeCan()
  hero.scale.setScalar(1.25)
  hero.position.set(-0.22, 0.97, 0.02)
  hero.rotation.y = -Math.PI / 2
  cans.add(hero)
  cans.add(at(hitbox(0.6, 1.4, 0.8), -0.05, 0.35, 0))
  fridge.add(hotspot('brewing', cans))

  // Door hinged on the back-right edge, swings out toward the room
  const fridgeHinge = at(new THREE.Group(), -D / 2, 0, W / 2)
  const fridgeDoor = new THREE.Group()
  fridgeDoor.add(at(block(0.1, H - 0.04, W, mint, 0.06), -0.05, H / 2, -W / 2))
  fridgeDoor.add(at(block(0.04, 0.5, 0.05, fridgeChrome, 0.02, 0.01), -0.13, 1.15, -W + 0.1))
  fridgeDoor.add(at(inked(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20).rotateZ(Math.PI / 2), fridgeChrome, 0.008), -0.11, 1.65, -W / 2))
  fridgeDoor.add(at(block(0.02, 0.06, 0.3, toon('#c8322a'), 0.01, 0.006), -0.11, 1.45, -W / 2))
  for (const y of [0.45, 0.85, 1.25]) fridgeDoor.add(at(block(0.12, 0.08, W - 0.16, toon('#dfe8e6'), 0.02, 0.006), 0.07, y, -W / 2))
  fridgeHinge.add(fridgeDoor)
  fridge.add(hotspot('fridge', fridgeHinge))
  const fridgeLight = new THREE.PointLight('#e8f6ff', 0, 2.2, 1.5)
  fridgeLight.position.set(-0.1, 1.2, 0)
  fridge.add(fridgeLight)
  add(at(fridge, 5.6, 0, 4.12))
  collide(5.15, 6, 3.65, 4.6)

  // ---------- Sofa ----------
  const sofa = new THREE.Group()
  const sofaMat = toon('#f2ede4') // white linen
  sofa.add(at(block(1.1, 0.4, 2.5, sofaMat, 0.1), 0, 0.3, 0))
  for (const z of [-0.6, 0.6]) sofa.add(at(block(0.85, 0.16, 1.15, sofaMat, 0.07), 0.08, 0.58, z))
  sofa.add(at(block(0.3, 0.65, 2.5, sofaMat, 0.12), -0.42, 0.75, 0))
  for (const z of [-1.3, 1.3]) sofa.add(at(block(1.1, 0.62, 0.28, sofaMat, 0.12), 0, 0.41, z))
  for (const [z, r, color] of [[-0.85, 0.15, '#2f7fa6'], [-0.35, -0.08, '#d9c4a0'], [0.4, 0.1, '#e07a5f'], [0.85, -0.12, '#7fb7d6']]) {
    const pillow = at(block(0.16, 0.42, 0.42, toon(color), 0.1), -0.18, 0.85, z)
    pillow.rotation.x = r
    sofa.add(pillow)
  }
  // Chunky knit throw over the arm
  sofa.add(at(block(1.0, 0.06, 0.5, toon('#d9cdb8'), 0.03), 0.05, 0.74, 1.28))
  for (const x of [-0.55, 0.55]) sofa.add(at(block(0.06, 0.12, 0.06, toon('#6b4428'), 0.02, 0.008), x, 0.06, 0))
  add(at(sofa, -2.6, 0, -0.3))
  collide(-3.2, -2.0, -1.75, 1.15)

  // ---------- Big paper lanterns (Noguchi-style) ----------
  const paper = toon('#f6efe2', { emissive: '#ffe2b0', emissiveIntensity: 0.35 })
  const rib = toon('#b58a55') // rattan ribs
  const paperLantern = (radius, stretch) => {
    const g = new THREE.Group()
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.0, 4), toon('#2b2b2b')), 0, 1.0 + radius * stretch, 0))
    const shade = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), paper)
    shade.scale.y = stretch
    g.add(shade)
    for (let i = -3; i <= 3; i++) {
      const r = radius * Math.sqrt(1 - (i / 4) ** 2)
      g.add(at(new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 4, 32).rotateX(Math.PI / 2), rib), 0, (i / 4) * radius * stretch, 0))
    }
    return g
  }
  add(at(paperLantern(0.55, 0.8), -0.2, 2.9, -1.3))
  add(at(paperLantern(0.32, 1.6), -4.3, 3.0, 2.6))

  // Olive tree in a big terracotta pot by the front windows
  const fig = new THREE.Group()
  fig.add(at(inked(new THREE.CylinderGeometry(0.3, 0.22, 0.55, 16), toon('#b5653f')), 0, 0.27, 0))
  fig.add(at(inked(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 6), toon('#5a3f2c')), 0, 1.0, 0))
  for (let i = 0; i < 14; i++) {
    const leaf = inked(new THREE.SphereGeometry(0.2, 10, 6), toon(i % 2 ? '#8a9a6e' : '#a3b088'), 0.012)
    leaf.scale.set(1.2, 0.7, 1.0)
    const a = i * 2.2
    leaf.position.set(Math.cos(a) * 0.35, 1.5 + (i / 14) * 0.9, Math.sin(a) * 0.35)
    leaf.rotation.set(0.3, -a, 0.4)
    fig.add(leaf)
  }
  add(at(fig, 2.5, 0, 4.5))
  collide(2.2, 2.8, 4.2, 4.8)

  // ---------- Dining: long light-oak table, cane chairs, tapers, a bowl of lemons ----------
  const dining = new THREE.Group()
  const oak = toon('#c9a77e') // light oak
  dining.add(at(block(1.05, 0.1, 3.0, oak, 0.03), 0, 0.76, 0))
  for (const [x, z] of [[-0.4, -1.3], [0.4, -1.3], [-0.4, 1.3], [0.4, 1.3]]) dining.add(at(block(0.12, 0.72, 0.12, oak, 0.03), x, 0.36, z))
  dining.add(at(block(0.36, 0.02, 2.6, toon('#c9a46a'), 0.01, 0.006), 0, 0.82, 0)) // linen runner
  const leafColors = ['#5f8a4f', '#7da36a', '#4f7a45', '#9ab88a'] // olive branch runner
  for (let i = 0; i < 22; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), toon(leafColors[i % 4]))
    leaf.scale.set(1, 0.35, 1.4)
    dining.add(at(leaf, Math.sin(i * 1.7) * 0.12, 0.85, -1.2 + (i / 21) * 2.4))
  }
  const candleWax = toon('#f3ead8')
  const flameMat = new THREE.MeshBasicMaterial({ color: '#ffcf7a' })
  for (let i = 0; i < 5; i++) {
    const z = -0.9 + i * 0.45
    dining.add(at(inked(new THREE.CylinderGeometry(0.035, 0.045, 0.06, 10), brass, 0.006), 0, 0.86, z))
    dining.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), candleWax), 0, 1.04, z))
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), flameMat)
    f.scale.y = 1.8
    dining.add(at(f, 0, 1.22, z))
  }
  for (const x of [-0.33, 0.33]) {
    for (const z of [-1.0, -0.33, 0.33, 1.0]) {
      dining.add(at(inked(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 20), toon('#f4efe6'), 0.006), x, 0.82, z))
      dining.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#d9e6ea', transparent: true, opacity: 0.5 })), x * 1.25, 0.88, z + 0.15))
    }
  }
  for (const [x, z, r, color] of [[0.05, -1.35, 0.08, '#f2c230'], [-0.08, 1.38, 0.08, '#f2c230'], [0.1, 1.2, 0.07, '#f5a623']]) {
    const pumpkin = inked(new THREE.SphereGeometry(r, 14, 10), toon(color), 0.01)
    pumpkin.scale.y = 0.7
    dining.add(at(pumpkin, x, 0.81 + r * 0.7, z))
    dining.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 5), toon('#5a4a2a')), x, 0.81 + r * 1.4, z))
  }
  // Cane-back chairs down both sides
  const cane = toon('#d8c4a0')
  for (const side of [-1, 1]) {
    for (const z of [-0.95, 0, 0.95]) {
      const chair = new THREE.Group()
      chair.add(at(block(0.45, 0.05, 0.45, oak, 0.02), 0, 0.46, 0))
      for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) chair.add(at(block(0.04, 0.46, 0.04, oak, 0.01, 0.008), lx, 0.23, lz))
      chair.add(at(block(0.45, 0.55, 0.04, oak, 0.02), 0, 0.78, -0.21))
      chair.add(at(block(0.36, 0.42, 0.045, cane, 0.02, 0.008), 0, 0.78, -0.21))
      chair.rotation.y = side * Math.PI / 2
      add(at(chair, -4.3 - side * 0.78, 0, 2.6 + z))
    }
  }
  add(at(dining, -4.3, 0, 2.6))
  collide(-5.4, -3.2, 0.9, 4.3)

  // ---------- Rug + coffee table ----------
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5), toon('#ffffff', { map: tex.rug() }))
  rugMesh.rotation.x = -Math.PI / 2
  add(at(rugMesh, -0.2, 0.02, -1.3))
  const rugArt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), toon('#ffffff', { map: drawing(2.5 / 1.7) }))
  rugArt.rotation.x = -Math.PI / 2
  add(at(rugArt, -0.2, 0.03, -1.3))

  const table = new THREE.Group()
  const travertine = toon('#d8c9ae')
  table.add(at(inked(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 40), travertine), 0, 0.45, 0))
  table.add(at(inked(new THREE.CylinderGeometry(0.3, 0.38, 0.4, 24), travertine), 0, 0.2, 0))
  const books = new THREE.Group()
  for (const [i, color] of ['#b5522f', '#efe6d2', '#2f4a3a', '#c9a46a'].entries()) {
    const book = at(block(0.34, 0.045, 0.26, toon(color), 0.01, 0.01), 0, 0.025 + i * 0.047, 0)
    book.rotation.y = (i % 2 ? 1 : -1) * 0.1
    books.add(book)
  }
  books.add(hitbox(0.45, 0.35, 0.4))
  table.add(hotspot('resume', at(books, 0.28, 0.5, -0.15)))
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
  collide(-0.65, 0.65, -2.0, -0.8)

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

  // ---------- Rattan lounge chair with a white throw ----------
  const lounge = new THREE.Group()
  const mustardMat = toon('#c9a46a') // rattan
  lounge.add(at(block(1.1, 0.38, 1.0, mustardMat, 0.18), 0, 0.19, 0))
  const loungeBack = at(block(1.1, 0.95, 0.45, mustardMat, 0.2), 0, 0.6, -0.4)
  loungeBack.rotation.x = -0.35
  lounge.add(loungeBack)
  const blanketMat = toon('#f6f3ec') // soft white throw
  const drape = at(block(0.8, 0.95, 0.05, blanketMat, 0.02, 0.012), 0.1, 0.68, -0.15)
  drape.rotation.x = -0.35
  lounge.add(drape)
  lounge.add(at(block(0.8, 0.05, 0.55, blanketMat, 0.02, 0.012), 0.1, 0.41, 0.15))
  lounge.rotation.y = -0.6
  add(at(lounge, 2.6, 0, 0.3))
  collide(1.95, 3.25, -0.35, 0.95)

  // ---------- Mid-century lounge chair + ottoman, tucked under the lamp ----------
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
  const sheepskin = inked(new THREE.SphereGeometry(0.4, 16, 10), toon('#f3eee4'), 0.015)
  sheepskin.scale.set(0.9, 0.12, 1.1)
  mcm.add(at(sheepskin, 0, 0.62, 0.05))
  mcm.add(hitbox(0.9, 1.4, 0.9))
  mcm.rotation.y = -0.6 // facing out into the room
  add(at(mcm, 2.6, 0, -3.8))
  collide(2.15, 3.05, -4.25, -3.35)

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
  ottoman.rotation.y = -0.6
  add(at(ottoman, 2.12, 0, -3.1))
  collide(1.82, 2.42, -3.4, -2.8)

  return {
    group,
    colliders,
    hotspots,
    lampLight,
    candleLight,
    flames,
    fireLight,
    steam,
    bubbles,
    doorHinge,
    porchLight,
    fridgeHinge,
    fridgeLight,
    flame,
    glassMaterial,
    shadeMaterial,
    poster: posterTexture,
  }
}
