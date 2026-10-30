import './edit.css'
import { backdrop } from './motion.js'

// Local edit mode (dev server only; main.js and project.js load it behind import.meta.env.DEV).
// Click any outlined text to change it, click a dashed photo to replace or describe it, and × a marketing post
// to hide it. Each change saves to src/data/*.json through the admin API in admin/plugin.js.

const KEY = 'portfolio-edit-mode'
const isOn = () => sessionStorage.getItem(KEY) === '1'

async function api(path, body) {
  const response = await fetch(`/__admin/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json().catch(() => ({}))
  if (response.status === 401) {
    location.href = `/admin/?next=${encodeURIComponent(location.pathname + location.search)}`
    throw new Error('Please log in')
  }
  if (!response.ok) throw new Error(result.error ?? 'Something went wrong')
  return result
}

const target = (attr) => {
  const [file, path] = attr.split(':')
  return { file, path }
}

let toastTimer
function toast(message, tone = 'ok') {
  let el = document.querySelector('.edit-toast')
  if (!el) {
    el = document.createElement('p')
    el.className = 'edit-toast'
    el.setAttribute('role', 'status')
    document.body.append(el)
  }
  el.textContent = message
  el.dataset.tone = tone
  el.classList.add('is-shown')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2600)
}

// What contenteditable leaves behind: stray trailing breaks and non-breaking spaces
const tidy = (html) => html.replace(/(<br\s*\/?>\s*)+$/i, '').replace(/&nbsp;/g, ' ').trim()

function editText(el) {
  el.contentEditable = 'true'
  el.spellcheck = true
  let before = ''
  el.addEventListener('focus', () => { before = el.innerHTML })
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { el.innerHTML = before; el.blur() }
  })
  el.addEventListener('blur', async () => {
    const value = tidy(el.innerHTML)
    if (value === tidy(before)) return
    try {
      await api('save', { ...target(el.dataset.edit), value, quiet: true })
      toast('Saved')
    } catch (error) {
      toast(error.message, 'error')
    }
  })
}

function pickImage() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.addEventListener('change', () => resolve(input.files[0]))
    input.click()
  })
}

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

async function replaceImage(img) {
  const file = await pickImage()
  if (!file) return
  try {
    toast('Uploading…')
    const uploaded = await api('upload', { folder: 'uploads', name: file.name, data: await readAsDataUrl(file) })
    await api('save', { ...target(img.dataset.editImg), value: uploaded.path, quiet: true })
    img.src = uploaded.url
    img.removeAttribute('srcset')
    toast('Photo replaced')
  } catch (error) {
    toast(error.message, 'error')
  }
}

// Clicking an editable photo offers to replace it or describe it (its alt text, read aloud by
// screen readers and shown if the image fails to load)
function photoMenu(img, event) {
  document.querySelector('.photo-menu')?.remove()
  const menu = document.createElement('div')
  menu.className = 'photo-menu'
  menu.innerHTML = `
    <button type="button" data-photo="replace">Replace photo</button>
    <button type="button" data-photo="alt">Edit description</button>`
  menu.style.left = `${Math.min(event.clientX, innerWidth - 200)}px`
  menu.style.top = `${event.clientY + 8}px`
  document.body.append(menu)
  const close = () => { menu.remove(); removeEventListener('scroll', close) }
  addEventListener('scroll', close, { once: true })
  menu.addEventListener('click', async (click) => {
    const choice = click.target.closest('[data-photo]')?.dataset.photo
    close()
    if (choice === 'replace') replaceImage(img)
    if (choice === 'alt') editAlt(img)
  })
  setTimeout(() => document.addEventListener('click', (other) => { if (!menu.contains(other.target)) close() }, { once: true, capture: true }))
}

async function editAlt(img) {
  const answer = prompt('Describe this image for people who can’t see it', img.alt)
  if (answer === null || answer.trim() === img.alt) return
  const { file, path } = target(img.dataset.editImg)
  try {
    await api('save', { file, path: path.replace(/\.src$/, '.alt'), value: answer.trim(), quiet: true, label: 'Edit an image description' })
    img.alt = answer.trim()
    toast('Description saved')
  } catch (error) {
    toast(error.message, 'error')
  }
}

async function editList(list) {
  const current = [...list.querySelectorAll('li')].map((li) => li.textContent.trim())
  const answer = prompt('Edit the list, separated by commas', current.join(', '))
  if (answer === null) return
  const items = answer.split(',').map((item) => item.trim()).filter(Boolean)
  try {
    await api('save', { ...target(list.dataset.editList), value: items, quiet: true })
    list.innerHTML = items.map((item) => `<li>${item.replace(/</g, '&lt;')}</li>`).join('')
    toast('Saved')
  } catch (error) {
    toast(error.message, 'error')
  }
}

function addPostControls(post) {
  const [folder, file] = post.dataset.post.split('/')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'edit-post-hide'
  button.setAttribute('aria-label', `Hide ${file}`)
  button.textContent = '×'
  button.addEventListener('click', async (event) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      await api('posts/hide', { folder, file })
      post.remove()
      toast('Hidden. Bring it back from the admin page.')
    } catch (error) {
      toast(error.message, 'error')
    }
  })
  post.append(button)
}


// ---------- Arrange drawings ----------
// The homepage's drifting drawings come to the front: drag one to set where it starts, and use
// the panel to resize, tilt, swap, add, or remove it. Positions save to site.json `backdrop`.

const ARRANGE_KEY = 'portfolio-arranging'
let selected = 0
let saveTimer

function saveBackdrop() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await api('save', { file: 'site', path: 'backdrop', value: backdrop.spots, quiet: true })
      toast('Drawings saved')
    } catch (error) {
      toast(error.message, 'error')
    }
  }, 350)
}

function renderPanel(panel) {
  const spot = backdrop.spots[selected]
  backdrop.pieces.forEach((piece, i) => piece.classList.toggle('is-selected', i === selected))
  panel.innerHTML = `
    <h2>Arrange drawings</h2>
    <p>Drag a drawing to set where it starts. It drifts from there as visitors scroll.</p>
    ${spot ? `
      <label>Drawing
        <select data-arrange="drawing">
          ${backdrop.drawings.map(({ file, title }) => `<option value="${file}"${file === spot.drawing ? ' selected' : ''}>${title}</option>`).join('')}
        </select>
      </label>
      <label>Size <input type="range" min="0.4" max="2.6" step="0.05" value="${spot.size}" data-arrange="size" /></label>
      <label>Tilt <input type="range" min="-45" max="45" step="1" value="${spot.turn}" data-arrange="turn" /></label>
      <label>Drift while scrolling <input type="range" min="-0.4" max="0.4" step="0.02" value="${spot.speed}" data-arrange="speed" /></label>
      <button type="button" data-arrange-remove>Remove this drawing</button>` : '<p><strong>No drawings yet.</strong></p>'}
    <div class="arrange-panel__row">
      <button type="button" data-arrange-add>+ Add a drawing</button>
      <label class="arrange-panel__upload">Upload a cut-out (PNG or WebP) <input type="file" accept="image/png,image/webp" data-arrange-upload /></label>
    </div>
    <button type="button" class="arrange-panel__done" data-arrange-done>Done arranging</button>`
}

function startArranging() {
  if (!backdrop.layer) return
  sessionStorage.setItem(ARRANGE_KEY, '1')
  backdrop.arranging = true
  document.documentElement.classList.add('is-arranging')
  backdrop.place()

  const panel = document.createElement('aside')
  panel.className = 'arrange-panel'
  document.body.append(panel)
  renderPanel(panel)

  const layer = backdrop.layer
  let drag = null
  layer.addEventListener('pointerdown', (event) => {
    const piece = event.target.closest('.backdrop__piece')
    if (!piece) return
    event.preventDefault()
    selected = Number(piece.dataset.index)
    renderPanel(panel)
    const spot = backdrop.spots[selected]
    drag = { x: event.clientX, y: event.clientY, top: spot.top, left: spot.left }
    piece.setPointerCapture(event.pointerId)
  })
  layer.addEventListener('pointermove', (event) => {
    if (!drag) return
    const spot = backdrop.spots[selected]
    spot.top = +(drag.top + ((event.clientY - drag.y) / layer.offsetHeight) * 100).toFixed(2)
    spot.left = +(drag.left + ((event.clientX - drag.x) / innerWidth) * 100).toFixed(2)
    backdrop.place()
  })
  layer.addEventListener('pointerup', () => {
    if (!drag) return
    drag = null
    saveBackdrop()
  })

  panel.addEventListener('input', (event) => {
    const field = event.target.dataset.arrange
    if (!field) return
    const spot = backdrop.spots[selected]
    if (field === 'drawing') {
      spot.drawing = event.target.value
      backdrop.render()
      renderPanel(panel)
    } else {
      spot[field] = Number(event.target.value)
      backdrop.place()
    }
    saveBackdrop()
  })

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-arrange-done]')) {
      sessionStorage.removeItem(ARRANGE_KEY)
      location.reload()
    }
    if (event.target.closest('[data-arrange-remove]')) {
      backdrop.spots.splice(selected, 1)
      selected = Math.max(0, selected - 1)
      backdrop.render()
      renderPanel(panel)
      saveBackdrop()
    }
    if (event.target.closest('[data-arrange-add]')) {
      // New drawings start in the middle of whatever part of the page is on screen
      const top = ((scrollY + innerHeight / 3) / backdrop.layer.offsetHeight) * 100
      backdrop.spots.push({ drawing: backdrop.drawings[backdrop.spots.length % backdrop.drawings.length].file, top: +top.toFixed(2), left: 38, size: 1, speed: -0.1, turn: 0 })
      selected = backdrop.spots.length - 1
      backdrop.render()
      renderPanel(panel)
      saveBackdrop()
    }
  })

  panel.addEventListener('change', async (event) => {
    if (!event.target.matches('[data-arrange-upload]')) return
    const file = event.target.files[0]
    if (!file) return
    try {
      toast('Uploading…')
      const uploaded = await api('upload', { folder: 'drawings/cutouts', name: file.name, data: await readAsDataUrl(file) })
      const top = ((scrollY + innerHeight / 3) / backdrop.layer.offsetHeight) * 100
      backdrop.spots.push({ drawing: uploaded.path.split('/').pop(), top: +top.toFixed(2), left: 38, size: 1, speed: -0.1, turn: 0 })
      await api('save', { file: 'site', path: 'backdrop', value: backdrop.spots })
      toast('Drawing added')
    } catch (error) {
      toast(error.message, 'error')
    }
  })
}

function start() {
  document.documentElement.classList.add('is-editing')
  document.querySelectorAll('[data-edit]').forEach(editText)
  document.querySelectorAll('details').forEach((details) => { details.open = true })
  document.querySelectorAll('[data-post]').forEach(addPostControls)

  document.addEventListener('click', (event) => {
    const img = event.target.closest('[data-edit-img]')
    const list = event.target.closest('[data-edit-list]')
    const link = event.target.closest('a, summary')
    if (img) { event.preventDefault(); photoMenu(img, event); return }
    if (list) { event.preventDefault(); editList(list); return }
    // Links stay put while editing so you can click into their text; ⌘/Ctrl-click still follows them
    if (link && !link.closest('.edit-bar') && !(event.metaKey || event.ctrlKey)) event.preventDefault()
  }, true)
}

export async function initEditMode() {
  // Nothing shows on the site until you've logged in on the admin page (/admin/)
  const { loggedIn } = await api('session').catch(() => ({ loggedIn: false }))
  if (!loggedIn) {
    sessionStorage.removeItem(KEY)
    return
  }
  if (new URLSearchParams(location.search).has('edit')) sessionStorage.setItem(KEY, '1')

  const bar = document.createElement('div')
  bar.className = 'edit-bar'
  document.body.append(bar)

  const render = () => {
    bar.innerHTML = isOn()
      ? `<span><strong>Editing</strong> · click text or photos · saves automatically · ⌘-click follows links</span>
         ${backdrop.layer ? '<button type="button" data-arrange-on>Arrange drawings</button>' : ''}
         <button type="button" data-undo>↶ Undo</button>
         <a href="/admin/">Admin</a>
         <button type="button" data-edit-off>Done</button>`
      : `<button type="button" data-edit-on>✎ Edit page</button> <a href="/admin/">Admin</a>`
  }
  render()

  bar.addEventListener('click', async (event) => {
    if (event.target.closest('[data-edit-on]')) {
      sessionStorage.setItem(KEY, '1')
      location.reload()
    }
    if (event.target.closest('[data-undo]')) {
      try {
        const { undone } = await api('undo', {})
        toast(`Undid: ${undone}`)
        setTimeout(() => location.reload(), 500)
      } catch (error) {
        toast(error.message, 'error')
      }
      return
    }
    if (event.target.closest('[data-arrange-on]')) {
      startArranging()
      return
    }
    if (event.target.closest('[data-edit-off]')) {
      sessionStorage.removeItem(KEY)
      location.href = location.pathname
    }
  })

  if (isOn()) {
    start()
    if (sessionStorage.getItem(ARRANGE_KEY) === '1') startArranging()
  }
}
