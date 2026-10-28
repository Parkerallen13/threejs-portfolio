import * as THREE from 'three'

function canvasTexture(width, height, draw, repeat) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(...repeat)
  }
  return texture
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// Wide, low-contrast planks: fine 1-2px lines shimmer at a distance, so keep everything soft
export const woodFloor = () =>
  canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const tones = ['#c8955f', '#c08b56', '#cf9e69', '#c4915b'] // pale oak
      const cols = 4
      const colW = w / cols
      for (let c = 0; c < cols; c++) {
        let y = -Math.random() * 200
        while (y < h) {
          const len = 220 + Math.random() * 260
          ctx.fillStyle = pick(tones)
          ctx.fillRect(c * colW, y, colW, len)
          ctx.strokeStyle = 'rgba(110, 55, 20, 0.12)'
          ctx.lineWidth = 6
          for (let g = 0; g < 2; g++) {
            const gx = c * colW + 20 + Math.random() * (colW - 40)
            ctx.beginPath()
            ctx.moveTo(gx, y + 10)
            ctx.bezierCurveTo(gx + 14, y + len * 0.3, gx - 14, y + len * 0.7, gx, y + len - 10)
            ctx.stroke()
          }
          ctx.fillStyle = 'rgba(70, 35, 12, 0.3)'
          ctx.fillRect(c * colW, y, colW, 4)
          y += len
        }
        ctx.fillStyle = 'rgba(70, 35, 12, 0.3)'
        ctx.fillRect(c * colW, 0, 4, h)
      }
    },
    [2, 1.6],
  )

export const brick = (painted = false) =>
  canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = painted ? '#d8d2c8' : '#d8c2a4'
      ctx.fillRect(0, 0, w, h)
      const rows = 10
      const rowH = h / rows
      const brickW = w / 4
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 ? brickW / 2 : 0
        for (let b = -1; b < 5; b++) {
          ctx.fillStyle = pick(painted ? ['#f1ede6', '#ebe6dd', '#f4f1eb', '#e6e0d6'] : ['#a4503a', '#9a4632', '#b25c42', '#8f412f'])
          ctx.fillRect(b * brickW + offset + 3, r * rowH + 3, brickW - 6, rowH - 6)
        }
      }
    },
    [2, 3],
  )

export const blanketStripes = () =>
  canvasTexture(64, 256, (ctx, w, h) => {
    const bands = [
      ['#1f3b73', 28], ['#f4ecd8', 6], ['#e04a2f', 18], ['#f2c230', 10], ['#2a9d8f', 22],
      ['#f4ecd8', 6], ['#1f3b73', 14], ['#e04a2f', 30], ['#f28c28', 12], ['#2a9d8f', 16],
      ['#f4ecd8', 8], ['#1f3b73', 30], ['#f2c230', 14], ['#e04a2f', 24], ['#2a9d8f', 18],
    ]
    let y = 0
    while (y < h) {
      for (const [color, size] of bands) {
        ctx.fillStyle = color
        ctx.fillRect(0, y, w, size)
        y += size
      }
    }
  })

export const rug = () =>
  canvasTexture(256, 192, (ctx, w, h) => {
    // Faded vintage rug: terracotta field, rose and cream pattern
    ctx.fillStyle = '#c4917a'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#d9b9a2'
    ctx.lineWidth = 3
    for (let x = -h; x < w + h; x += 28) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.moveTo(x + h, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    ctx.strokeStyle = '#9c5f48'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 10, w - 20, h - 20)
  })

export const artRainbow = () =>
  canvasTexture(128, 160, (ctx, w, h) => {
    const colors = ['#e04a2f', '#f28c28', '#f2c230', '#5bb56a', '#2a8cc4', '#7a4fb0', '#e86aa6']
    ctx.fillStyle = '#f4ecd8'
    ctx.fillRect(0, 0, w, h)
    colors.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.moveTo(0, 30 + i * 18)
      ctx.lineTo(w, i * 18)
      ctx.lineTo(w, 14 + i * 18)
      ctx.lineTo(0, 44 + i * 18)
      ctx.fill()
    })
  })

export const artMosaic = () =>
  canvasTexture(128, 160, (ctx, w, h) => {
    const colors = ['#e04a2f', '#f2c230', '#2a8c84', '#1f3b73', '#e86aa6', '#f4ecd8', '#f28c28']
    const size = 16
    for (let x = 0; x < w; x += size)
      for (let y = 0; y < h; y += size) {
        ctx.fillStyle = pick(colors)
        ctx.fillRect(x, y, size - 2, size - 2)
      }
  })

export const artSky = () =>
  canvasTexture(128, 160, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#2f5fb0')
    g.addColorStop(1, '#a9cfee')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    for (const [x, y, r] of [[30, 50, 18], [50, 45, 22], [72, 52, 16], [90, 110, 20], [108, 104, 14]]) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  })

export const artMarbled = () =>
  canvasTexture(128, 180, (ctx, w, h) => {
    ctx.fillStyle = '#e46f37'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = pick(['#f6a25e', '#c4512a', '#f7d08a', '#b8432a'])
      ctx.lineWidth = 2 + Math.random() * 4
      ctx.beginPath()
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.moveTo(x, y)
      ctx.bezierCurveTo(x + 30, y - 20, x - 30, y + 40, x + Math.random() * 40 - 20, y + 60)
      ctx.stroke()
    }
  })

export const screen = (label) =>
  canvasTexture(256, 150, (ctx, w, h) => {
    ctx.fillStyle = '#1d1a16'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2a8c84'
    ctx.fillRect(0, h - 26, w, 26)
    ctx.fillStyle = '#f4ecd8'
    ctx.font = 'bold 34px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, w / 2, h / 2 + 4)
  })

