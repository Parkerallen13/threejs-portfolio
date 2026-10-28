import * as THREE from 'three'

// Colorado winter sky: just stars and a moon, shown at night
export function buildSky() {
  const group = new THREE.Group()
  let seed = 23
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  const count = 1800
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = 0.08 + rand() * 0.92 // upper sky only
    const theta = rand() * Math.PI * 2
    const r = 320
    const s = Math.sqrt(1 - u * u)
    positions.set([Math.cos(theta) * s * r, u * r, Math.sin(theta) * s * r], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffffff', size: 1.1, fog: false }))
  group.add(stars)

  const moon = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: '#f4efdc', fog: false }))
  moon.position.set(70, 120, -260)
  moon.lookAt(0, 0, 0)
  group.add(moon)

  return { group }
}
