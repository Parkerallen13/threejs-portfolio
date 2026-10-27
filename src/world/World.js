import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildRoom, BOUNDS } from './room.js'
import { createCharacter } from './character.js'
import { createMini } from './car.js'
import { blobShadow } from './textures.js'
import { TOUR } from './tour.js'
import { createLensPass, lensDistort, lensUndistort, lens } from './lensPass.js'

const MODES = {
  light: { background: '#f4ecd8', ambient: ['#ffffff', 1.5], sun: 2.2, lamp: 0, candle: 0, glass: '#cfe8ff', shade: 0 },
  dark: { background: '#1d1a16', ambient: ['#7d84b8', 0.55], sun: 0.3, lamp: 7, candle: 1.4, glass: '#1c2448', shade: 0.7 },
}

const WALK_SPEED = 2.4
const RADIUS = 0.28
const POSE_FPS = 12 // character poses update "on twos", like limited TV animation
const CAR_PATH = { x: 0.4, z: 3.1, rx: 3.6, rz: 1.1, speed: 0.3 }

export class World {
  constructor(canvas, { bubble, labels, mode, drawings, screenArt, onActivate }) {
    this.canvas = canvas
    this.bubble = bubble
    this.labels = labels
    this.onActivate = onActivate
    this.paused = false
    this.progress = 0
    this.pointer = new THREE.Vector2()
    this.pointerUv = new THREE.Vector2(0.5, 0.5)
    this.pointerInside = false
    this.raycaster = new THREE.Raycaster()
    this.hovered = null
    this.clock = new THREE.Clock()
    this.elapsed = 0
    this.poseClock = 0

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color()
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 100)
    this.camPos = new THREE.Vector3(...TOUR[0].cam)
    this.camLook = new THREE.Vector3(...TOUR[0].look)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.lens = createLensPass()
    this.composer.addPass(this.lens)
    this.composer.addPass(new OutputPass())
    this.resize()

    this.ambient = new THREE.AmbientLight('#ffffff', 1.5)
    this.sun = new THREE.DirectionalLight('#ffffff', 2.2)
    this.sun.position.set(-2, 6, 4)
    this.scene.add(this.ambient, this.sun)

    this.room = buildRoom({ drawings, screenArt })
    this.scene.add(this.room.group)
    this.colliders = this.room.colliders

    this.character = createCharacter()
    this.character.root.position.set(...[TOUR[0].stand[0], 0, TOUR[0].stand[1]])
    this.scene.add(this.character.root)
    this.walkAmount = 0

    this.mini = createMini()
    this.scene.add(this.mini.root)
    this.car = { t: Math.PI / 2, speed: CAR_PATH.speed, honkAt: -10 }

