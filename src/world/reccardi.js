import * as THREE from 'three'

// Parker, painted flat in Chris Reccardi's 60s style but looking like Parker: a wavy
// light-brown bob with a side-swept part, strong straight brows, sleepy grey-green
// eyes with big lashes, full rosy lips, a white puff-sleeve blouse with a lace peter pan
// collar and bow, a gold chain with a green pendant, little gold hoops, and a long
// brown maxi skirt. Drawn on a canvas in a few poses and shown as a cutout that always
// faces the camera.

const INK = '#2a2033'
const P = {
  hair: '#a8774b',
  hairLight: '#c4955f',
  hairShade: '#86593a',
  skin: '#f3c4b0',
  skinShade: '#e2a48f',
  blouse: '#fbf7ef',
  blouseShade: '#e9e1d2',
  skirt: '#6e4b37',
  skirtShade: '#5a3c2b',
  shoe: '#4a3426',
  gold: '#d6a93c',
  jade: '#5fae8b',
  eyes: '#7d9278',
  lips: '#c9707a',
}

function shape(ctx, fill, draw, stroke = true) {
  ctx.beginPath()
  draw()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = INK
    ctx.lineWidth = 4
    ctx.stroke()
  }
}

// Dry-brush specks so the paint isn't perfectly flat
function grain(ctx, w, h) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1 + Math.random() * 2)
  }
  ctx.restore()
}

