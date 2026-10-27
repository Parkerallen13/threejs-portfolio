import * as THREE from 'three'

export class Experience {
  constructor(canvas) {
    this.canvas = canvas
    this.sizes = { width: window.innerWidth, height: window.innerHeight }
    this.pointer = new THREE.Vector2()
    this.scrollProgress = 0
    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog('#0b0b10', 6, 18)

    this.camera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 100)
    this.camera.position.set(0, 0, 8)
    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.setLights()
    this.setObjects()
    this.setParticles()
    this.setEvents()

    this.renderer.setAnimationLoop(() => this.update())
  }

  setLights() {
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.4))
    const key = new THREE.DirectionalLight('#ffffff', 2)
    key.position.set(3, 4, 5)
    this.scene.add(key)
    const rim = new THREE.PointLight('#7c5cff', 30, 20)
    rim.position.set(-4, -2, 2)
    this.scene.add(rim)
  }

  setObjects() {
    const material = new THREE.MeshStandardMaterial({ color: '#d8d4ff', roughness: 0.3, metalness: 0.6 })

    // One object per section; scroll moves the camera down past each
    this.sectionSpacing = 6
    this.objects = [
      new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.35, 160, 32), material),
      new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), material),
      new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.4, 32, 100), material),
    ]
    this.objects.forEach((mesh, i) => {
      mesh.position.set(i % 2 === 0 ? 2.5 : -2.5, -i * this.sectionSpacing, 0)
      this.scene.add(mesh)
    })
  }

  setParticles() {
    const count = 1500
    const positions = new Float32Array(count * 3)
    const depth = this.sectionSpacing * this.objects.length
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = this.sectionSpacing * 0.5 - Math.random() * depth
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color: '#7c5cff', size: 0.03, sizeAttenuation: true })
    this.scene.add(new THREE.Points(geometry, material))
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
    const elapsed = this.clock.getElapsedTime()

    for (const mesh of this.objects) {
      mesh.rotation.x = elapsed * 0.15
      mesh.rotation.y = elapsed * 0.2
    }

    // Camera follows scroll, with a little pointer parallax
    const targetY = -this.scrollProgress * this.sectionSpacing
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1
    this.camera.position.x += (this.pointer.x * 0.8 - this.camera.position.x) * 0.05

    this.renderer.render(this.scene, this.camera)
  }
}
