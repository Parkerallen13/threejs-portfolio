import data from './data/projects.json'
import { resolveAssets } from './assets.js'

// Project content lives in src/data/projects.json (edited by hand or from the local admin).
// project.js lays each entry out; `sections` render in order, each picking a layout with `type`
// (text, process, palette, identity, gallery, compare, video, live, dropdowns, principles, table, typeTester), defaulting to heading + copy.
export const PROJECTS = resolveAssets(data.projects)
// Drafts (hidden with the eye toggle in the admin) stay out of the homepage, the next-project
// links, and the build. On the dev server they show while editing or with ?drafts, to preview them.
const showDrafts = import.meta.env.DEV && (new URLSearchParams(location.search).has('drafts') || sessionStorage.getItem('portfolio-edit-mode') === '1')
export const PROJECT_ORDER = data.order.filter((id) => showDrafts || !data.projects[id].draft)

export const projectUrl = (slug) => `${import.meta.env.BASE_URL}projects/${slug}.html`
