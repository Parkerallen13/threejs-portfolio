import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export const INK = '#1d1a16'

// Three flat tones, like a two-color print job plus shadow
const gradientMap = (() => {
  const data = new Uint8Array([90, 180, 255])
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
})()

const outlineMaterial = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })

export function toon(color, options = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, ...options })
}

// Hand-drawn wobble: bend every shape a little so nothing is ruler-straight, like a
// cartoon background painting. Each axis is pushed by a function of the *other* two
// axes, so thin boards stay the same thickness.
function wonk(geometry) {
  if (geometry.userData.wonked) return
  geometry.userData.wonked = true
  geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize(new THREE.Vector3())
  const longest = Math.max(size.x, size.y, size.z)
  // Walls and floors barely wobble so things hung on them stay flush
  const amp = longest > 3 ? 0.008 : Math.min(0.035, longest * 0.025)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const flare = 1 + (y / Math.max(size.y, 0.01)) * 0.06
    pos.setX(i, x * flare + Math.sin(y * 2.7 + z * 1.3) * amp)
    pos.setZ(i, z * flare + Math.sin(y * 2.3 + x * 1.7) * amp)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

// Inverted-hull outline with even thickness on every axis, so boxes ink as nicely as spheres
export function inked(geometry, material, thickness = 0.022) {
  wonk(geometry)
  const mesh = new THREE.Mesh(geometry, material)
  geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize(new THREE.Vector3())
  const center = geometry.boundingBox.getCenter(new THREE.Vector3())
  const scaleFor = (d) => (d < 0.01 ? 1 : 1 + (2 * thickness) / d)

  const outline = new THREE.Mesh(geometry, outlineMaterial)
  outline.scale.set(scaleFor(size.x), scaleFor(size.y), scaleFor(size.z))
  outline.position.set(
    center.x * (1 - outline.scale.x),
    center.y * (1 - outline.scale.y),
    center.z * (1 - outline.scale.z),
  )
  mesh.add(outline)
  return mesh
}

export function block(w, h, d, material, radius = 0.04, thickness) {
  const r = Math.max(0.002, Math.min(radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))
  return inked(new RoundedBoxGeometry(w, h, d, 2, r), material, thickness)
}

export function at(object, x, y, z) {
  object.position.set(x, y, z)
  return object
}

// Invisible, raycastable volume so small objects are easy to hover
export function hitbox(w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }))
  mesh.position.y = h / 2
  return mesh
}
