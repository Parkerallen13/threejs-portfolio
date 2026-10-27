import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { toon, inked, block, at, hitbox } from './toon.js'

// Little black Mini convertible, top folded down. Faces +z.
export function createMini() {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const paint = toon('#1d1d22')
  const chrome = toon('#d3d6dc')
  const tan = toon('#c79a6b')
  const cream = toon('#f4ecd8')

  // Warped like the car sketches: humped in the middle, pinched at the bumpers
  const shell = new RoundedBoxGeometry(0.92, 0.36, 1.6, 4, 0.14)
  const p = shell.attributes.position
  for (let i = 0; i < p.count; i++) {
    const t = p.getZ(i) / 0.8
    p.setX(i, p.getX(i) * (1 - 0.16 * t * t + (t > 0 ? 0.05 : 0)))
    if (p.getY(i) > 0) p.setY(i, p.getY(i) + 0.09 * (1 - t * t))
  }
  shell.computeVertexNormals()
  body.add(at(inked(shell, paint), 0, 0.36, 0))
  for (const x of [-0.1, 0.1]) body.add(at(block(0.08, 0.012, 0.42, cream, 0.004, 0.006), x * 0.9, 0.6, 0.5))

  for (const z of [-0.82, 0.82]) body.add(at(block(0.94, 0.08, 0.08, chrome, 0.03), 0, 0.22, z))

  // Round headlights, grille, tail lights
  const lens = new THREE.MeshBasicMaterial({ color: '#fff6d6' })
  for (const x of [-0.3, 0.3]) {
    // Big bug-eye headlights
    const ring = inked(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), chrome, 0.014)
    ring.rotation.x = Math.PI / 2
    body.add(at(ring, x * 0.95, 0.47, 0.8))
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.065, 20), lens)
    light.rotation.x = Math.PI / 2
    body.add(at(light, x * 0.95, 0.47, 0.81))
  }
  body.add(at(block(0.3, 0.13, 0.03, toon('#2a2a2e'), 0.02, 0.012), 0, 0.37, 0.8))
  const tail = new THREE.MeshBasicMaterial({ color: '#d6312b' })
  for (const x of [-0.36, 0.36]) body.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), tail), x, 0.42, -0.81))

  // Windshield
  const shield = new THREE.Group()
  shield.add(at(block(0.86, 0.04, 0.04, paint, 0.015, 0.012), 0, 0.3, 0))
  for (const x of [-0.41, 0.41]) shield.add(at(block(0.04, 0.3, 0.04, paint, 0.015, 0.012), x, 0.15, 0))
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.27),
    new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  )
  shield.add(at(glass, 0, 0.15, 0))
  shield.rotation.x = -0.4
  body.add(at(shield, 0, 0.54, 0.25))

  // Interior: tan seats, steering wheel (driver on the left), folded roof
  for (const x of [-0.2, 0.2]) {
    body.add(at(block(0.3, 0.32, 0.1, tan, 0.05), x, 0.68, -0.05))
    body.add(at(block(0.3, 0.08, 0.28, tan, 0.03), x, 0.57, 0.08))
  }
  body.add(at(block(0.76, 0.24, 0.1, tan, 0.05), 0, 0.64, -0.45))
  const wheel = inked(new THREE.TorusGeometry(0.075, 0.016, 6, 18), toon('#2a2a2e'), 0.01)
  wheel.rotation.x = -1.0
  body.add(at(wheel, 0.2, 0.72, 0.22))
  body.add(at(block(0.8, 0.13, 0.2, toon('#26262b'), 0.06), 0, 0.6, -0.68))
  for (const x of [-0.5, 0.5]) body.add(at(block(0.08, 0.06, 0.05, paint, 0.02, 0.012), x, 0.6, 0.28))

  // Wheels spin on their own pivots
  const wheels = []
  const tireGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.17, 20)
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.135, 12)
  for (const [x, z] of [[-0.42, 0.5], [0.42, 0.5], [-0.42, -0.5], [0.42, -0.5]]) {
    const pivot = at(new THREE.Group(), x, 0.19, z)
    const tire = inked(tireGeo, toon('#121214'), 0.015)
    tire.rotation.z = Math.PI / 2
    const hub = new THREE.Mesh(hubGeo, chrome)
    hub.rotation.z = Math.PI / 2
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), toon('#121214'))
    spoke.position.x = Math.sign(x) * 0.07
    pivot.add(tire, hub, spoke)
    root.add(pivot)
    wheels.push(pivot)
  }

  root.add(hitbox(1.0, 0.9, 1.7))
  return { root, body, wheels }
}
