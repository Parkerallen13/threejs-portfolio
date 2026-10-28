import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

export const CHARACTER_STYLES = {
  anime: 'Anime',
  animated: '3D Animated',
  clay: 'Claymation',
  lowpoly: 'Low Poly',
}

const C = {
  skin: '#f2cdb3',
  hair: '#9b6b45',
  hairLight: '#b98a5e',
  blouse: '#fbf7ef',
  skirt: '#6e4b37',
  shoe: '#4a3426',
  gold: '#d6a93c',
  jade: '#5fae8b',
}

// ---------- Looks: how each style turns a color into a material ----------

const clayBump = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 128, 128)
  // Thumbprints and tool marks
  for (let i = 0; i < 60; i++) {
    const tone = Math.random() < 0.5 ? 0 : 255
    ctx.strokeStyle = `rgba(${tone},${tone},${tone},0.12)`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.arc(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 14, 0, Math.PI * (1 + Math.random()))
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
})()

const LOOKS = {
  anime: {
    material: (color) => toon(color),
    shell: (geometry, material) => inked(geometry, material, 0.012, false),
    segments: 1,
    head: 1.0,
    bodyY: 1.0,
    width: 0.95,
  },
  animated: {
    material: (color, { gloss = false } = {}) => new THREE.MeshStandardMaterial({ color, roughness: gloss ? 0.35 : 0.6, metalness: 0 }),
    shell: (geometry, material) => new THREE.Mesh(geometry, material),
    segments: 1,
    head: 1.28,
    bodyY: 0.86,
    width: 1.0,
  },
  clay: {
    material: (color) => new THREE.MeshStandardMaterial({ color, roughness: 1, bumpMap: clayBump, bumpScale: 1.2 }),
    shell: (geometry, material) => new THREE.Mesh(geometry, material),
    segments: 0.7,
    head: 1.3,
    bodyY: 0.8,
    width: 1.18,
  },
  lowpoly: {
    material: (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true }),
    shell: (geometry, material) => new THREE.Mesh(geometry, material),
    segments: 0.22,
    head: 1.1,
    bodyY: 0.95,
    width: 1.0,
  },
}

// ---------- Painted faces ----------

