import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

// A rushing mountain river behind the house, like the riverwalk in downtown Estes Park
export const RIVER = { z: -17, width: 8 }
const GROUND_Y = -0.44

// Snowy redwood forest: towering red trunks with snow-capped boughs, an Estes Park-style
// riverwalk out back, drifts, a stone path to the porch, and falling snow.
export function buildForest() {
  const group = new THREE.Group()

  const snow = toon('#eef2f6')
  const ground = new THREE.Mesh(new THREE.CircleGeometry(320, 64), snow)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = GROUND_Y
  group.add(ground)

  const add3 = (o) => (group.add(o), o)

  // Seeded random so the woods look the same on every visit
  let seed = 11
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  // ---------- Redwoods ----------
  const bark = [toon('#8a3f2a'), toon('#7a3624'), toon('#954a31')]
  const bough = toon('#2e4d3a')
  const trunkGeo = new THREE.CylinderGeometry(0.45, 0.85, 1, 10)
  const tierGeo = new THREE.ConeGeometry(1, 1, 9)
  const capGeo = new THREE.ConeGeometry(1, 0.35, 9)

  const clear = (x, z) =>
    (z > 4 && Math.abs(x - 0.3) < 10 && z < 26) || // front yard, porch, driveway, the path you walk up
    Math.abs(z - RIVER.z) < RIVER.width / 2 + 5 || // the river and riverwalk
    (Math.abs(x) < 8 && Math.abs(z) < 7) || // the cottage itself
    (Math.abs(x) < 13 && z < -4) // open view past the cottage to the island edge and space

  let placed = 0
  const redwood = (x, z, height, girth) => {
    placed++
    const tree = new THREE.Group()
    const trunk = inked(trunkGeo, bark[placed % 3], 0.05)
    trunk.scale.set(girth, height, girth)
    trunk.position.y = height / 2
    tree.add(trunk)
    // Boughs start high up, like real redwoods
    const tiers = 4 + Math.floor(rand() * 3)
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers
      const w = (2.6 - t * 1.8) * girth
      const y = height * 0.45 + t * height * 0.6
      const tier = inked(tierGeo, bough, 0.05)
      tier.scale.set(w, 1.8, w)
      tier.position.y = y
      tree.add(tier)
      const cap = new THREE.Mesh(capGeo, snow)
      cap.scale.set(w * 0.75, 1, w * 0.75)
      cap.position.y = y + 0.55
      tree.add(cap)
    }
    tree.position.set(x, GROUND_Y, z)
    group.add(tree)
  }

  // Two giants framing the cottage in the opening shot, one on either side of the path
  redwood(-6.8, 12.5, 26, 1.7)
  redwood(7.6, 11.5, 24, 1.6)
  redwood(-10.5, 6, 22, 1.4)
  redwood(11, 4.5, 23, 1.4)

  let tries = 0
  while (placed < 38 && tries++ < 2000) {
    const angle = rand() * Math.PI * 2
    const radius = 9 + rand() * 18
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (clear(x, z)) continue
    redwood(x, z, 14 + rand() * 10, 0.8 + rand() * 0.6)
  }

  // ---------- River: Estes Park riverwalk ----------
  // Rapids rush over boulders between stacked-stone walls; a flagstone riverwalk with
  // old-fashioned lampposts, benches and planters runs along the near bank, and a little
  // wooden footbridge arches across.
  const flowCanvas = (draw) => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    draw(c.getContext('2d'))
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }
  const waterTex = flowCanvas((ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#3a6a7c')
    g.addColorStop(0.5, '#4f8a9c')
    g.addColorStop(1, '#3a6a7c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 170; i++) {
      ctx.strokeStyle = `rgba(${rand() < 0.5 ? '230,245,250' : '120,170,190'},${0.25 + rand() * 0.5})`
      ctx.lineWidth = 1 + rand() * 3
      const x = rand() * 256
      const y = rand() * 256
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.bezierCurveTo(x + 20, y - 3, x + 40, y + 3, x + 50 + rand() * 40, y)
      ctx.stroke()
    }
  })
  waterTex.repeat.set(10, 1)
  const foamTex = flowCanvas((ctx) => {
    ctx.clearRect(0, 0, 256, 256)
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + rand() * 0.5})`
      ctx.beginPath()
      ctx.ellipse(rand() * 256, rand() * 256, 6 + rand() * 18, 2 + rand() * 4, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  foamTex.repeat.set(14, 1.5)
  const stoneTex = flowCanvas((ctx) => {
    ctx.fillStyle = '#5e5850'
    ctx.fillRect(0, 0, 256, 256)
    for (let row = 0; row < 8; row++) {
      let x = -rand() * 40
      while (x < 256) {
        const w = 30 + rand() * 40
        ctx.fillStyle = ['#a39a8c', '#8f877b', '#b3aa9b', '#968c7c'][Math.floor(rand() * 4)]
        ctx.beginPath()
        ctx.roundRect(x + 2, row * 32 + 2, w - 4, 28, 8)
        ctx.fill()
        x += w
      }
    }
  })
  stoneTex.repeat.set(40, 1)

  const RIVER_LEN = 220
  const waterY = GROUND_Y - 1.1
  const water = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_LEN, RIVER.width), toon('#ffffff', { map: waterTex }))
  water.rotation.x = -Math.PI / 2
  water.position.set(0, waterY, RIVER.z)
  group.add(water)
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_LEN, RIVER.width), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0.75, depthWrite: false }))
  foam.rotation.x = -Math.PI / 2
  foam.position.set(0, waterY + 0.03, RIVER.z)
  group.add(foam)
  // Stacked-stone retaining walls down to the water, capped with snow
  const stone = toon('#ffffff', { map: stoneTex })
  for (const side of [-1, 1]) {
    const z = RIVER.z + side * (RIVER.width / 2 + 0.3)
    add3(at(inked(new THREE.BoxGeometry(RIVER_LEN, 1.4, 0.6), stone, 0.04, false), 0, GROUND_Y - 0.55, z))
    add3(at(new THREE.Mesh(new THREE.BoxGeometry(RIVER_LEN, 0.12, 0.75), snow), 0, GROUND_Y + 0.2, z))
  }
  // Boulders in the current, each with a snow cap and churning foam
  const boulderMat = toon('#7c7a76')
  const foamRingMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })
  const foamRings = []
  for (let i = 0; i < 30; i++) {
    const x = -40 + rand() * 80
    const z = RIVER.z + (rand() - 0.5) * (RIVER.width - 1.4)
    const size = 0.35 + rand() * 0.9
    const b = inked(new THREE.DodecahedronGeometry(size, 1), boulderMat, 0.04)
    b.scale.y = 0.7
    b.position.set(x, waterY + size * 0.3, z)
    group.add(b)
    const cap = new THREE.Mesh(new THREE.SphereGeometry(size * 0.7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), snow)
    cap.scale.y = 0.4
    cap.position.set(x, waterY + size * 0.75, z)
    group.add(cap)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 1.05, size * 0.22, 6, 18).rotateX(Math.PI / 2), foamRingMat)
    ring.position.set(x, waterY + 0.05, z)
    ring.userData.phase = rand() * Math.PI * 2
    ring.userData.size = size
    group.add(ring)
    foamRings.push(ring)
  }
  // Flagstone riverwalk on the near bank
  const walkZ = RIVER.z + RIVER.width / 2 + 1.9
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_LEN, 2.4), toon('#b9b0a2'))
  walk.rotation.x = -Math.PI / 2
  walk.position.set(0, GROUND_Y + 0.02, walkZ)
  group.add(walk)
  for (let i = 0; i < 120; i++) {
    const slab = new THREE.Mesh(new THREE.CircleGeometry(0.25 + rand() * 0.3, 6), toon(rand() < 0.5 ? '#a39a8c' : '#c4bcae'))
    slab.rotation.x = -Math.PI / 2
    slab.position.set(-45 + rand() * 90, GROUND_Y + 0.03, walkZ + (rand() - 0.5) * 2)
    group.add(slab)
  }
  // Old-fashioned black lampposts with warm globes
  const iron = toon('#1f1d1c')
  const globeMat = new THREE.MeshBasicMaterial({ color: '#ffd89a' })
  const lampLights = []
  for (let x = -30; x <= 30; x += 7.5) {
    const post = new THREE.Group()
    post.add(at(inked(new THREE.CylinderGeometry(0.18, 0.25, 0.3, 10), iron, 0.02), 0, 0.15, 0))
    post.add(at(inked(new THREE.CylinderGeometry(0.05, 0.07, 3.0, 8), iron, 0.015), 0, 1.65, 0))
    post.add(at(inked(new THREE.CylinderGeometry(0.16, 0.08, 0.12, 10), iron, 0.012), 0, 3.15, 0))
    post.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), globeMat), 0, 3.38, 0))
    post.add(at(inked(new THREE.ConeGeometry(0.12, 0.14, 8), iron, 0.01), 0, 3.66, 0))
    post.position.set(x, GROUND_Y, walkZ - 1.1)
    group.add(post)
    if (Math.abs(x) < 10) {
      const light = new THREE.PointLight('#ffc978', 3, 9, 1.4)
      light.position.set(x, GROUND_Y + 3.3, walkZ - 1.1)
      group.add(light)
      lampLights.push(light)
    }
  }
  // Benches and wooden planters with little evergreens
  const benchWood = toon('#7a5233')
  for (const x of [-11, 4, 18]) {
    const bench = new THREE.Group()
    bench.add(at(inked(new THREE.BoxGeometry(1.6, 0.08, 0.45), benchWood, 0.02), 0, 0.45, 0))
    bench.add(at(inked(new THREE.BoxGeometry(1.6, 0.4, 0.06), benchWood, 0.02), 0, 0.75, -0.22))
    for (const lx of [-0.7, 0.7]) bench.add(at(inked(new THREE.BoxGeometry(0.06, 0.45, 0.45), iron, 0.01), lx, 0.22, 0))
    bench.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.45), snow), 0, 0.52, 0))
    bench.rotation.y = Math.PI
    bench.position.set(x, GROUND_Y, walkZ + 0.8)
    group.add(bench)
  }
  for (const x of [-15, -2, 9, 23]) {
    const planter = new THREE.Group()
    planter.add(at(inked(new THREE.BoxGeometry(0.9, 0.6, 0.9), benchWood, 0.02), 0, 0.3, 0))
    planter.add(at(inked(new THREE.ConeGeometry(0.4, 1.1, 8), toon('#2e4d3a'), 0.02), 0, 1.15, 0))
    planter.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.35, 8), snow), 0, 1.5, 0))
    planter.position.set(x, GROUND_Y, walkZ + 0.9)
    group.add(planter)
  }
  // Arched wooden footbridge across the river
  const bridge = new THREE.Group()
  const span = RIVER.width + 2.5
  for (let i = 0; i < 14; i++) {
    const t = i / 13
    const z = (t - 0.5) * span
    const y = Math.sin(t * Math.PI) * 0.8
    bridge.add(at(inked(new THREE.BoxGeometry(2.0, 0.1, span / 13 + 0.02), benchWood, 0.012), 0, y, z))
    bridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, span / 13), snow), 0, y + 0.07, z))
    for (const x of [-0.95, 0.95]) {
      bridge.add(at(inked(new THREE.BoxGeometry(0.08, 0.9, 0.08), benchWood, 0.01), x, y + 0.45, z))
    }
  }
  bridge.position.set(9, GROUND_Y + 0.1, RIVER.z)
  group.add(bridge)
  // Spray drifting up off the rapids
  const sprayCount = 260
  const sprayPos = new Float32Array(sprayCount * 3)
  const sprayReset = (i) => {
    const ring = foamRings[i % foamRings.length]
    sprayPos[i * 3] = ring.position.x + (rand() - 0.5) * ring.userData.size * 2
    sprayPos[i * 3 + 1] = waterY + rand() * 0.2
    sprayPos[i * 3 + 2] = ring.position.z + (rand() - 0.5) * ring.userData.size * 2
  }
  for (let i = 0; i < sprayCount; i++) {
    sprayReset(i)
    sprayPos[i * 3 + 1] += rand() * 1.2
  }
  const sprayGeo = new THREE.BufferGeometry()
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3))
  group.add(new THREE.Points(sprayGeo, new THREE.PointsMaterial({ color: '#f4fbff', size: 0.08, transparent: true, opacity: 0.7, depthWrite: false })))

  // ---------- Snow drifts + a stone path to the door ----------
  for (let i = 0; i < 26; i++) {
    const drift = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), snow)
    const angle = rand() * Math.PI * 2
    const radius = 8 + rand() * 18
    drift.position.set(Math.cos(angle) * radius, GROUND_Y, Math.sin(angle) * radius)
    drift.scale.set(1 + rand() * 2, 0.3 + rand() * 0.4, 1 + rand() * 2)
    group.add(drift)
  }
  const flagstone = toon('#a39a8e')
  for (let i = 0; i < 8; i++) {
    const stone = inked(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 7), flagstone, 0.015)
    stone.position.set(0.3 + Math.sin(i * 1.3) * 0.25, GROUND_Y + 0.03, 9.8 + i * 1.1)
    group.add(stone)
  }

  // ---------- Falling snow ----------
  const count = 1800
  const positions = new Float32Array(count * 3)
  const spawn = (i, y) => {
    let x = (rand() - 0.5) * 60
    const z = -25 + rand() * 55
    // Keep flakes out of the cottage
    if (Math.abs(x) < 6.6 && z > -5.6 && z < 5.6) x = Math.sign(x || 1) * (6.8 + rand() * 4)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }
  for (let i = 0; i < count; i++) spawn(i, rand() * 18)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const snowfall = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: '#ffffff', size: 0.07, transparent: true, opacity: 0.9, depthWrite: false }),
  )
  group.add(snowfall)

  return {
    group,
    update(dt, elapsed) {
      // The river rushes past, foam a little faster than the water
      waterTex.offset.x -= dt * 0.35
      foamTex.offset.x -= dt * 0.6
      for (const ring of foamRings) ring.scale.setScalar(1 + Math.sin(elapsed * 6 + ring.userData.phase) * 0.12)
      const sp = sprayGeo.attributes.position
      for (let i = 0; i < sprayCount; i++) {
        const y = sp.getY(i) + dt * 0.8
        if (y > waterY + 1.4) {
          sprayReset(i)
          sp.setXYZ(i, sprayPos[i * 3], sprayPos[i * 3 + 1], sprayPos[i * 3 + 2])
        } else sp.setXYZ(i, sp.getX(i) + dt * 0.6, y, sp.getZ(i))
      }
      sp.needsUpdate = true

      const p = geometry.attributes.position
      for (let i = 0; i < count; i++) {
        let y = p.getY(i) - dt * (0.6 + (i % 5) * 0.08)
        if (y < GROUND_Y) {
          spawn(i, 18)
          continue
        }
        p.setY(i, y)
        p.setX(i, p.getX(i) + Math.sin(elapsed * 0.7 + i) * dt * 0.15)
      }
      p.needsUpdate = true
    },
  }
}
