import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildRoom, BOUNDS } from './room.js'
import { createCharacter } from './character.js'
import { createDog } from './dog.js'
import { createBird } from './birds.js'
import { buildCoast } from './coast.js'
import { buildSky } from './sky.js'
import { blobShadow } from './textures.js'
import { TOUR, DOOR_OPEN_AT } from './tour.js'
import { createLensPass, lensDistort, lensUndistort, lens } from './lensPass.js'

// Sunny San Diego day, or a warm dusky evening with glowing windows
const MODES = {
  light: { background: '#8fcdf0', fog: '#d6edf7', ambient: ['#f4f6ff', 1.5], sun: 2.0, lamp: 0, candle: 0.6, glass: '#e6f2ff', shade: 0, fire: 3, stars: false },
  dark: { background: '#2a2748', fog: '#5a4a68', stars: true, ambient: ['#7d8cc0', 0.6], sun: 0.35, lamp: 7, candle: 1.4, glass: '#ffcf7a', shade: 0.7, fire: 6 },
}

const WALK_SPEED = 2.4
const RADIUS = 0.28
const PORCH_EDGE = 8.1 // Parker can step out onto the porch, but not off it
const POSE_FPS = 12 // character poses update "on twos", like limited TV animation
const DOG_PATH = { x: 0.4, z: 3.1, rx: 2.2, rz: 1.1, speed: 0.4 } // laps between the dining table and the kitchen island
const DOG_ROUTINE = ['loop', 'roll', 'loop', 'toCouch', 'jumpUp', 'lounge', 'jumpDown', 'toLoop']
// When the front door opens the husky bolts outside, does laps in the snow, then trots back in
const DOOR_INSIDE = new THREE.Vector3(0.3, 0, 3.8)
const DOOR_OUTSIDE = new THREE.Vector3(0.3, 0, 6.4)
const STEP_BOTTOM = new THREE.Vector3(0.3, 0, 9.8)
const YARD = { x: -3.5, z: 12.5, r: 1.8 }
const GROUND_Y = -0.44
// Where the husky sits to beg for a noodle while Parker cooks
const BEG_SPOT = new THREE.Vector3(4.4, 0, 0.6)
const COUCH = { approach: new THREE.Vector3(-1.5, 0, 0.3), seat: new THREE.Vector3(-2.5, 0.62, -0.2) }

export class World {
  constructor(canvas, { bubble, say, labels, lines, mode, drawings, canArt, characterStyle, onActivate }) {
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
    this.scene.fog = new THREE.Fog('#d6edf7', 60, 260)
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 400)
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

    this.room = buildRoom({ drawings, canArt })
    this.scene.add(this.room.group)
    this.forest = buildCoast()
    this.scene.add(this.forest.group)
    this.sky = buildSky()
    this.scene.add(this.sky.group)

    this.birds = [0, 1].map((i) => {
      const bird = createBird()
      this.scene.add(bird.root)
      return { ...bird, offset: i * Math.PI }
    })
    this.colliders = this.room.colliders

    this.character = createCharacter(characterStyle)
    this.character.root.position.set(...[TOUR[0].stand[0], 0, TOUR[0].stand[1]])
    this.scene.add(this.character.root)
    this.walkAmount = 0