    const shadowMat = new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false })
    const shadow = (w, d) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadowMat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = 0.04
      this.scene.add(mesh)
      return mesh
    }
    this.characterShadow = shadow(0.9, 0.9)
    this.carShadow = shadow(1.3, 2.0)

    this.character.root.userData.hotspot = 'me'
    this.mini.root.userData.hotspot = 'mini'
    this.hotspots = [...this.room.hotspots, this.character.root, this.mini.root].map((object) => ({
      id: object.userData.hotspot,
      object,
      baseScale: object.scale.clone(),
    }))
    this.plantGrowth = 0
    this.plantThanksAt = -10

    this.setEvents()
    this.setMode(mode)
    this.renderer.setAnimationLoop(() => this.update())
  }

  setMode(mode) {
    const m = MODES[mode] ?? MODES.dark
    this.scene.background.set(m.background)
    this.lens.uniforms.uEdge.value.set(m.background)
    this.ambient.color.set(m.ambient[0])
    this.ambient.intensity = m.ambient[1]
    this.sun.intensity = m.sun
    this.room.lampLight.intensity = m.lamp
    this.candleIntensity = m.candle
    this.room.glassMaterial.color.set(m.glass)
    this.room.shadeMaterial.emissiveIntensity = m.shade
  }

  // 0 = first chapter, TOUR.length - 1 = last
  setProgress(progress) {
    this.progress = THREE.MathUtils.clamp(progress, 0, TOUR.length - 1)
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
    const ratio = this.renderer.getPixelRatio()
    this.lens.uniforms.uResolution.value.set(w * ratio, h * ratio)
  }

  setEvents() {
    window.addEventListener('resize', () => this.resize())
    window.addEventListener('pointermove', (e) => {
      this.pointerUv.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight)
      this.pointerInside = true
    })
    document.addEventListener('pointerleave', () => {
      this.pointerInside = false
    })
    window.addEventListener('click', (e) => {
      if (this.paused || e.target.closest('a, button, dialog, .chapter__card')) return
      this.pointerUv.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight)
      const hit = this.pickHotspot()
      if (hit) this.activate(hit.id)
    })
  }

  pickHotspot() {
    // Undo the fisheye so the ray goes where the viewer actually pointed
    const uv = lensDistort(this.pointerUv, this.camera.aspect)
    this.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(
      this.hotspots.map((h) => h.object),
      true,
    )
    for (const { object } of hits) {
      let o = object
      while (o && !o.userData.hotspot) o = o.parent
      if (o) return this.hotspots.find((h) => h.object === o)
    }
    return null
  }

  activate(id) {
    if (id === 'mini') {
      this.car.honkAt = this.elapsed
      return
    }
    if (id === 'plant') {
      this.plantGrowth = (this.plantGrowth + 1) % 4
      this.plantThanksAt = this.elapsed
      return
    }
    this.onActivate(id)
  }

  chapterIndex() {
    return Math.round(this.progress)
  }

  blocked(x, z) {
    if (x < BOUNDS.minX + RADIUS || x > BOUNDS.maxX - RADIUS) return true
    if (z < BOUNDS.minZ + RADIUS || z > BOUNDS.maxZ - RADIUS) return true
    return this.colliders.some(
      (c) => x > c.minX - RADIUS && x < c.maxX + RADIUS && z > c.minZ - RADIUS && z < c.maxZ + RADIUS,
    )
  }

  // Parker walks over to whatever the current chapter is about
  moveCharacter(dt) {
    const pos = this.character.root.position
    const [tx, tz] = TOUR[this.chapterIndex()].stand
    const input = new THREE.Vector3(tx - pos.x, 0, tz - pos.z)
    const rot = this.character.root.rotation
    let walking = 0
    let facing

    if (input.length() > 0.08) {
      input.normalize()
      const step = WALK_SPEED * dt
      const before = pos.clone()
      if (!this.blocked(pos.x + input.x * step, pos.z)) pos.x += input.x * step
      if (!this.blocked(pos.x, pos.z + input.z * step)) pos.z += input.z * step
      walking = Math.min(1, before.distanceTo(pos) / step)
      facing = Math.atan2(input.x, input.z)
    } else {
      // Arrived: turn to say hi to the camera
      facing = Math.atan2(this.camera.position.x - pos.x, this.camera.position.z - pos.z)
    }
    const diff = Math.atan2(Math.sin(facing - rot.y), Math.cos(facing - rot.y))
    rot.y += diff * Math.min(1, dt * 8)

    // Don't let the Mini drive through Parker
    const carPos = this.mini.root.position
    const away = new THREE.Vector3(pos.x - carPos.x, 0, pos.z - carPos.z)
    if (away.length() < 0.95) {
      away.setLength(0.95)
      if (!this.blocked(carPos.x + away.x, carPos.z + away.z)) pos.set(carPos.x + away.x, 0, carPos.z + away.z)
    }

    this.walkAmount = THREE.MathUtils.lerp(this.walkAmount, walking, Math.min(1, dt * 10))
    this.poseClock += dt
    if (this.poseClock >= 1 / POSE_FPS) {
      this.character.update(this.poseClock, this.walkAmount)
      this.poseClock = 0
    }
    this.characterShadow.position.set(pos.x, 0.04, pos.z)
  }

  carPoint(t, out = new THREE.Vector3()) {
    return out.set(CAR_PATH.x + Math.cos(t) * CAR_PATH.rx, 0, CAR_PATH.z + Math.sin(t) * CAR_PATH.rz)
  }

  moveCar(dt) {
    // Yield to pedestrians: slow down if Parker is just ahead
    const ahead = this.carPoint(this.car.t + 0.45)
    const blocked = ahead.distanceTo(this.character.root.position) < 1.2
    this.car.speed = THREE.MathUtils.lerp(this.car.speed, blocked ? 0 : CAR_PATH.speed, Math.min(1, dt * 4))
    if (blocked && this.elapsed - this.car.honkAt > 3) this.car.honkAt = this.elapsed

    this.car.t += this.car.speed * dt
    const t = this.car.t
    const pos = this.carPoint(t)
    this.mini.root.position.copy(pos)
    this.mini.root.rotation.y = Math.atan2(-Math.sin(t) * CAR_PATH.rx, Math.cos(t) * CAR_PATH.rz)

    const linear = this.car.speed * Math.hypot(Math.sin(t) * CAR_PATH.rx, Math.cos(t) * CAR_PATH.rz)
    for (const wheel of this.mini.wheels) wheel.rotation.x += (linear * dt) / 0.17

    // Cartoon physics: lean into the turns, bounce on twos, hop when honking
    const sinceHonk = this.elapsed - this.car.honkAt
    const frame = Math.floor(this.elapsed * POSE_FPS)
    const pace = this.car.speed / CAR_PATH.speed
    this.mini.body.rotation.z = -0.14 * Math.cos(t) ** 2 * pace
    this.mini.body.position.y =
      (sinceHonk < 0.6 ? Math.abs(Math.sin(sinceHonk * 10)) * 0.1 : 0) + (frame % 2) * 0.018 * pace
    this.mini.body.scale.set(1, 1 + (frame % 2 ? 0.03 : -0.02) * pace, 1)
    this.carShadow.position.set(pos.x, 0.04, pos.z)
    this.carShadow.rotation.z = this.mini.root.rotation.y
  }

  updateCamera(dt) {
    // Hold on each chapter, then glide to the next
    const i = Math.min(Math.floor(this.progress), TOUR.length - 2)
    const t = THREE.MathUtils.smoothstep(this.progress - i, 0.15, 0.85)
    const a = TOUR[i]
    const b = TOUR[i + 1]
    const pos = new THREE.Vector3(...a.cam).lerp(new THREE.Vector3(...b.cam), t)
    const look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), t)

    // A little parallax from the pointer
    if (this.pointerInside) {
      pos.x += (this.pointerUv.x - 0.5) * 0.3
      pos.y += (this.pointerUv.y - 0.5) * 0.2
    }

    const ease = 1 - Math.exp(-dt * 5)

    // Each perspective has its own lens + palette; blend between them with the camera
    const u = this.lens.uniforms
    lens.k = THREE.MathUtils.lerp(lens.k, THREE.MathUtils.lerp(a.lens, b.lens, t), ease)
    u.uK.value = lens.k
    u.uGrade.value = THREE.MathUtils.lerp(u.uGrade.value, THREE.MathUtils.lerp(a.grade, b.grade, t), ease)
    const tint = new THREE.Color(a.tint).lerp(new THREE.Color(b.tint), t)
    u.uTint.value.lerp(tint, ease)

    this.camPos.lerp(pos, ease)
    this.camLook.lerp(look, ease)
    this.camera.position.copy(this.camPos)
    this.camera.lookAt(this.camLook)
  }

  updateBubble() {
    this.hovered = this.pointerInside && !this.paused ? this.pickHotspot() : null
    document.body.style.cursor = this.hovered ? 'pointer' : ''

    for (const h of this.hotspots) {
      if (h.id === 'plant') h.object.scale.copy(h.baseScale).multiplyScalar(1 + this.plantGrowth * 0.15)
    }

    // Hovered thing wins; otherwise point at the current chapter's object once we've settled on it
    const chapter = TOUR[this.chapterIndex()]
    const settled = Math.abs(this.progress - this.chapterIndex()) < 0.2
    let shown = this.hovered ?? (settled ? this.hotspots.find((h) => h.id === chapter.key) : null)
    let text = shown && this.labels[shown.id]
    if (this.elapsed - this.car.honkAt < 1.4) {
      shown = this.hotspots.find((h) => h.id === 'mini')
      text = 'BEEP BEEP!'
    } else if (this.elapsed - this.plantThanksAt < 1.6) {
      shown = this.hotspots.find((h) => h.id === 'plant')
      text = 'Thanks for the water!'
    }

    if (!shown || !text || this.paused) {
      this.bubble.classList.remove('is-visible')
      return
    }
    const box = new THREE.Box3().setFromObject(shown.object)
    const anchor = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y + 0.12, (box.min.z + box.max.z) / 2)
    const ndc = anchor.project(this.camera)
    if (ndc.z > 1) {
      this.bubble.classList.remove('is-visible')
      return
    }
    const uv = lensUndistort(new THREE.Vector2(ndc.x * 0.5 + 0.5, ndc.y * 0.5 + 0.5), this.camera.aspect)
    const x = THREE.MathUtils.clamp(uv.x, 0.08, 0.92) * window.innerWidth
    const y = THREE.MathUtils.clamp(1 - uv.y, 0.12, 0.95) * window.innerHeight
    this.bubble.textContent = text
    this.bubble.style.transform = `translate(${x}px, ${y}px)`
    this.bubble.classList.add('is-visible')
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.elapsed += dt

    this.moveCharacter(dt)
    this.moveCar(dt)
    this.updateCamera(dt)
    this.updateBubble()

    const flicker = 0.85 + Math.sin(this.elapsed * 13) * Math.sin(this.elapsed * 7.3) * 0.15
    this.room.candleLight.intensity = this.candleIntensity * flicker
    this.room.flame.scale.set(1, 1.8 * flicker, 1)

    this.lens.uniforms.uTime.value = this.elapsed
    this.composer.render()
  }
}
