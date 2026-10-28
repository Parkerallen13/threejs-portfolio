import * as THREE from 'three'
import { toon, inked, at } from './toon.js'

const GROUND_Y = -0.44
const SHORE_Z = -12 // where the sand meets the ocean, behind the house

// San Diego beachfront: warm sand, the Pacific rolling in behind the house with foam
// lines on the shore, palm trees, a lifeguard tower, an umbrella, and a street out front.
export function buildCoast() {
  const group = new THREE.Group()
  let seed = 31
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const canvasTex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d'))
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    if (repeat) t.repeat.set(...repeat)
    return t
  }

  // ---------- Sand ----------
  const sand = toon('#e9d6b0')
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 240), sand)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, GROUND_Y, 100 + SHORE_Z)
  group.add(ground)
  // Wet sand strip at the waterline
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(400, 3), toon('#cdb48c'))
  wet.rotation.x = -Math.PI / 2
  wet.position.set(0, GROUND_Y + 0.01, SHORE_Z + 1.2)
  group.add(wet)

  // ---------- Ocean ----------
  const waterTex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#2f7fa6')
    g.addColorStop(1, '#3f97b8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 140; i++) {
      ctx.strokeStyle = `rgba(${rand() < 0.5 ? '210,240,250' : '40,110,150'},${0.25 + rand() * 0.45})`
      ctx.lineWidth = 1 + rand() * 2.5
      const x = rand() * 256
      const y = rand() * 256
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + 20, y - 4, x + 40 + rand() * 30, y)
      ctx.stroke()
    }
  }, [24, 12])
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(400, 220, 80, 40), toon('#ffffff', { map: waterTex }))
  ocean.rotation.x = -Math.PI / 2
  ocean.position.set(0, GROUND_Y - 0.05, SHORE_Z - 110)
  group.add(ocean)
  const oceanPos = ocean.geometry.attributes.position
  const oceanBase = Float32Array.from(oceanPos.array)
  // Rolling foam lines that travel toward the beach and fade out on the sand
  const foamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })
  const waves = []
  for (let i = 0; i < 5; i++) {
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.5), foamMat.clone())
    wave.rotation.x = -Math.PI / 2
    wave.userData.phase = i / 5
    group.add(wave)
    waves.push(wave)
  }

  // ---------- Palm trees ----------
  const trunkMat = toon('#9c7a55')
  const frondMat = [toon('#3f7a3f'), toon('#4f8f45')]
  const palm = (x, z, height = 7, lean = 0.15) => {
    const tree = new THREE.Group()
    const segments = 9
    let px = 0
    let py = 0
    for (let i = 0; i < segments; i++) {
      const t = i / segments
      const ring = inked(new THREE.CylinderGeometry(0.17 - t * 0.05, 0.2 - t * 0.05, height / segments + 0.02, 8), trunkMat, 0.02)
      px = Math.sin(t * 1.4) * lean * height * 0.3
      py = (i + 0.5) * (height / segments)
      ring.position.set(px, py, 0)
      ring.rotation.z = -lean * 0.6 * t
      tree.add(ring)
    }
    const top = new THREE.Vector3(px, height, 0)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2
      const frond = inked(new THREE.SphereGeometry(1, 10, 6), frondMat[k % 2], 0.03)
      frond.scale.set(1.9, 0.08, 0.38)
      frond.position.set(top.x + Math.cos(a) * 1.5, top.y - 0.35, Math.sin(a) * 1.5)
      frond.rotation.set(0, -a, -0.45)
      tree.add(frond)
    }
    for (let k = 0; k < 4; k++) tree.add(at(inked(new THREE.SphereGeometry(0.12, 8, 6), toon('#7a5a2a'), 0.01), top.x + Math.cos(k * 1.6) * 0.2, top.y - 0.2, Math.sin(k * 1.6) * 0.2))
    tree.position.set(x, GROUND_Y, z)
    tree.rotation.y = rand() * Math.PI * 2
    group.add(tree)
  }
  for (const [x, z, h] of [[-9, 10, 9], [9.5, 9, 8], [-12, 2, 10], [12.5, -1, 9], [-10, -7, 7.5], [10, -8, 8.5], [-18, 14, 11], [19, 13, 10]]) palm(x, z, h)
  for (let i = 0; i < 10; i++) palm(-60 + i * 13, 26 + rand() * 4, 9 + rand() * 3) // a row along the street

  // ---------- Beach life behind the house ----------
  const white = toon('#f6f3ee')
  const blue = toon('#2f7fa6')
  // Lifeguard tower
  const tower = new THREE.Group()
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) tower.add(at(inked(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), white, 0.01), x, 1.2, z))
  tower.add(at(inked(new THREE.BoxGeometry(2.2, 0.12, 2.2), white, 0.02), 0, 2.45, 0))
  tower.add(at(inked(new THREE.BoxGeometry(1.8, 1.4, 1.8), toon('#7fb7d6'), 0.02), 0, 3.2, 0))
  tower.add(at(inked(new THREE.BoxGeometry(2.3, 0.15, 2.3), toon('#e86a4a'), 0.02), 0, 4.0, 0))
  tower.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ color: '#cfe8f2' })), 0, 3.3, 0.91))
  tower.position.set(8, GROUND_Y, SHORE_Z + 4.5)
  tower.rotation.y = Math.PI
  group.add(tower)
  // Striped umbrella + two beach chairs + a towel
  const umbrella = new THREE.Group()
  umbrella.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), white), 0, 1.1, 0))
  for (let k = 0; k < 8; k++) {
    const slice = inked(new THREE.ConeGeometry(1.3, 0.5, 8, 1, true, (k / 8) * Math.PI * 2, Math.PI / 4), toon(k % 2 ? '#f6f3ee' : '#e86a4a', { side: THREE.DoubleSide }), 0.01)
    umbrella.add(at(slice, 0, 2.25, 0))
  }
  umbrella.position.set(-5, GROUND_Y, SHORE_Z + 5)
  umbrella.rotation.z = 0.12
  group.add(umbrella)
  for (const x of [-5.6, -4.4]) {
    const chair = new THREE.Group()
    const seat = at(inked(new THREE.BoxGeometry(0.55, 0.04, 1.1), toon('#2f7fa6'), 0.01), 0, 0.3, 0)
    seat.rotation.x = -0.3
    chair.add(seat)
    for (const lx of [-0.27, 0.27]) chair.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), white), lx, 0.3, 0))
    chair.position.set(x, GROUND_Y, SHORE_Z + 6.2)
    chair.rotation.y = Math.PI
    group.add(chair)
  }
  const towel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), toon('#f2c230'))
  towel.rotation.x = -Math.PI / 2
  towel.position.set(-2.8, GROUND_Y + 0.02, SHORE_Z + 6)
  group.add(towel)
  // Driftwood and shells
  for (let i = 0; i < 12; i++) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rand() * 0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), toon(rand() < 0.5 ? '#f3e6d6' : '#e8b8a0'))
    shell.position.set(-14 + rand() * 28, GROUND_Y, SHORE_Z + 1.5 + rand() * 6)
    group.add(shell)
  }
  const drift = inked(new THREE.CylinderGeometry(0.12, 0.18, 2.6, 7).rotateZ(Math.PI / 2), toon('#b9a88e'), 0.02)
  drift.position.set(3, GROUND_Y + 0.1, SHORE_Z + 3)
  drift.rotation.y = 0.6
  group.add(drift)

  // ---------- Street out front: sidewalk, curb, a beach cruiser ----------
  const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(400, 3), toon('#d8d2c8'))
  sidewalk.rotation.x = -Math.PI / 2
  sidewalk.position.set(0, GROUND_Y + 0.02, 22)
  group.add(sidewalk)
  const street = new THREE.Mesh(new THREE.PlaneGeometry(400, 8), toon('#5a5856'))
  street.rotation.x = -Math.PI / 2
  street.position.set(0, GROUND_Y + 0.01, 27.5)
  group.add(street)
  for (let x = -60; x < 60; x += 4) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.15), toon('#efe6c8'))
    dash.rotation.x = -Math.PI / 2
    dash.position.set(x, GROUND_Y + 0.02, 27.5)
    group.add(dash)
  }
  // Stepping stones from the sidewalk to the porch
  for (let i = 0; i < 9; i++) {
    const stone = inked(new THREE.CylinderGeometry(0.35, 0.38, 0.06, 7), toon('#d8d2c8'), 0.015)
    stone.position.set(0.3 + Math.sin(i * 1.3) * 0.2, GROUND_Y + 0.03, 10 + i * 1.3)
    group.add(stone)
  }
  // Beach cruiser leaning by the steps
  const bike = new THREE.Group()
  const mint = toon('#8fd3c1')
  for (const z of [-0.55, 0.55]) bike.add(at(inked(new THREE.TorusGeometry(0.32, 0.03, 6, 20).rotateY(Math.PI / 2), toon('#2b2b2b'), 0.01), 0, 0.32, z))
  bike.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6).rotateX(Math.PI / 2), mint), 0, 0.55, 0))
  bike.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), mint), 0, 0.6, 0.45))
  bike.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6).rotateZ(Math.PI / 2), mint), 0, 0.9, 0.5))
  bike.add(at(inked(new THREE.BoxGeometry(0.2, 0.06, 0.3), toon('#6b4428'), 0.01), 0, 0.8, -0.25))
  bike.add(at(inked(new THREE.BoxGeometry(0.4, 0.2, 0.3), toon('#c9a46a'), 0.01), 0, 0.85, 0.75)) // wicker basket
  bike.position.set(2.8, GROUND_Y, 9.4)
  bike.rotation.set(0, 0.2, 0.18)
  group.add(bike)

  return {
    group,
    update(dt, elapsed) {
      waterTex.offset.x += dt * 0.01
      waterTex.offset.y += dt * 0.015
      // Gentle swell
      for (let i = 0; i < oceanPos.count; i++) {
        const x = oceanBase[i * 3]
        const y = oceanBase[i * 3 + 1]
        oceanPos.setZ(i, Math.sin(x * 0.15 + elapsed * 0.8) * 0.15 + Math.sin(y * 0.2 + elapsed * 1.1) * 0.2)
      }
      oceanPos.needsUpdate = true
      // Foam lines rolling in to the shore
      for (const wave of waves) {
        const k = (elapsed * 0.12 + wave.userData.phase) % 1
        wave.position.set(0, GROUND_Y + 0.03, SHORE_Z - 14 + k * 15.5)
        wave.scale.y = 1 + k * 3
        wave.material.opacity = 0.85 * Math.sin(k * Math.PI)
      }
    },
  }
}