export const blobShadow = () =>
  canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

// Type specimen poster; redraws once the custom typeface finishes loading
export function typePoster() {
  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 700
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  function draw(family) {
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = '#f2b632'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#1d1a16'
    ctx.lineWidth = 10
    ctx.strokeRect(18, 18, w - 36, h - 36)
    ctx.fillStyle = '#1d1a16'
    ctx.textAlign = 'center'
    ctx.font = `bold 26px "Space Mono", monospace`
    ctx.fillText('A TYPEFACE BY PARKER', w / 2, 80)
    ctx.font = `260px "${family}", "Fraunces", serif`
    ctx.fillText('Aa', w / 2, 360)
    ctx.fillStyle = '#e0482f'
    ctx.fillRect(50, 400, w - 100, 8)
    ctx.fillStyle = '#1d1a16'
    ctx.font = `46px "${family}", "Fraunces", serif`
    ctx.fillText('ABCDEFGHIJKLM', w / 2, 480)
    ctx.fillText('NOPQRSTUVWXYZ', w / 2, 540)
    ctx.fillText('0123456789 &!?', w / 2, 600)
    texture.needsUpdate = true
  }

  draw('ParkerType')
  return { texture, draw }
}

// Placeholder art in a Reccardi-ish mid-century style until real drawings are added
export const artReccardi = (variant = 0) =>
  canvasTexture(200, 260, (ctx, w, h) => {
    const palettes = [
      ['#e2a33a', '#c9772b', '#8f3b1f', '#f7e7c4', '#6fb7c4'],
      ['#b4507a', '#7d3a6b', '#3b2a4f', '#f7e7c4', '#5fb3c9'],
      ['#2f4a73', '#22385a', '#e86a3a', '#f7e7c4', '#f2c230'],
    ]
    const [bg, mid, dark, light, pop] = palettes[variant % palettes.length]
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    // Dry-brush blocks
    for (let i = 0; i < 16; i++) {
      ctx.globalAlpha = 0.35 + Math.random() * 0.3
      ctx.fillStyle = mid
      ctx.fillRect(Math.random() * w - 20, Math.random() * h - 20, 30 + Math.random() * 70, 20 + Math.random() * 60)
    }
    ctx.globalAlpha = 0.18
    ctx.fillStyle = dark
    for (let i = 0; i < 500; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1 + Math.random() * 3)
    ctx.globalAlpha = 1
    // Sun
    ctx.fillStyle = light
    ctx.beginPath()
    ctx.arc(w * 0.68, h * 0.2, 30, 0, Math.PI * 2)
    ctx.fill()
    // Wagon-wheel motifs + starbursts
    ctx.strokeStyle = dark
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w
      const y = h * 0.35 + Math.random() * h * 0.6
      const r = 10 + Math.random() * 16
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      }
      ctx.stroke()
    }
    ctx.strokeStyle = pop
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.beginPath()
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI
        ctx.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7)
        ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7)
      }
      ctx.stroke()
    }
  })

// Image texture cropped to fill a surface of the given aspect ratio (like CSS object-fit: cover)
export function coverTexture(url, aspect) {
  const texture = new THREE.TextureLoader().load(url, (t) => {
    const imageAspect = t.image.width / t.image.height
    if (imageAspect > aspect) {
      t.repeat.set(aspect / imageAspect, 1)
      t.offset.set((1 - t.repeat.x) / 2, 0)
    } else {
      t.repeat.set(1, imageAspect / aspect)
      t.offset.set(0, (1 - t.repeat.y) / 2)
    }
  })
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// Label that wraps the can, from a flat label image (full 360° wrap, left edge to right edge)
export function wrapTexture(url) {
  const texture = new THREE.TextureLoader().load(url)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// Stand-in can label until the real Bad Decisions Brewing artwork is added
export const canLabel = () =>
  canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f2a44'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f2b632'
    ctx.fillRect(0, 22, w, 8)
    ctx.fillRect(0, h - 30, w, 8)
    ctx.fillStyle = '#f4ecd8'
    ctx.textAlign = 'center'
    ctx.font = 'bold 44px "Arial Black", sans-serif'
    ctx.fillText('BAD', w * 0.25, 110)
    ctx.fillText('DECISIONS', w * 0.25, 160)
    ctx.font = 'bold 20px "Courier New", monospace'
    ctx.fillText('BREWING CO.', w * 0.25, 196)
    ctx.fillStyle = '#e0482f'
    ctx.beginPath()
    ctx.arc(w * 0.75, h / 2, 54, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4ecd8'
    ctx.font = 'bold 22px "Courier New", monospace'
    ctx.fillText('12 FL OZ', w * 0.75, h / 2 + 8)
  })

// Geometric bedroom rug: warm triangles
export const geoRug = () =>
  canvasTexture(256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#efe4d2'
    ctx.fillRect(0, 0, w, h)
    const colors = ['#c9733f', '#d9a43a', '#6b4428', '#efe4d2', '#b5522f']
    const size = 32
    for (let y = 0; y < h; y += size)
      for (let x = 0; x < w; x += size) {
        ctx.fillStyle = colors[(x / size + y / size * 2) % colors.length]
        ctx.beginPath()
        if (((x + y) / size) % 2) {
          ctx.moveTo(x, y)
          ctx.lineTo(x + size, y)
          ctx.lineTo(x, y + size)
        } else {
          ctx.moveTo(x + size, y)
          ctx.lineTo(x + size, y + size)
          ctx.lineTo(x, y + size)
        }
        ctx.fill()
      }
  })
