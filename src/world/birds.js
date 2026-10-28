import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

// Seagulls drifting around the beach house. Faces +z.
export function createBird() {
  const root = new THREE.Group()
  const blue = toon('#c9ced4') // gull grey
  const belly = toon('#f6f6f2')

  const body = inked(new THREE.SphereGeometry(0.09, 12, 10), blue, 0.012)
  body.scale.set(0.9, 0.85, 1.25)
  root.add(body)
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), belly)
  chest.scale.set(0.9, 0.8, 1)
  root.add(at(chest, 0, -0.025, 0.04))
  root.add(at(inked(new THREE.SphereGeometry(0.065, 12, 10), blue, 0.012), 0, 0.06, 0.09))
  const beak = inked(new THREE.ConeGeometry(0.018, 0.06, 6), toon('#f2c230'), 0.006)
  beak.rotation.x = Math.PI / 2
  root.add(at(beak, 0, 0.055, 0.17))
  for (const x of [-0.03, 0.03]) root.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 4), new THREE.MeshBasicMaterial({ color: '#141414' })), x, 0.08, 0.145))
  const tail = inked(new THREE.ConeGeometry(0.04, 0.12, 4), blue, 0.01)
  tail.rotation.x = -Math.PI / 2 - 0.4
  root.add(at(tail, 0, 0.02, -0.14))

  const wings = [-1, 1].map((side) => {
    const pivot = at(new THREE.Group(), side * 0.06, 0.03, 0)
    const wing = inked(new THREE.SphereGeometry(0.07, 10, 6), blue, 0.01)
    wing.scale.set(1.3, 0.25, 0.8)
    wing.position.x = side * 0.07
    pivot.add(wing)
    root.add(pivot)
    return { pivot, side }
  })

  return {
    root,
    flap(frame) {
      for (const { pivot, side } of wings) pivot.rotation.z = side * (frame % 2 ? 0.9 : -0.5)
    },
  }
}
