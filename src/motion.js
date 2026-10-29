import './motion.css'

// Gentle motion: cut-out drawings that drift behind the homepage as you scroll, components that
// slide in as they come into view, and a soft light-red glow that follows the cursor. All of it
// stays still for reduced-motion visitors.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

// The drawings layer, shared with the edit mode's "Arrange drawings" screen (src/edit.js)
export const backdrop = { layer: null, pieces: [], drawings: [], spots: [], arranging: false, place: () => {} }

// `spots` come from site.json `backdrop`: { drawing, top (% down the page), left (vw), size, speed, turn }.
// `speed` is how fast it drifts against the scroll (negative drifts up), `turn` its tilt in degrees.
export function initBackdrop(layer, drawings, spots = []) {
  if (!layer || !drawings.length) return
  Object.assign(backdrop, { layer, drawings, spots })

  const urlFor = (file) => (drawings.find((d) => d.file === file) ?? drawings[0]).src
  backdrop.render = () => {
    layer.replaceChildren()
    backdrop.pieces = backdrop.spots.map((spot, i) => {
      const piece = document.createElement('div')
      piece.className = 'backdrop__piece'
      piece.dataset.index = i
      const img = document.createElement('img')
      img.src = urlFor(spot.drawing)
      img.alt = ''
      img.decoding = 'async'
      img.draggable = false
      piece.append(img)
      layer.append(piece)
      return piece
    })
    backdrop.place()
  }

  let frame = 0
  backdrop.place = () => {
    frame = 0
    const y = reduceMotion.matches || backdrop.arranging ? 0 : scrollY
    backdrop.pieces.forEach((piece, i) => {
      const spot = backdrop.spots[i]
      piece.style.top = `${spot.top}%`
      piece.style.left = `${spot.left}vw`
      piece.style.setProperty('--size', spot.size)
      piece.style.transform = `translate3d(0, ${(y * spot.speed).toFixed(1)}px, 0) rotate(${(spot.turn + (backdrop.arranging ? 0 : y * 0.004 * spot.turn)).toFixed(2)}deg)`
    })
  }
  addEventListener('scroll', () => { frame ||= requestAnimationFrame(backdrop.place) }, { passive: true })
  backdrop.render()
}

// Anything that has reached the lower part of the screen shows, including components a visitor
// jumped past with a link or the End key, so nothing is left hidden.
export function initReveal(root = document) {
  if (reduceMotion.matches) return
  let waiting = [...root.querySelectorAll('.reveal')]
  document.documentElement.classList.add('has-reveal')

  let frame = 0
  const check = () => {
    frame = 0
    const line = innerHeight * 0.9
    waiting = waiting.filter((item) => {
      if (item.getBoundingClientRect().top > line) return true
      item.classList.add('is-visible')
      return false
    })
    if (!waiting.length) removeEventListener('scroll', onScroll)
  }
  const onScroll = () => { frame ||= requestAnimationFrame(check) }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
  check()
}

// A soft light-red glow that sits right under the cursor (mouse and trackpad only). A chain of
// blurred blobs follows it like slime: the head stretches along the direction you move, the tail
// eases after it, and everything settles back into one calm glow when the pointer rests.
export function initAura() {
  if (reduceMotion.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const aura = document.createElement('div')
  aura.className = 'aura'
  aura.setAttribute('aria-hidden', 'true')
  document.body.prepend(aura)

  const target = { x: innerWidth / 2, y: innerHeight / 3 }
  const SIZES = [230, 205, 180, 155, 130, 110]
  const blobs = SIZES.map((size, i) => {
    const el = document.createElement('span')
    el.className = 'aura__blob'
    el.style.setProperty('--blob-size', `${size}px`)
    el.style.setProperty('--blob-delay', `${-i * 1.7}s`)
    el.style.opacity = String(1 - i * 0.12)
    aura.append(el)
    return { el, x: target.x, y: target.y }
  })

  let frame = 0
  const tick = () => {
    const [head] = blobs
    const lastX = head.x
    const lastY = head.y
    head.x += (target.x - head.x) * 0.3
    head.y += (target.y - head.y) * 0.3
    // Squash and stretch along the direction of travel, capped so it stays gentle
    const dx = head.x - lastX
    const dy = head.y - lastY
    const stretch = 1 + Math.min(Math.hypot(dx, dy) / 70, 0.45)
    const angle = Math.atan2(dy, dx)

    let moving = Math.abs(target.x - head.x) + Math.abs(target.y - head.y) > 0.3
    blobs.forEach((blob, i) => {
      if (i > 0) {
        const lead = blobs[i - 1]
        blob.x += (lead.x - blob.x) * 0.34
        blob.y += (lead.y - blob.y) * 0.34
        if (Math.abs(lead.x - blob.x) + Math.abs(lead.y - blob.y) > 0.3) moving = true
      }
      const s = 1 + (stretch - 1) * (1 - i / blobs.length)
      blob.el.style.transform = `translate3d(${blob.x.toFixed(1)}px, ${blob.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(3)}rad) scale(${s.toFixed(3)}, ${(1 / s).toFixed(3)})`
    })
    frame = moving ? requestAnimationFrame(tick) : 0
  }
  addEventListener('pointermove', (event) => {
    target.x = event.clientX
    target.y = event.clientY
    aura.classList.add('is-on')
    frame ||= requestAnimationFrame(tick)
  }, { passive: true })
  document.addEventListener('pointerleave', () => aura.classList.remove('is-on'))
  tick()
}