function drawPose(pose) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 1024
  const ctx = c.getContext('2d')
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  // pose: 0 = standing, 1 = left foot forward, -1 = right foot forward
  const step = pose * 22

  // ---------- Hair, back: a full wavy bob that stops at the shoulders ----------
  shape(ctx, P.hairShade, () => {
    ctx.moveTo(150, 200)
    ctx.bezierCurveTo(118, 260, 128, 330, 116, 372)
    ctx.bezierCurveTo(132, 392, 160, 384, 172, 372)
    ctx.lineTo(344, 372)
    ctx.bezierCurveTo(356, 384, 384, 392, 400, 372)
    ctx.bezierCurveTo(388, 330, 398, 260, 366, 200)
    ctx.closePath()
  })

  // ---------- Feet peeking out under the skirt ----------
  for (const [x, dx] of [[222, -step], [294, step]]) {
    shape(ctx, P.shoe, () => ctx.ellipse(x + dx, 962, 30, 13, 0, 0, Math.PI * 2))
  }

  // ---------- Long brown maxi skirt, A-line, swaying with the step ----------
  shape(ctx, P.skirt, () => {
    ctx.moveTo(214, 486)
    ctx.bezierCurveTo(200, 620, 172 + step * 0.4, 820, 150 + step * 0.6, 950)
    ctx.bezierCurveTo(220, 966, 300, 966, 366 + step * 0.6, 950)
    ctx.bezierCurveTo(344 + step * 0.4, 820, 316, 620, 302, 486)
    ctx.closePath()
  })
  shape(ctx, P.skirtShade, () => {
    ctx.moveTo(286, 500)
    ctx.bezierCurveTo(300, 640, 322, 820, 344 + step * 0.6, 948)
    ctx.lineTo(366 + step * 0.6, 950)
    ctx.bezierCurveTo(344 + step * 0.4, 820, 316, 620, 302, 486)
    ctx.closePath()
  }, false)
  // A couple of soft folds
  ctx.strokeStyle = 'rgba(40, 24, 16, 0.35)'
  ctx.lineWidth = 3
  for (const x of [236, 270]) {
    ctx.beginPath()
    ctx.moveTo(x, 560)
    ctx.bezierCurveTo(x - 6, 700, x - 14 + step * 0.3, 820, x - 20 + step * 0.5, 940)
    ctx.stroke()
  }

  // ---------- White blouse, tucked in, with big puff sleeves ----------
  shape(ctx, P.blouse, () => {
    ctx.moveTo(206, 364)
    ctx.bezierCurveTo(196, 410, 204, 456, 212, 492)
    ctx.lineTo(304, 492)
    ctx.bezierCurveTo(312, 456, 320, 410, 310, 364)
    ctx.closePath()
  })
  shape(ctx, P.blouseShade, () => {
    ctx.moveTo(292, 380)
    ctx.bezierCurveTo(304, 420, 304, 460, 298, 490)
    ctx.lineTo(304, 492)
    ctx.bezierCurveTo(312, 456, 320, 410, 310, 364)
    ctx.closePath()
  }, false)

  // ---------- Arms: one hand on the hip, one relaxed, coming out of puff sleeves ----------
  shape(ctx, P.skin, () => {
    ctx.moveTo(196, 404)
    ctx.bezierCurveTo(174, 430, 164, 456, 172, 478)
    ctx.bezierCurveTo(182, 494, 200, 496, 214, 494)
    ctx.lineTo(214, 480)
    ctx.bezierCurveTo(200, 478, 188, 470, 188, 458)
    ctx.bezierCurveTo(188, 440, 200, 424, 210, 414)
    ctx.closePath()
  })
  shape(ctx, P.skin, () => {
    ctx.moveTo(318, 404)
    ctx.bezierCurveTo(332, 452, 336, 510, 332, 560)
    ctx.bezierCurveTo(330, 574, 316, 574, 316, 560)
    ctx.bezierCurveTo(318, 512, 312, 456, 304, 414)
    ctx.closePath()
  })
  for (const [x, dir] of [[200, -1], [316, 1]]) {
    shape(ctx, P.blouse, () => ctx.ellipse(x, 392, 34, 30, dir * 0.4, 0, Math.PI * 2))
    // lace band at the cuff
    ctx.strokeStyle = P.blouseShade
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(x + dir * 6, 414, 22, 6, dir * 0.4, 0, Math.PI)
    ctx.stroke()
  }

  // ---------- Neck, peter pan collar with lace edge, bow, gold chain + jade ----------
  shape(ctx, P.skin, () => ctx.rect(244, 300, 28, 72))
  for (const dir of [-1, 1]) {
    shape(ctx, P.blouse, () => {
      ctx.moveTo(258, 368)
      ctx.bezierCurveTo(258 + dir * 20, 360, 258 + dir * 58, 362, 258 + dir * 58, 380)
      ctx.bezierCurveTo(258 + dir * 56, 404, 258 + dir * 22, 410, 258, 394)
      ctx.closePath()
    })
    ctx.fillStyle = P.blouseShade
    for (let k = 0; k < 6; k++) {
      ctx.beginPath()
      ctx.arc(258 + dir * (12 + k * 8), 400 - Math.sin((k / 5) * Math.PI) * 6, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  shape(ctx, P.blouse, () => {
    ctx.ellipse(250, 402, 9, 6, -0.3, 0, Math.PI * 2)
    ctx.moveTo(275, 402)
    ctx.ellipse(266, 402, 9, 6, 0.3, 0, Math.PI * 2)
  })
  ctx.strokeStyle = P.gold
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(240, 334)
  ctx.quadraticCurveTo(258, 360, 276, 334)
  ctx.stroke()
  shape(ctx, P.jade, () => ctx.ellipse(258, 352, 6, 8, 0, 0, Math.PI * 2))

  // ---------- Head ----------
  shape(ctx, P.skin, () => ctx.ellipse(258, 232, 90, 106, 0, 0, Math.PI * 2))
  shape(ctx, P.skinShade, () => ctx.ellipse(258, 304, 56, 16, 0, 0, Math.PI), false)

  // Little gold hoops
  ctx.strokeStyle = P.gold
  ctx.lineWidth = 4
  for (const x of [172, 344]) {
    ctx.beginPath()
    ctx.arc(x, 290, 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ---------- Face: sleepy grey-green eyes, big lashes, straight brows, full lips ----------
  for (const [x, w] of [[214, 32], [302, 32]]) {
    shape(ctx, '#ffffff', () => ctx.ellipse(x, 236, w, 22, 0, 0, Math.PI * 2))
    ctx.fillStyle = P.eyes
    ctx.beginPath()
    ctx.ellipse(x + 6, 240, 14, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.ellipse(x + 7, 241, 7, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + 2, 234, 3, 0, Math.PI * 2)
    ctx.fill()
    // Heavy lid over the top of the eye
    shape(ctx, P.skinShade, () => {
      ctx.moveTo(x - w - 2, 234)
      ctx.bezierCurveTo(x - w + 6, 206, x + w - 6, 206, x + w + 2, 234)
      ctx.bezierCurveTo(x + w - 12, 226, x - w + 12, 226, x - w - 2, 234)
      ctx.closePath()
    }, false)
    ctx.strokeStyle = INK
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(x - w - 2, 234)
    ctx.bezierCurveTo(x - w + 10, 222, x + w - 10, 222, x + w + 2, 234)
    ctx.stroke()
    ctx.lineWidth = 3.5
    for (let k = 0; k < 5; k++) {
      const lx = x - w + 8 + k * ((2 * w - 16) / 4)
      ctx.beginPath()
      ctx.moveTo(lx, 226)
      ctx.lineTo(lx - 5 + k * 2.5, 208)
      ctx.stroke()
    }
    // Strong, fairly straight brows
    ctx.strokeStyle = P.hairShade
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(x - 28, 194)
    ctx.quadraticCurveTo(x, 186, x + 28, 190)
    ctx.stroke()
  }
  ctx.strokeStyle = P.skinShade
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(260, 246)
  ctx.lineTo(262, 274)
  ctx.quadraticCurveTo(256, 282, 248, 278)
  ctx.stroke()
  // Full rosy lips
  shape(ctx, P.lips, () => {
    ctx.moveTo(236, 302)
    ctx.quadraticCurveTo(250, 290, 258, 296)
    ctx.quadraticCurveTo(266, 290, 280, 302)
    ctx.quadraticCurveTo(258, 320, 236, 302)
    ctx.closePath()
  }, false)
  ctx.fillStyle = 'rgba(232, 120, 120, 0.3)'
  for (const x of [196, 320]) {
    ctx.beginPath()
    ctx.ellipse(x, 276, 22, 12, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // ---------- Hair, front: side part, a swoop across the forehead, waves to the shoulders ----------
  shape(ctx, P.hair, () => {
    ctx.moveTo(150, 280)
    ctx.bezierCurveTo(128, 150, 210, 100, 282, 112)
    ctx.bezierCurveTo(350, 120, 384, 180, 368, 280)
    ctx.bezierCurveTo(358, 220, 330, 176, 296, 168)
    // the swoop: sweeps from the part down across the forehead
    ctx.bezierCurveTo(250, 176, 214, 196, 196, 214)
    ctx.bezierCurveTo(180, 230, 166, 256, 150, 280)
    ctx.closePath()
  })
  // Wavy side sections falling to the shoulders, flipping out at the ends
  const side = (x, dir) => {
    shape(ctx, P.hair, () => {
      ctx.moveTo(x, 200)
      ctx.bezierCurveTo(x - 26 * dir, 240, x - 6 * dir, 280, x - 24 * dir, 320)
      ctx.bezierCurveTo(x - 36 * dir, 350, x - 30 * dir, 380, x - 6 * dir, 376)
      ctx.bezierCurveTo(x + 6 * dir, 372, x + 2 * dir, 356, x + 12 * dir, 350)
      ctx.bezierCurveTo(x + 20 * dir, 320, x + 10 * dir, 270, x + 22 * dir, 230)
      ctx.closePath()
    })
    ctx.strokeStyle = P.hairLight
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x - 4 * dir, 220)
    ctx.bezierCurveTo(x - 20 * dir, 260, x - 4 * dir, 300, x - 18 * dir, 340)
    ctx.stroke()
  }
  side(166, 1)
  side(352, -1)
  // Highlight along the swoop
  ctx.strokeStyle = P.hairLight
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(300, 132)
  ctx.bezierCurveTo(250, 140, 210, 170, 190, 206)
  ctx.stroke()

  grain(ctx, c.width, c.height)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}


export function createReccardiCharacter() {
  const root = new THREE.Group()
  const poses = [drawPose(0), drawPose(1), drawPose(0), drawPose(-1)]
  const material = new THREE.MeshBasicMaterial({ map: poses[0], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.1), material)
  card.position.y = 1.05
  root.add(card)
  let phase = 0
  let elapsed = 0
  return {
    root,
    style: 'reccardi',
    billboard: true,
    // Face left or right on screen, depending on which way Parker is walking
    setFlip(flip) {
      card.scale.x = flip ? -1 : 1
    },
    update(dt, amount) {
      elapsed += dt
      phase += dt * 6 * amount
      // Walk cycle on twos; a little sway when standing
      material.map = amount > 0.2 ? poses[Math.floor(phase) % poses.length] : poses[0]
      card.position.y = 1.05 + (amount > 0.2 ? Math.abs(Math.sin(phase * Math.PI)) * 0.04 : 0)
      card.rotation.z = amount > 0.2 ? 0 : Math.sin(elapsed * 1.4) * 0.02
    },
  }
}