    this.dog = createDog()
    this.scene.add(this.dog.root)
    this.run = { mode: 'waitDoor', step: -1, timer: 0, t: Math.PI / 2, speed: DOG_PATH.speed, woofAt: -10, woofText: 'WOOF!', from: new THREE.Vector3(), laps: 0, hasNoodle: false }
    this.dog.root.position.copy(DOOR_INSIDE)
    this.candleLit = true
    this.fridgeOpen = 0
    this.fridgeWanted = false
    this.fireBoostAt = -10

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
    this.scene.fog.color.set(m.fog)
    this.sky.group.visible = m.stars
    this.fireIntensity = m.fire
    this.ambient.color.set(m.ambient[0])
    this.ambient.intensity = m.ambient[1]
    this.sun.intensity = m.sun
    this.room.lampLight.intensity = m.lamp
    this.candleIntensity = m.candle
    this.room.glassMaterial.color.set(m.glass)
    this.room.shadeMaterial.emissiveIntensity = m.shade
  }

  // Swap Parker's drawing style in place (same spot, same pose)
  setCharacterStyle(style) {
    const old = this.character.root
    this.character = createCharacter(style)
    this.character.root.position.copy(old.position)
    this.character.root.rotation.copy(old.rotation)
    this.character.root.userData.hotspot = 'me'
    this.scene.remove(old)
    this.scene.add(this.character.root)
    const entry = this.hotspots.find((h) => h.object === old)
    if (entry) entry.object = this.character.root
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
      this.run.woofText = 'WOOF!'
      return
    }
    if (id === 'candle') {
      this.candleLit = !this.candleLit
      this.room.flame.visible = this.candleLit
      this.actionText = this.candleLit ? 'Lit!' : 'Poof!'
      this.actionAt = this.elapsed
      this.actionId = 'candle'
      return
    }
    if (id === 'fridge') {
      this.fridgeWanted = this.fridgeOpen < 0.5
      return
    }
    if (id === 'fire') {
      this.fireBoostAt = this.elapsed
      this.actionText = 'Toasty!'
      this.actionAt = this.elapsed
      this.actionId = 'fire'
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
    if (z < BOUNDS.minZ + RADIUS || z > PORCH_EDGE - RADIUS) return true
    return this.colliders.some(
      (c) => x > c.minX - RADIUS && x < c.maxX + RADIUS && z > c.minZ - RADIUS && z < c.maxZ + RADIUS,
    )
  }

  // Parker walks over to whatever the current chapter is about
  moveCharacter(dt) {
    const pos = this.character.root.position
    const chapter = TOUR[this.chapterIndex()]
    let [tx, tz] = chapter.stand
    // Going between the porch and the house? Route through the front door
    const DOOR_X = 0.3
    const inside = pos.z < 5.05
    if (inside !== tz < 5.05 && Math.abs(pos.x - DOOR_X) > 0.25) {
      tx = DOOR_X
      tz = inside ? 4.5 : 5.7
    } else if (inside !== tz < 5.05) tx = DOOR_X
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
      // Bumped into furniture: sidestep along it (keeping the same side until free)
      if (before.distanceTo(pos) < step * 0.3) {
        this.sideSign = this.sideSign ?? 1
        for (const sign of [this.sideSign, -this.sideSign]) {
          const sx = pos.x - input.z * sign * step
          const sz = pos.z + input.x * sign * step
          if (!this.blocked(sx, sz)) {
            pos.set(sx, 0, sz)
            this.sideSign = sign
            input.set(-input.z * sign, 0, input.x * sign)
            break
          }
        }
      } else this.sideSign = null
      walking = Math.min(1, before.distanceTo(pos) / step)
      facing = Math.atan2(input.x, input.z)
    } else {
      // Arrived: turn to talk to you (or to whatever they're busy with, like the stove)
      const face = TOUR[this.chapterIndex()].face
      const fx = face ? face[0] : this.camera.position.x
      const fz = face ? face[1] : this.camera.position.z
      facing = Math.atan2(fx - pos.x, fz - pos.z)
    }
    if (this.character.billboard) {
      // The flat cutout always faces you, and flips to face the way it's walking
      if (walking > 0.2) {
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0)
        this.character.setFlip?.(input.x * right.x + input.z * right.z < 0)
      }
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
    this.characterShadow.position.set(pos.x, pos.y + 0.04, pos.z)
  }

  dogPoint(t, out = new THREE.Vector3()) {
    return out.set(DOG_PATH.x + Math.cos(t) * DOG_PATH.rx, 0, DOG_PATH.z + Math.sin(t) * DOG_PATH.rz)
  }

  // Trot toward a floor point; returns true once there
  dogWalkTo(target, dt, speed = 2.0) {
    const root = this.dog.root
    const dir = new THREE.Vector3(target.x - root.position.x, 0, target.z - root.position.z)
    const dist = dir.length()
    if (dist < 0.06) return true
    root.position.addScaledVector(dir.normalize(), Math.min(dist, speed * dt))
    root.rotation.y = Math.atan2(dir.x, dir.z)
    return false
  }

  // The husky's day: zoomies, a roll on the floor, more zoomies, then up onto the couch
  // for a nap, and back down again
  moveDog(dt) {
    const r = this.run
    const root = this.dog.root
    r.timer += dt
    const inside = !['waitDoor', 'out', 'yard', 'backIn'].includes(r.mode)
    const cooking = TOUR[this.chapterIndex()].key === 'aldente' && Math.abs(this.progress - this.chapterIndex()) < 0.2
    if (cooking && inside && !r.hasNoodle && r.mode !== 'beg' && root.position.y < 0.1) {
      r.mode = 'beg'
      r.timer = 0
    }
    if (!cooking && r.hasNoodle && r.mode === 'lounge' && r.timer > 2) {
      r.hasNoodle = false
      this.dog.noodle.visible = false
    }
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

    const doorOpen = this.doorOpen ?? 0
    if (r.mode === 'waitDoor') {
      root.rotation.y = 0
      if (doorOpen > 0.75) {
        r.mode = 'out'
        r.wp = 0
        r.timer = 0
      }
    } else if (r.mode === 'out') {
      pace = 1.3
      // Across the porch, down the steps, then off into the snow
      const arrived = this.dogWalkTo(r.wp === 1 ? STEP_BOTTOM : DOOR_OUTSIDE, dt, 3.2)
      if (arrived && r.wp !== 1) r.wp = 1
      else if (arrived) {
        r.mode = 'yard'
        r.timer = 0
        r.yardT = Math.PI / 2 + Math.PI
      }
    } else if (r.mode === 'yard') {
      // Zoomies in the snow
      r.yardT += dt * 1.6
      root.position.set(YARD.x + Math.cos(r.yardT) * YARD.r, GROUND_Y, YARD.z + Math.sin(r.yardT) * YARD.r * 0.8)
      root.rotation.y = Math.atan2(-Math.sin(r.yardT), Math.cos(r.yardT) * 0.8)
      pace = 1.3
      if (r.timer > 1.2 && r.timer < 1.3 && this.elapsed - r.woofAt > 2) {
        r.woofAt = this.elapsed
        r.woofText = 'WOOF!'
      }
      if (r.timer > 7) {
        r.mode = 'backIn'
        r.wp = 0
        r.timer = 0
      }
    } else if (r.mode === 'backIn') {
      // Out of the yard to the doorstep, then through the door
      pace = 1
      const waypoint = [STEP_BOTTOM, DOOR_OUTSIDE, DOOR_INSIDE][r.wp]
      if (this.dogWalkTo(waypoint, dt, 2.6)) {
        if (r.wp === 2) {
          r.step = DOG_ROUTINE.indexOf('toLoop')
          r.mode = 'toLoop'
          r.timer = 0
        } else r.wp++
      }
    } else if (r.mode === 'beg') {
      pace = 1
      if (this.dogWalkTo(BEG_SPOT, dt, 2.4)) {
        root.rotation.y = Math.atan2(this.character.root.position.x - root.position.x, this.character.root.position.z - root.position.z)
        pace = 0
        if (r.timer > 2.2 && !r.hasNoodle) {
          r.hasNoodle = true
          this.dog.noodle.visible = true
          r.woofAt = this.elapsed
          r.woofText = 'Nom!'
        }
        if (r.timer > 4) {
          r.step = DOG_ROUTINE.indexOf('toCouch')
          r.mode = 'toCouch'
          r.timer = 0
        }
      }
    } else if (r.mode === 'loop') {
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

    if (['out', 'yard', 'backIn'].includes(r.mode)) root.position.y = root.position.z > 8.6 ? GROUND_Y : 0

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

  // Straight line between stops, or two legs through `via` (the front door)
  cameraPath(a, b, t) {
    const from = new THREE.Vector3(...a.cam)
    const to = new THREE.Vector3(...b.cam)
    if (!b.via) return from.lerp(to, t)
    const via = new THREE.Vector3(...b.via)
    return t < 0.5 ? from.lerp(via, t * 2) : via.lerp(to, (t - 0.5) * 2)
  }

  updateCamera(dt) {
    // Hold on each chapter, then glide to the next
    const i = Math.min(Math.floor(this.progress), TOUR.length - 2)
    const t = THREE.MathUtils.smoothstep(this.progress - i, 0.15, 0.85)
    const a = TOUR[i]
    const b = TOUR[i + 1]
    const pos = this.cameraPath(a, b, t)
    const look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), t)
    // The door swings open as you walk up to it, and stays open
    this.doorOpen = THREE.MathUtils.smoothstep(this.progress, DOOR_OPEN_AT - 0.75, DOOR_OPEN_AT - 0.1)
    if (this.doorOpen > (this.doorMax ?? 0)) this.doorMax = this.doorOpen
    this.room.doorHinge.rotation.y = (this.doorMax ?? 0) * 1.7

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
      text = this.run.woofText
    } else if (this.elapsed - (this.actionAt ?? -10) < 1.4) {
      shown = this.hotspots.find((h) => h.id === this.actionId)
      text = this.actionText
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

    this.forest.update(dt, this.elapsed)
    const flicker = 0.85 + Math.sin(this.elapsed * 13) * Math.sin(this.elapsed * 7.3) * 0.15
    this.room.candleLight.intensity = this.candleLit ? this.candleIntensity * flicker : 0
    this.room.flame.scale.set(1, 1.8 * flicker, 1)

    // Fire flickers on twos; clicking it makes it roar for a moment
    const frame = Math.floor(this.elapsed * POSE_FPS)
    const boost = 1 + Math.max(0, 1 - (this.elapsed - this.fireBoostAt) / 1.5) * 0.8
    this.room.flames.forEach((f, i) => {
      const n = Math.sin(frame * 1.7 + i * 2.3) * 0.5 + 0.5
      f.scale.set(1, (0.75 + n * 0.5) * boost, 1)
      f.position.y = f.userData.base + (n - 0.5) * 0.05
      f.rotation.z = Math.sin(frame * 0.9 + i) * 0.12
    })
    this.room.fireLight.intensity = this.fireIntensity * (0.85 + Math.sin(frame * 2.1) * 0.15) * boost

    // Fridge swings open at the Bad Decisions stop (or when clicked), light on inside
    const atFridge = TOUR[this.chapterIndex()].key === 'brewing' && Math.abs(this.progress - this.chapterIndex()) < 0.3
    const wantOpen = this.fridgeWanted || atFridge
    this.fridgeOpen = THREE.MathUtils.lerp(this.fridgeOpen, wantOpen ? 1 : 0, Math.min(1, dt * 4))
    this.room.fridgeHinge.rotation.y = this.fridgeOpen * 1.9
    this.room.fridgeLight.intensity = this.fridgeOpen * 2.5
    if (!atFridge && this.wasAtFridge) this.fridgeWanted = false
    this.wasAtFridge = atFridge

    // Rolling boil in the pasta pot
    for (const b of this.room.bubbles) {
      const k = (this.elapsed * 1.6 + b.userData.phase) % 1
      b.position.set(Math.cos(b.userData.a) * 0.12 * (1 - k * 0.3), 0.245 + Math.sin(k * Math.PI) * 0.025, Math.sin(b.userData.a) * 0.12)
      b.scale.setScalar(0.5 + Math.sin(k * Math.PI))
    }

    // Steam curling up off the pasta pot
    for (const puff of this.room.steam) {
      const k = (this.elapsed * 0.5 + puff.userData.phase) % 1
      puff.position.set(Math.sin(k * 6 + puff.userData.phase * 9) * 0.06, 0.3 + k * 0.7, 0)
      puff.scale.setScalar(0.6 + k * 1.4)
      puff.material.opacity = 0.5 * (1 - k)
    }

    this.lens.uniforms.uTime.value = this.elapsed
    this.composer.render()
  }
}
