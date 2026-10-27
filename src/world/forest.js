import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

export const POND = { x: -9, z: 10, r: 3.2 }
const GROUND_Y = -0.44

// Snowy redwood forest around the cottage: towering red trunks with snow-capped boughs,
// a half-frozen pond with rocks and reeds, drifts, and falling snow.
export function buildForest() {
  const group = new THREE.Group()

  const snow = toon('#eef2f6')
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), snow)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = GROUND_Y
  group.add(ground)

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
    (z > 4 && Math.abs(x - 0.3) < 7 && z < 24) || // front yard + the path you walk up
    Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.8 || // the pond
    (Math.abs(x) < 8 && Math.abs(z) < 7) // the cottage itself

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
  while (placed < 52 && tries++ < 2000) {
    const angle = rand() * Math.PI * 2
    const radius = 9 + rand() * 34
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (clear(x, z)) continue
    redwood(x, z, 14 + rand() * 10, 0.8 + rand() * 0.6)
  }

  // ---------- Pond: dark water ringed with ice, rocks and reeds ----------
  const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 40), toon('#3d6478'))
  water.rotation.x = -Math.PI / 2
  water.position.set(POND.x, GROUND_Y + 0.02, POND.z)
  group.add(water)
  const ice = new THREE.Mesh(new THREE.RingGeometry(POND.r * 0.55, POND.r, 40), toon('#bcd8e4'))
  ice.rotation.x = -Math.PI / 2
  ice.position.set(POND.x, GROUND_Y + 0.03, POND.z)
  group.add(ice)
  const rock = toon('#8a8a84')
  const reed = toon('#7a6a3c')
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3
    const r = POND.r + 0.2 + rand() * 0.3
    const x = POND.x + Math.cos(a) * r
    const z = POND.z + Math.sin(a) * r
    if (i % 3 === 0) {
      for (let k = 0; k < 4; k++) {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.9 + rand() * 0.5, 4), reed)
        stalk.position.set(x + (rand() - 0.5) * 0.3, GROUND_Y + 0.5, z + (rand() - 0.5) * 0.3)
        stalk.rotation.z = (rand() - 0.5) * 0.3
        group.add(stalk)
      }
    } else {
      const stone = inked(new THREE.DodecahedronGeometry(0.25 + rand() * 0.3, 0), rock, 0.02)
      stone.position.set(x, GROUND_Y + 0.05, z)
      stone.scale.y = 0.55
      group.add(stone)
      const dusting = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), snow)
      dusting.position.set(x, GROUND_Y + 0.14, z)
      dusting.scale.set(1, 0.4, 1)
      group.add(dusting)
    }
  }

  // ---------- Snow drifts + a stone path to the door ----------
  for (let i = 0; i < 26; i++) {
    const drift = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), snow)
    const angle = rand() * Math.PI * 2
    const radius = 8 + rand() * 20
    drift.position.set(Math.cos(angle) * radius, GROUND_Y, Math.sin(angle) * radius)
    drift.scale.set(1 + rand() * 2, 0.3 + rand() * 0.4, 1 + rand() * 2)
    group.add(drift)
  }
  const flagstone = toon('#a39a8e')
  for (let i = 0; i < 8; i++) {
    const stone = inked(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 7), flagstone, 0.015)
    stone.position.set(0.3 + Math.sin(i * 1.3) * 0.25, GROUND_Y + 0.03, 6.0 + i * 1.1)
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
