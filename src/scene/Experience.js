import * as THREE from 'three'

const COLORS = {
  paper: '#f4ecd8',
  ink: '#1d1a16',
  tomato: '#e0482f',
  mustard: '#f2b632',
  teal: '#2a8c84',
  pink: '#f2a7a0',
}

export class Experience {
  constructor(canvas) {
    this.canvas = canvas
    this.sizes = { width: window.innerWidth, height: window.innerHeight }
    this.pointer = new THREE.Vector2()
    this.scrollProgress = 0
    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(COLORS.paper, 8, 20)

    this.camera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 100)
    this.camera.position.set(0, 0, 8)
    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.gradientMap = this.createGradientMap()
    this.sectionSpacing = 6
    this.animated = []

    this.setLights()
    this.setObjects()
    this.setSparkles()
    this.setEvents()

    this.renderer.setAnimationLoop(() => this.update())
  }

  // Three flat tones, like a two-color print job plus shadow
  createGradientMap() {
    const data = new Uint8Array([90, 180, 255])
    const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true
    return texture
  }

  toon(color) {
    return new THREE.MeshToonMaterial({ color, gradientMap: this.gradientMap })
  }

  // Inverted-hull outline for an inked cartoon look
  inked(geometry, color, thickness = 1.06) {
    const mesh = new THREE.Mesh(geometry, this.toon(color))
    const outline = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: COLORS.ink, side: THREE.BackSide }),
    )
    outline.scale.setScalar(thickness)
    mesh.add(outline)
    return mesh
  }

  starShape(points, outer, inner) {
    const shape = new THREE.Shape()
    for (let i = 0; i <= points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
    }
    return shape
  }

  starGeometry(points, outer, inner, depth = 0.2) {
    const geometry = new THREE.ExtrudeGeometry(this.starShape(points, outer, inner), {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 2,
    })
    geometry.center()
    return geometry
  }

  boomerangGeometry() {
    const shape = new THREE.Shape()
    shape.moveTo(-1.2, 0.2)
    shape.quadraticCurveTo(0, 1.1, 1.2, 0.2)
    shape.quadraticCurveTo(1.35, -0.05, 1.05, -0.05)
    shape.quadraticCurveTo(0, 0.55, -1.05, -0.05)
    shape.quadraticCurveTo(-1.35, -0.05, -1.2, 0.2)
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    })
    geometry.center()
    return geometry
  }

  setLights() {
    this.scene.add(new THREE.AmbientLight('#ffffff', 1.2))
    const key = new THREE.DirectionalLight('#ffffff', 2.2)
    key.position.set(3, 4, 5)
    this.scene.add(key)
  }

  setObjects() {
    const x = 2.6

    // Hero: atomic-age atom
    const atom = new THREE.Group()
    atom.add(this.inked(new THREE.SphereGeometry(0.55, 32, 32), COLORS.tomato, 1.08))
    const ringMaterial = new THREE.MeshBasicMaterial({ color: COLORS.ink })
    this.electrons = []
    for (let i = 0; i < 3; i++) {
      const orbit = new THREE.Group()
      orbit.rotation.order = 'YXZ'
      orbit.rotation.y = (i * Math.PI) / 3
      orbit.rotation.x = Math.PI / 2.6
      orbit.add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.03, 12, 120), ringMaterial))
      const electron = this.inked(new THREE.SphereGeometry(0.16, 20, 20), COLORS.mustard, 1.15)
      orbit.add(electron)
      this.electrons.push({ mesh: electron, offset: (i * Math.PI * 2) / 3 })
      atom.add(orbit)
    }
    atom.position.set(x, 0, 0)
    this.scene.add(atom)
    this.atom = atom

    // Work: stack of boomerangs
    const boomerangs = new THREE.Group()
    const boomerangGeometry = this.boomerangGeometry()
    ;[COLORS.teal, COLORS.pink, COLORS.mustard].forEach((color, i) => {
      const b = this.inked(boomerangGeometry, color, 1.05)
      b.position.set((i - 1) * 0.5, (i - 1) * 0.9, -i * 0.3)
      b.rotation.z = (i - 1) * 0.6
      boomerangs.add(b)
      this.animated.push({ mesh: b, speed: 0.6 + i * 0.2, phase: i })
    })
    boomerangs.position.set(x + 0.4, -this.sectionSpacing, -1)
    this.scene.add(boomerangs)

    // Contact: big starburst, like a "SALE!" sticker
    const burst = this.inked(this.starGeometry(14, 1.5, 1.15, 0.25), COLORS.mustard, 1.04)
    burst.position.set(x, -this.sectionSpacing * 2, 0)
    this.scene.add(burst)
    this.burst = burst
  }

  // Four-point atomic sparkles scattered through the scroll depth
  setSparkles() {
    const geometry = this.starGeometry(4, 0.35, 0.08, 0.06)
    const palette = [COLORS.ink, COLORS.tomato, COLORS.teal, COLORS.mustard]
    const depth = this.sectionSpacing * 3
    this.sparkles = []
    for (let i = 0; i < 40; i++) {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: palette[i % palette.length] }))
      mesh.position.set(
        (Math.random() - 0.5) * 14,
        this.sectionSpacing * 0.6 - Math.random() * depth,
        -2 - Math.random() * 6,
      )
      mesh.userData.base = 0.4 + Math.random() * 0.8
      mesh.userData.phase = Math.random() * Math.PI * 2
      this.scene.add(mesh)
      this.sparkles.push(mesh)
    }
  }

  setEvents() {
    window.addEventListener('resize', () => {
      this.sizes.width = window.innerWidth
      this.sizes.height = window.innerHeight
      this.camera.aspect = this.sizes.width / this.sizes.height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.sizes.width, this.sizes.height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    window.addEventListener('pointermove', (e) => {
      this.pointer.x = e.clientX / this.sizes.width - 0.5
      this.pointer.y = e.clientY / this.sizes.height - 0.5
    })

    window.addEventListener('scroll', () => {
      this.scrollProgress = window.scrollY / this.sizes.height
    })
  }

  update() {
    const t = this.clock.getElapsedTime()

    // Rubber-hose bounce: squash and stretch on the beat
    const bounce = Math.abs(Math.sin(t * 2.2))
    this.atom.rotation.y = t * 0.3
    this.atom.position.y = bounce * 0.25
    this.atom.scale.set(1 + (1 - bounce) * 0.04, 1 - (1 - bounce) * 0.04, 1)
    for (const { mesh, offset } of this.electrons) {
      const a = t * 1.8 + offset
      mesh.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0)
    }

    for (const { mesh, speed, phase } of this.animated) {
      mesh.rotation.y = Math.sin(t * speed + phase) * 0.5
      mesh.rotation.x = Math.cos(t * speed * 0.7 + phase) * 0.3
    }

    this.burst.rotation.z = t * 0.25
    this.burst.rotation.y = Math.sin(t * 0.8) * 0.4

    for (const s of this.sparkles) {
      s.rotation.z = t * 0.5 + s.userData.phase
      const twinkle = 0.7 + Math.sin(t * 3 + s.userData.phase) * 0.3
      s.scale.setScalar(twinkle * s.userData.base)
    }

    // Camera follows scroll, with a little pointer parallax
    const targetY = -this.scrollProgress * this.sectionSpacing
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1
    this.camera.position.x += (this.pointer.x * 0.8 - this.camera.position.x) * 0.05

    this.renderer.render(this.scene, this.camera)
  }
}
