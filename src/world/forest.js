import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

// The woods around the cottage: storybook trees with gnarled trunks and puffy crowns,
// a few pines, mushrooms and rocks, plus fireflies that come out at night.
export function buildForest() {
  const group = new THREE.Group()

  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), toon('#6f8f4e'))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.44
  group.add(ground)

  // Seeded random so the woods look the same on every visit
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  const bark = [toon('#4a3426'), toon('#5a3f2c')]
  const leaves = [toon('#3f6b3a'), toon('#56804a'), toon('#4b7444')]
  const pine = toon('#2f5a3e')
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 1, 8)
  const crownGeo = new THREE.SphereGeometry(1, 12, 9)
  const coneGeo = new THREE.ConeGeometry(1, 1.6, 8)

  let placed = 0
  while (placed < 46) {
    const angle = rand() * Math.PI * 2
    const radius = 9 + rand() * 24
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    // Keep a clearing in front of the cottage so the opening shot can see in
    if (z > 4 && Math.abs(x) < 6 && radius < 18) continue
    placed++

    const tree = new THREE.Group()
    const h = 3 + rand() * 3
    if (rand() < 0.35) {
      const trunk = at(inked(trunkGeo, bark[0], 0.03), 0, 0.6, 0)
      trunk.scale.set(0.7, 1.2, 0.7)
      tree.add(trunk)
      for (let i = 0; i < 3; i++) {
        const cone = inked(coneGeo, pine, 0.04)
        const s = 1.4 - i * 0.35
        cone.scale.set(s, 1, s)
        cone.position.y = 1.4 + i * 1.0
        tree.add(cone)
      }
    } else {
      const trunk = inked(trunkGeo, bark[placed % 2], 0.03)
      trunk.scale.set(1, h, 1)
      trunk.position.y = h / 2
      trunk.rotation.z = (rand() - 0.5) * 0.2
      tree.add(trunk)
      for (let i = 0; i < 4; i++) {
        const crown = inked(crownGeo, leaves[(placed + i) % 3], 0.04)
        const s = 1.0 + rand() * 0.7
        crown.scale.set(s, s * 0.8, s)
        crown.position.set((rand() - 0.5) * 1.6, h + (rand() - 0.2) * 0.9, (rand() - 0.5) * 1.6)
        tree.add(crown)
      }
    }
    tree.position.set(x, -0.44, z)
    tree.scale.setScalar(0.9 + rand() * 0.5)
    group.add(tree)
  }

  // Red-cap mushrooms and mossy rocks by the cottage
  const cap = toon('#c8322a')
  const stem = toon('#f1e6d0')
  const rock = toon('#8a8a7e')
  for (let i = 0; i < 14; i++) {
    const angle = rand() * Math.PI * 2
    const radius = 7 + rand() * 5
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (rand() < 0.6) {
      const shroom = new THREE.Group()
      shroom.add(at(inked(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8), stem, 0.012), 0, 0.12, 0))
      shroom.add(at(inked(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap, 0.015), 0, 0.22, 0))
      for (let d = 0; d < 4; d++) {
        const a = d * 1.6
        shroom.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), stem), Math.cos(a) * 0.1, 0.36, Math.sin(a) * 0.1))
      }
      shroom.position.set(x, -0.44, z)
      group.add(shroom)
    } else {
      const r = inked(new THREE.DodecahedronGeometry(0.3 + rand() * 0.3, 0), rock, 0.02)
      r.position.set(x, -0.35, z)
      r.scale.y = 0.6
      group.add(r)
    }
  }

  // Fireflies (only visible at night)
  const count = 40
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const radius = 7 + rand() * 10
    positions.set([Math.cos(angle) * radius, 0.3 + rand() * 2.5, Math.sin(angle) * radius], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const fireflies = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: '#ffe48a', size: 0.09, transparent: true, opacity: 0.9, depthWrite: false }),
  )
  group.add(fireflies)

  return { group, fireflies }
}
