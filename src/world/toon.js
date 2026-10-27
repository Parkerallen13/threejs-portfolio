import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export const INK = '#1d1a16'

// Two flat tones (color + one shadow), like cel paint on a background painting
const gradientMap = (() => {
  const data = new Uint8Array([150, 255])
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
})()

const outlineMaterial = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })

// Dry-brush texture painted onto every surface in world space, so it sticks to the
// objects as the camera moves (vertical streaks + speckle, like gouache on board)
const BRUSH_GLSL = /* glsl */ `
  varying vec3 vBrushPos;
  float bHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float bNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(bHash(i), bHash(i + vec3(1, 0, 0)), f.x), mix(bHash(i + vec3(0, 1, 0)), bHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(bHash(i + vec3(0, 0, 1)), bHash(i + vec3(1, 0, 1)), f.x), mix(bHash(i + vec3(0, 1, 1)), bHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`

function addBrush(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBrushPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvBrushPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + BRUSH_GLSL).replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float brush = bNoise(vBrushPos * vec3(5.0, 0.9, 5.0)) * 0.55 + bNoise(vBrushPos * vec3(26.0, 2.5, 26.0)) * 0.3 + bNoise(vBrushPos * 70.0) * 0.15;
      diffuseColor.rgb *= 0.84 + brush * 0.26;
      diffuseColor.rgb *= 1.0 - step(0.86, bNoise(vBrushPos * 95.0)) * 0.18;`,
    )
  }
  material.customProgramCacheKey = () => 'brush'
  return material
}

export function toon(color, options = {}) {
  return addBrush(new THREE.MeshToonMaterial({ color, gradientMap, ...options }))
}

// Cottage log walls: rounded horizontal logs computed in world space, so every wall
// piece (and the gables) lines up log-for-log no matter how it's cut
export function logs(color) {
  const material = toon(color)
  const brush = material.onBeforeCompile
  material.onBeforeCompile = (shader) => {
    brush(shader)
    shader.fragmentShader = shader.fragmentShader.replace(
      'diffuseColor.rgb *= 0.84 + brush * 0.26;',
      `diffuseColor.rgb *= 0.84 + brush * 0.26;
      float logRow = floor(vBrushPos.y / 0.34);
      float band = fract(vBrushPos.y / 0.34);
      diffuseColor.rgb *= 0.58 + 0.42 * smoothstep(0.0, 0.4, sin(band * 3.14159));
      diffuseColor.rgb *= 0.92 + 0.14 * bHash(vec3(logRow, 3.0, 7.0));`,
    )
  }
  material.customProgramCacheKey = () => 'brush-logs'
  return material
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
export function inked(geometry, material, thickness = 0.028) {
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
