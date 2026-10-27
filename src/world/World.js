import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildRoom, BOUNDS } from './room.js'
import { createCharacter } from './character.js'
import { createDog } from './dog.js'
import { createBird } from './birds.js'
import { buildForest } from './forest.js'
import { blobShadow } from './textures.js'
import { TOUR } from './tour.js'
import { createLensPass, lensDistort, lensUndistort, lens } from './lensPass.js'

// Misty storybook woods by day, moonlit blue with fireflies by night
const MODES = {
  light: { background: '#d6e3cf', ambient: ['#fff6e6', 1.5], sun: 2.2, lamp: 0, candle: 0, glass: '#e6f2ff', shade: 0, fireflies: false },
  dark: { background: '#1b2638', ambient: ['#7d8cc0', 0.6], sun: 0.35, lamp: 7, candle: 1.4, glass: '#1c2448', shade: 0.7, fireflies: true },
}

const WALK_SPEED = 2.4
const RADIUS = 0.28
const POSE_FPS = 12 // character poses update "on twos", like limited TV animation
const DOG_PATH = { x: 0.4, z: 3.1, rx: 3.6, rz: 1.1, speed: 0.4 }
const DOG_ROUTINE = ['loop', 'roll', 'loop', 'toCouch', 'jumpUp', 'lounge', 'jumpDown', 'toLoop']
const COUCH = { approach: new THREE.Vector3(-1.5, 0, 0.3), seat: new THREE.Vector3(-2.5, 0.62, -0.2) }