function faceTexture(style) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 512, 512)
  ctx.lineCap = 'round'
  const eyeY = 200
  const eyes = [176, 336]

  if (style === 'anime') {
    for (const [i, x] of eyes.entries()) {
      const dir = i ? 1 : -1
      // Big sclera, layered hazel-green iris, pupil, two catchlights
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(x, eyeY + 6, 44, 52, 0, 0, Math.PI * 2)
      ctx.fill()
      const iris = ctx.createRadialGradient(x, eyeY + 16, 4, x, eyeY + 10, 40)
      iris.addColorStop(0, '#c9d6a8')
      iris.addColorStop(0.5, '#7f9a72')
      iris.addColorStop(1, '#3d4f3a')
      ctx.fillStyle = iris
      ctx.beginPath()
      ctx.ellipse(x, eyeY + 12, 32, 42, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1f241c'
      ctx.beginPath()
      ctx.ellipse(x, eyeY + 12, 13, 18, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(x - 12, eyeY - 6, 10, 13, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + 12, eyeY + 30, 5, 0, Math.PI * 2)
      ctx.fill()
      // Heavy upper lash line with a flick at the outer corner
      ctx.strokeStyle = '#2a1d16'
      ctx.lineWidth = 9
      ctx.beginPath()
      ctx.moveTo(x - 50 * dir, eyeY + 4)
      ctx.quadraticCurveTo(x, eyeY - 58, x + 52 * dir, eyeY - 12)
      ctx.lineTo(x + 64 * dir, eyeY - 26)
      ctx.stroke()
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - 30 * dir, eyeY + 58)
      ctx.quadraticCurveTo(x, eyeY + 64, x + 34 * dir, eyeY + 52)
      ctx.stroke()
      ctx.lineWidth = 5
      ctx.strokeStyle = '#6b4a30'
      ctx.beginPath()
      ctx.moveTo(x - 40 * dir, eyeY - 74)
      ctx.quadraticCurveTo(x, eyeY - 92, x + 44 * dir, eyeY - 78)
      ctx.stroke()
      // Blush hatching
      ctx.strokeStyle = 'rgba(232, 120, 120, 0.7)'
      ctx.lineWidth = 3
      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        ctx.moveTo(x + 20 * dir + k * 10 - 30, eyeY + 92)
        ctx.lineTo(x + 20 * dir + k * 10 - 22, eyeY + 80)
        ctx.stroke()
      }
    }
    ctx.strokeStyle = '#c98a78'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(256, 300)
    ctx.lineTo(250, 318)
    ctx.stroke()
    ctx.strokeStyle = '#a8505a'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(232, 372)
    ctx.quadraticCurveTo(256, 384, 280, 370)
    ctx.stroke()
  } else if (style === 'animated') {
    for (const [i, x] of eyes.entries()) {
      const dir = i ? 1 : -1
      ctx.fillStyle = '#fbfaf7'
      ctx.beginPath()
      ctx.ellipse(x, eyeY + 8, 40, 34, 0, 0, Math.PI * 2)
      ctx.fill()
      const iris = ctx.createRadialGradient(x, eyeY + 10, 2, x, eyeY + 10, 26)
      iris.addColorStop(0, '#a9b98f')
      iris.addColorStop(0.7, '#6d8064')
      iris.addColorStop(1, '#3a4636')
      ctx.fillStyle = iris
      ctx.beginPath()
      ctx.arc(x, eyeY + 10, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#141814'
      ctx.beginPath()
      ctx.arc(x, eyeY + 10, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.beginPath()
      ctx.arc(x - 9, eyeY, 7, 0, Math.PI * 2)
      ctx.fill()
      // Soft heavy lid with lashes, like Parker's sleepy look
      ctx.fillStyle = '#e9bfa4'
      ctx.beginPath()
      ctx.ellipse(x, eyeY - 14, 46, 26, 0, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#3a2a22'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(x - 42, eyeY - 10)
      ctx.quadraticCurveTo(x, eyeY - 26, x + 42, eyeY - 10)
      ctx.stroke()
      ctx.lineWidth = 2.5
      for (let k = 0; k < 5; k++) {
        const lx = x - 30 + k * 15
        ctx.beginPath()
        ctx.moveTo(lx, eyeY - 18)
        ctx.lineTo(lx + 6 * dir, eyeY - 30)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(120, 82, 55, 0.85)'
      ctx.lineWidth = 9
      ctx.beginPath()
      ctx.moveTo(x - 38 * dir, eyeY - 62)
      ctx.quadraticCurveTo(x, eyeY - 74, x + 42 * dir, eyeY - 60)
      ctx.stroke()
      const blush = ctx.createRadialGradient(x + 14 * dir, eyeY + 92, 4, x + 14 * dir, eyeY + 92, 46)
      blush.addColorStop(0, 'rgba(236, 140, 130, 0.45)')
      blush.addColorStop(1, 'rgba(236, 140, 130, 0)')
      ctx.fillStyle = blush
      ctx.fillRect(x - 70, eyeY + 40, 140, 110)
    }
    // Freckles across the nose
    ctx.fillStyle = 'rgba(160, 100, 70, 0.5)'
    for (let k = 0; k < 14; k++) {
      ctx.beginPath()
      ctx.arc(200 + ((k * 37) % 112), 270 + ((k * 17) % 30), 2, 0, Math.PI * 2)
      ctx.fill()
    }
    // Full rosy lips
    ctx.fillStyle = '#c9707a'
    ctx.beginPath()
    ctx.moveTo(220, 372)
    ctx.quadraticCurveTo(240, 356, 256, 364)
    ctx.quadraticCurveTo(272, 356, 292, 372)
    ctx.quadraticCurveTo(256, 396, 220, 372)
    ctx.fill()
  } else if (style === 'clay') {
    // Clay gets real button eyes (geometry); paint just brows and a smile groove
    ctx.strokeStyle = '#7a4a3a'
    ctx.lineWidth = 7
    for (const x of eyes) {
      ctx.beginPath()
      ctx.moveTo(x - 34, eyeY - 56)
      ctx.quadraticCurveTo(x, eyeY - 70, x + 34, eyeY - 56)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(214, 360)
    ctx.quadraticCurveTo(256, 396, 298, 360)
    ctx.stroke()
  } else {
    // Low poly: geometric diamond eyes and triangle blush
    for (const x of eyes) {
      ctx.fillStyle = '#2a2420'
      ctx.beginPath()
      ctx.moveTo(x, eyeY - 26)
      ctx.lineTo(x + 18, eyeY + 6)
      ctx.lineTo(x, eyeY + 32)
      ctx.lineTo(x - 18, eyeY + 6)
      ctx.fill()
      ctx.fillStyle = 'rgba(230, 120, 110, 0.6)'
      ctx.beginPath()
      ctx.moveTo(x - 26, eyeY + 80)
      ctx.lineTo(x + 26, eyeY + 80)
      ctx.lineTo(x, eyeY + 104)
      ctx.fill()
    }
    ctx.fillStyle = '#b5606a'
    ctx.beginPath()
    ctx.moveTo(232, 366)
    ctx.lineTo(280, 366)
    ctx.lineTo(256, 384)
    ctx.fill()
  }
  // Lay the painted features out on the face: eyes (with brows + blush) scaled up and
  // spaced to the head, nose and mouth below
  const out = document.createElement('canvas')
  out.width = out.height = 512
  const o = out.getContext('2d')
  const piece = (sx, sy, sw, sh, cx, cy, scale) => o.drawImage(c, sx, sy, sw, sh, cx - (sw * scale) / 2, cy - (sh * scale) / 2, sw * scale, sh * scale)
  for (const [i, x] of eyes.entries()) piece(x - 80, eyeY - 100, 160, 210, i ? 403 : 109, 210, 1.7)
  piece(176, 260, 160, 140, 256, 375, 1.5)
  const t = new THREE.CanvasTexture(out)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// ---------- Sculpted hair: a wavy bob shell, a crown, and a side-swept fringe ----------

function hairPieces(look, mat, matLight) {
  const seg = (n) => Math.max(5, Math.round(n * look.segments))
  const pieces = []
  // Bob: all around the head except a window for the face, waving and flaring at the ends
  const R = 0.345
  const bob = new THREE.SphereGeometry(R, seg(56), seg(36), Math.PI / 2 + 0.72, Math.PI * 2 - 1.44, 0.15, Math.PI * 0.7)
  const p = bob.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const theta = Math.acos(THREE.MathUtils.clamp(v.y / R, -1, 1))
    const phi = Math.atan2(v.z, -v.x)
    const wave = 1 + 0.06 * Math.sin(theta * 11 + phi * 3) + 0.04 * Math.sin(phi * 9)
    const flare = theta > 1.7 ? 1 + (theta - 1.7) * 0.3 : 1
    v.x *= wave * flare
    v.z *= wave * flare
    if (theta > 1.9) v.y += (theta - 1.9) * 0.18 // ends curl up and out
    p.setXYZ(i, v.x, v.y, v.z)
  }
  bob.computeVertexNormals()
  pieces.push(look.shell(bob, mat))
  // Crown cap
  pieces.push(look.shell(new THREE.SphereGeometry(0.338, seg(48), seg(20), 0, Math.PI * 2, 0, Math.PI * 0.42), mat))
  // Side-swept fringe: a soft lock hugging the forehead, sweeping down to one side
  const fringe = new THREE.SphereGeometry(0.13, seg(28), seg(16))
  const fringeMesh = look.shell(fringe, matLight)
  fringeMesh.scale.set(1.5, 0.42, 0.55)
  fringeMesh.position.set(0.05, 0.17, 0.235)
  fringeMesh.rotation.set(-0.35, 0, -0.32)
  pieces.push(fringeMesh)
  return pieces
}

// ---------- The character ----------

// Parker: wavy light-brown bob with a side part, white puff-sleeve blouse with a
// peter pan collar, gold chain with a jade pendant, long brown A-line skirt. Faces +z.
export function createCharacter(style = 'anime') {
  if (!LOOKS[style]) style = 'anime'
  const look = LOOKS[style]
  const seg = (n) => Math.max(5, Math.round(n * look.segments))
  const m = (color, opts) => look.material(color, opts)

  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const skin = m(C.skin)
  const blouse = m(C.blouse)
  const W = look.width

  // A-line skirt (lathe profile: pinched waist, gentle bell)
  const skirtProfile = [
    [0.36, 0.0], [0.37, 0.04], [0.33, 0.25], [0.27, 0.5], [0.2, 0.72], [0.15, 0.88], [0.14, 0.92],
  ].map(([r, y]) => new THREE.Vector2(r * W, y))
  const skirt = look.shell(new THREE.LatheGeometry(skirtProfile, seg(40)), m(C.skirt))
  skirt.position.y = 0.06
  body.add(skirt)
  for (const x of [-0.09, 0.09]) {
    const shoe = look.shell(new THREE.SphereGeometry(0.075, seg(16), seg(10)), m(C.shoe, { gloss: true }))
    shoe.scale.set(1, 0.55, 1.6)
    body.add(at(shoe, x * W, 0.05, 0.12))
  }
  // Blouse torso (lathe: waist -> bust -> shoulders -> neckline)
  const torsoProfile = [
    [0.0, 0.0], [0.14, 0.0], [0.16, 0.1], [0.19, 0.24], [0.185, 0.34], [0.15, 0.42], [0.07, 0.46], [0.0, 0.46],
  ].map(([r, y]) => new THREE.Vector2(r * W, y))
  body.add(at(look.shell(new THREE.LatheGeometry(torsoProfile, seg(40)), blouse), 0, 0.96, 0))
  // Puff sleeves with a lace band
  for (const x of [-0.2, 0.2]) {
    const sleeve = look.shell(new THREE.SphereGeometry(0.105, seg(20), seg(14)), blouse)
    sleeve.scale.set(1, 0.9, 1)
    body.add(at(sleeve, x * W, 1.3, 0))
    body.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, seg(20)).rotateX(Math.PI / 2), m('#efe6d6')), x * W * 1.05, 1.22, 0))
  }
  // Peter pan collar (two rounded flaps) + a little bow
  for (const side of [-1, 1]) {
    const flap = look.shell(new THREE.CylinderGeometry(0.09, 0.09, 0.02, seg(24), 1, false, 0, Math.PI), blouse)
    flap.rotation.set(-0.35, side * 0.5 + Math.PI / 2, 0)
    body.add(at(flap, side * 0.06 * W, 1.405, 0.07))
  }
  for (const x of [-0.03, 0.03]) body.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), blouse), x, 1.33, 0.18))

  // Arms swing from the shoulders; slim arms and soft hands
  const arms = [-1, 1].map((side) => {
    const pivot = at(new THREE.Group(), side * 0.215 * W, 1.3, 0)
    pivot.add(at(look.shell(new THREE.CapsuleGeometry(0.032, 0.36, 4, seg(10)), skin), side * 0.015, -0.27, 0))
    pivot.add(at(look.shell(new THREE.SphereGeometry(0.045, seg(12), seg(8)), skin), side * 0.02, -0.5, 0.01))
    body.add(pivot)
    return pivot
  })

  // Neck + gold chain with a jade pendant
  body.add(at(look.shell(new THREE.CylinderGeometry(0.048, 0.056, 0.2, seg(14)), skin), 0, 1.5, 0))
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.01, 6, 28), m(C.gold, { gloss: true }))
  chain.rotation.x = Math.PI / 2 - 0.3
  body.add(at(chain, 0, 1.45, 0.012))
  body.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), m(C.jade, { gloss: true })), 0, 1.42, 0.078))

  // Head: skull, ears, nose, a painted face decal (button eyes for clay), sculpted hair
  const head = at(new THREE.Group(), 0, 1.86, 0)
  body.add(head)
  const skull = look.shell(new THREE.SphereGeometry(0.29, seg(40), seg(28)), skin)
  skull.scale.set(0.95, 1.08, 0.98)
  head.add(skull)
  for (const x of [-0.27, 0.27]) head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skin), x, -0.02, 0))
  head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), skin), 0, -0.05, 0.285))
  const decal = new THREE.Mesh(
    new THREE.SphereGeometry(0.2935, 48, 32, Math.PI / 2 - 0.6, 1.2, 0.95, 1.2),
    new THREE.MeshBasicMaterial({ map: faceTexture(style), transparent: true, depthWrite: false }),
  )
  decal.scale.set(0.95, 1.08, 0.98)
  decal.renderOrder = 1
  head.add(decal)
  if (style === 'clay') {
    for (const x of [-0.1, 0.1]) {
      head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.15 })), x, 0.02, 0.27))
      head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })), x - 0.015, 0.04, 0.31))
    }
  }
  for (const piece of hairPieces(look, m(C.hair, { gloss: true }), m(C.hairLight, { gloss: true }))) head.add(piece)

  // Proportions: bigger heads and shorter, rounder bodies for the 3D-animated and clay looks
  body.scale.y = look.bodyY
  head.scale.set(look.head, look.head / look.bodyY, look.head)

  let phase = 0
  let elapsed = 0
  return {
    root,
    style,
    billboard: false,
    // amount: 0 = idle, 1 = full walk
    update(dt, amount) {
      elapsed += dt
      phase += dt * 10 * amount
      const swing = Math.sin(phase) * amount
      body.position.y = Math.abs(Math.sin(phase)) * 0.05 * amount + Math.sin(elapsed * 2) * 0.008
      body.rotation.x = 0.06 * amount
      arms[0].rotation.x = swing * 0.7
      arms[1].rotation.x = -swing * 0.7
      arms[0].rotation.z = -0.08
      arms[1].rotation.z = 0.08
      skirt.rotation.y = swing * 0.08
      head.rotation.z = Math.sin(elapsed * 1.3) * 0.04 * (1 - amount)
      head.rotation.y = Math.sin(elapsed * 0.7) * 0.12 * (1 - amount)
    },
  }
}
