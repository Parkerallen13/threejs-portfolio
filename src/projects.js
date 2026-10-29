import data from './data/projects.json'
import { resolveAssets } from './assets.js'

// Project content lives in src/data/projects.json (edited by hand or from the local admin).
// project.js lays each entry out; `sections` render in order, each picking a layout with `type`
// (text, process, palette, identity, gallery, compare, video, live, dropdowns), defaulting to heading + copy.
export const PROJECTS = resolveAssets(data.projects)
// Drafts (hidden with the eye toggle in the admin) stay out of the homepage and next-project links
export const PROJECT_ORDER = data.order.filter((id) => !data.projects[id].draft)

export const projectUrl = (slug) => `${import.meta.env.BASE_URL}projects/${slug}.html`