export class World {
  constructor(canvas, { bubble, say, labels, lines, mode, drawings, onActivate }) {
    this.canvas = canvas
    this.bubble = bubble
    this.say = say
    this.lines = lines
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
    this.scene.fog = new THREE.Fog('#d6e3cf', 14, 45)
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

    this.room = buildRoom({ drawings })
    this.scene.add(this.room.group)
    this.forest = buildForest()
    this.scene.add(this.forest.group)

    this.birds = [0, 1].map((i) => {
      const bird = createBird()
      this.scene.add(bird.root)
      return { ...bird, offset: i * Math.PI }
    })
    this.colliders = this.room.colliders

    this.character = createCharacter()
    this.character.root.position.set(...[TOUR[0].stand[0], 0, TOUR[0].stand[1]])
    this.scene.add(this.character.root)
    this.walkAmount = 0

    this.dog = createDog()
    this.scene.add(this.dog.root)
    this.run = { mode: 'loop', step: 0, timer: 0, t: Math.PI / 2, speed: DOG_PATH.speed, woofAt: -10, from: new THREE.Vector3() }

    const shadowMat = new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false })
    const shadow = (w, d) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadowMat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = 0.04
      this.scene.add(mesh)
      return mesh
    }
    this.characterShadow = shadow(0.9, 0.9)
    this.dogShadow = shadow(0.7, 1.2)

    this.character.root.userData.hotspot = 'me'
    this.dog.root.userData.hotspot = 'dog'
    this.hotspots = [...this.room.hotspots, this.character.root, this.dog.root].map((object) => ({
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
    this.scene.fog.color.set(m.background)
    this.forest.fireflies.visible = m.fireflies
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
    if (id === 'dog') {
      this.run.woofAt = this.elapsed
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

    // Don't let the husky run through Parker
    const dogPos = this.dog.root.position
    const away = new THREE.Vector3(pos.x - dogPos.x, 0, pos.z - dogPos.z)
    if (dogPos.y < 0.1 && away.length() < 0.65) {
      away.setLength(0.65)
      if (!this.blocked(dogPos.x + away.x, dogPos.z + away.z)) pos.set(dogPos.x + away.x, 0, dogPos.z + away.z)
    }

    this.walkAmount = THREE.MathUtils.lerp(this.walkAmount, walking, Math.min(1, dt * 10))
    this.poseClock += dt
    if (this.poseClock >= 1 / POSE_FPS) {
      this.character.update(this.poseClock, this.walkAmount)
      this.poseClock = 0
    }
    this.characterShadow.position.set(pos.x, 0.04, pos.z)
  }

  dogPoint(t, out = new THREE.Vector3()) {
    return out.set(DOG_PATH.x + Math.cos(t) * DOG_PATH.rx, 0, DOG_PATH.z + Math.sin(t) * DOG_PATH.rz)
  }

  // Trot toward a floor point; returns true once there
  dogWalkTo(target, dt) {
    const root = this.dog.root
    const dir = new THREE.Vector3(target.x - root.position.x, 0, target.z - root.position.z)
    const dist = dir.length()
    if (dist < 0.06) return true
    root.position.addScaledVector(dir.normalize(), Math.min(dist, 2.0 * dt))
    root.rotation.y = Math.atan2(dir.x, dir.z)
    return false
  }

  // The husky's day: zoomies, a roll on the floor, more zoomies, then up onto the couch
  // for a nap, and back down again
  moveDog(dt) {
    const r = this.run
    const root = this.dog.root
    r.timer += dt
    let pace = 0
    let lying = false
    let rolling = false
    let lift = 0
    const next = () => {
      r.step = (r.step + 1) % DOG_ROUTINE.length
      r.mode = DOG_ROUTINE[r.step]
      r.timer = 0
      r.from.copy(root.position)
    }

    if (r.mode === 'loop') {
      // Stop and wait if Parker is in the way
      const ahead = this.dogPoint(r.t + 0.35)
      const blocked = ahead.distanceTo(this.character.root.position) < 0.9
      r.speed = THREE.MathUtils.lerp(r.speed, blocked ? 0 : DOG_PATH.speed, Math.min(1, dt * 5))
      if (blocked && this.elapsed - r.woofAt > 3) r.woofAt = this.elapsed
      r.t += r.speed * dt
      root.position.copy(this.dogPoint(r.t))
      root.rotation.y = Math.atan2(-Math.sin(r.t) * DOG_PATH.rx, Math.cos(r.t) * DOG_PATH.rz)
      pace = r.speed / DOG_PATH.speed
      if (r.timer > (r.step === 0 ? 7 : 5)) next()
    } else if (r.mode === 'roll') {
      const k = Math.min(1, r.timer / 1.4)
      this.dog.spin.rotation.z = k * Math.PI * 2
      lift = -0.18 * Math.sin(k * Math.PI)
      rolling = k < 1
      if (k >= 1) {
        this.dog.spin.rotation.z = 0
        next()
      }
    } else if (r.mode === 'toCouch') {
      pace = 1
      if (this.dogWalkTo(COUCH.approach, dt)) next()
    } else if (r.mode === 'toLoop') {
      pace = 1
      if (this.dogWalkTo(this.dogPoint(r.t), dt)) next()
    } else if (r.mode === 'jumpUp' || r.mode === 'jumpDown') {
      const to = r.mode === 'jumpUp' ? COUCH.seat : COUCH.approach
      const k = Math.min(1, r.timer / 0.55)
      root.position.lerpVectors(r.from, to, k)
      root.position.y += Math.sin(k * Math.PI) * 0.7
      root.rotation.y = Math.atan2(to.x - r.from.x, to.z - r.from.z)
      if (k >= 1) next()
    } else if (r.mode === 'lounge') {
      root.position.copy(COUCH.seat)
      root.rotation.y = Math.PI / 2
      lying = true
      lift = -0.12
      if (r.timer > 6) next()
    }

    // Cartoon physics on twos: trot bounce, lean into turns, hop when woofing
    const sinceWoof = this.elapsed - r.woofAt
    const frame = Math.floor(this.elapsed * POSE_FPS)
    this.dog.body.rotation.z = r.mode === 'loop' ? -0.12 * Math.cos(r.t) ** 2 * pace : 0
    this.dog.spin.position.y =
      0.4 + lift + (sinceWoof < 0.6 ? Math.abs(Math.sin(sinceWoof * 10)) * 0.18 : 0) + (frame % 2) * 0.03 * pace
    this.dogPose = (this.dogPose ?? 0) + dt
    if (this.dogPose >= 1 / POSE_FPS) {
      this.dog.update(this.dogPose, pace, this.elapsed, { lying, rolling })
      this.dogPose = 0
    }
    this.dogShadow.position.set(root.position.x, root.position.y + 0.04, root.position.z)
    this.dogShadow.rotation.z = root.rotation.y
  }

  // Two bluebirds fluttering figure-eights under the rafters
  moveBirds() {
    const frame = Math.floor(this.elapsed * POSE_FPS)
    for (const bird of this.birds) {
      const t = this.elapsed * 0.45 + bird.offset
      const pos = new THREE.Vector3(Math.sin(t) * 3.6, 2.5 + Math.sin(t * 3) * 0.25, Math.sin(t * 2) * 1.8 - 0.8)
      const ahead = new THREE.Vector3(Math.sin(t + 0.05) * 3.6, pos.y, Math.sin((t + 0.05) * 2) * 1.8 - 0.8)
      bird.root.position.copy(pos)
      bird.root.rotation.y = Math.atan2(ahead.x - pos.x, ahead.z - pos.z)
      bird.flap(frame)
    }
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

    // Parker talks to you once you've settled on a stop and they've walked over
    const chapter = TOUR[this.chapterIndex()]
    const settled = Math.abs(this.progress - this.chapterIndex()) < 0.2
    const arrived = this.walkAmount < 0.1
    const line = settled && arrived && !this.paused && this.lines[chapter.key]
    if (line) {
      const head = this.character.root.position.clone().setY(2.1)
      this.place(this.say, head, line)
    } else {
      this.say.classList.remove('is-visible')
    }

    // Hovered thing wins; otherwise point at the current chapter's object
    let shown = this.hovered ?? (settled ? this.hotspots.find((h) => h.id === chapter.key) : null)
    let text = shown && this.labels[shown.id]
    if (this.elapsed - this.run.woofAt < 1.4) {
      shown = this.hotspots.find((h) => h.id === 'dog')
      text = 'WOOF!'
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
    this.place(this.bubble, anchor, text)
  }

  // Pin an HTML bubble above a 3D point, through the fisheye
  place(el, point, text) {
    const ndc = point.clone().project(this.camera)
    if (ndc.z > 1) {
      el.classList.remove('is-visible')
      return
    }
    const uv = lensUndistort(new THREE.Vector2(ndc.x * 0.5 + 0.5, ndc.y * 0.5 + 0.5), this.camera.aspect)
    const x = THREE.MathUtils.clamp(uv.x, 0.12, 0.88) * window.innerWidth
    const y = THREE.MathUtils.clamp(1 - uv.y, 0.16, 0.95) * window.innerHeight
    if (el.textContent !== text) el.textContent = text
    el.style.transform = `translate(${x}px, ${y}px)`
    el.classList.add('is-visible')
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.elapsed += dt

    this.moveCharacter(dt)
    this.moveDog(dt)
    this.moveBirds()
    this.updateCamera(dt)
    this.updateBubble()

    const flicker = 0.85 + Math.sin(this.elapsed * 13) * Math.sin(this.elapsed * 7.3) * 0.15
    this.room.candleLight.intensity = this.candleIntensity * flicker
    this.room.flame.scale.set(1, 1.8 * flicker, 1)

    this.lens.uniforms.uTime.value = this.elapsed
    this.composer.render()
  }
}
