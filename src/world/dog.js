import * as THREE from 'three'
import { toon, inked, at, hitbox } from './toon.js'

const C = {
  black: '#232326',
  white: '#f4f1ea',
  eye: '#5fb3e6',
  nose: '#141414',
  tongue: '#e8798a',
}

// Black-and-white husky with blue eyes and a curled tail. Faces +z.
export function createDog() {
  const root = new THREE.Group()
  // `spin` pivots at belly height so the husky can roll over; `body` holds everything else
  const spin = at(new THREE.Group(), 0, 0.4, 0)
  const body = at(new THREE.Group(), 0, -0.4, 0)
  root.add(spin)
  spin.add(body)

  const black = toon(C.black)
  const white = toon(C.white)

  // Black saddle on top, white belly underneath
  const back = inked(new THREE.CapsuleGeometry(0.16, 0.48, 6, 14), black)
  back.rotation.x = Math.PI / 2
  body.add(at(back, 0, 0.47, 0))
  const belly = inked(new THREE.CapsuleGeometry(0.15, 0.44, 6, 14), white, 0.012)
  belly.rotation.x = Math.PI / 2
  body.add(at(belly, 0, 0.42, 0.01))
  body.add(at(inked(new THREE.SphereGeometry(0.15, 14, 10), white), 0, 0.5, 0.3))

  // Head: black cap, white mask and muzzle, icy blue eyes
  const head = at(new THREE.Group(), 0, 0.68, 0.42)
  body.add(head)
  const skull = inked(new THREE.SphereGeometry(0.15, 16, 12), black)
  skull.scale.set(1, 0.95, 1.05)
  head.add(skull)
  const mask = inked(new THREE.SphereGeometry(0.13, 16, 12), white, 0.012)
  mask.scale.set(1.05, 0.85, 1)
  head.add(at(mask, 0, -0.04, 0.06))
  const muzzle = inked(new THREE.CylinderGeometry(0.055, 0.075, 0.17, 12), white, 0.012)
  muzzle.rotation.x = Math.PI / 2
  head.add(at(muzzle, 0, -0.06, 0.18))
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), toon(C.nose)), 0, -0.04, 0.27))
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), toon(C.tongue))
  tongue.scale.set(0.9, 0.4, 1.4)
  head.add(at(tongue, 0, -0.11, 0.2))
  const eyeMat = new THREE.MeshBasicMaterial({ color: C.eye })
  const pupilMat = new THREE.MeshBasicMaterial({ color: C.nose })
  for (const x of [-0.06, 0.06]) {
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), eyeMat), x, 0.03, 0.135))
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), pupilMat), x, 0.03, 0.158))
    // White "eyebrow" dots, classic husky markings
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), white), x, 0.085, 0.125))
    const ear = inked(new THREE.ConeGeometry(0.06, 0.15, 4), black, 0.012)
    ear.rotation.z = -Math.sign(x) * 0.25
    head.add(at(ear, x * 1.4, 0.16, -0.01))
  }

  // Curled tail over the back
  const tail = at(new THREE.Group(), 0, 0.55, -0.32)
  const curl = inked(new THREE.TorusGeometry(0.1, 0.04, 8, 16, Math.PI * 1.3), black, 0.012)
  curl.rotation.y = Math.PI / 2
  curl.position.y = 0.1
  tail.add(curl)
  tail.add(at(inked(new THREE.SphereGeometry(0.045, 10, 8), white, 0.01), 0, 0.2, 0.03))
  body.add(tail)

  // Skinny cartoon legs on hip/shoulder pivots
  const legs = []
  for (const [x, z] of [[-0.09, 0.24], [0.09, 0.24], [-0.09, -0.22], [0.09, -0.22]]) {
    const pivot = at(new THREE.Group(), x, 0.4, z)
    pivot.add(at(inked(new THREE.CapsuleGeometry(0.038, 0.26, 4, 8), white, 0.012), 0, -0.19, 0))
    const paw = inked(new THREE.SphereGeometry(0.045, 8, 6), white, 0.01)
    paw.scale.set(1, 0.6, 1.3)
    pivot.add(at(paw, 0, -0.36, 0.02))
    body.add(pivot)
    legs.push(pivot)
  }

  root.add(hitbox(0.5, 0.95, 1.0))

  let phase = 0
  return {
    root,
    spin,
    body,
    // pace: 0 = still, 1 = full trot. lying tucks the legs; rolling flails them.
    update(dt, pace, elapsed, { lying = false, rolling = false } = {}) {
      phase += dt * 14 * Math.max(pace, rolling ? 1 : 0)
      const swing = Math.sin(phase) * 0.6 * (rolling ? 1.4 : pace)
      // Trot: diagonal pairs move together
      legs[0].rotation.x = lying ? -1.3 : swing
      legs[3].rotation.x = lying ? 1.3 : swing
      legs[1].rotation.x = lying ? -1.3 : -swing
      legs[2].rotation.x = lying ? 1.3 : -swing
      body.rotation.x = Math.sin(phase * 2) * 0.04 * pace
      head.rotation.y = Math.sin(elapsed * 1.7) * 0.2 * (1 - pace)
      tail.rotation.z = Math.sin(elapsed * 12) * 0.35
    },
  }
}
