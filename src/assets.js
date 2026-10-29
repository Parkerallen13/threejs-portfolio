// Content files (src/data/*.json) point at media by path: "assets/ouro/logo.png" for files in
// src/assets, "public/documents/audit.pdf" for files served as-is from public/. This turns those
// paths into the URLs Vite serves, in dev and in the build.
const files = import.meta.glob(
  [
    './assets/**/*.{png,jpg,jpeg,webp,gif,svg,mp4,webm}',
    '!./assets/drawings/originals/**',
    '!./assets/experience/_hidden/**',
  ],
  { eager: true, query: '?url', import: 'default' },
)

export function assetUrl(path) {
  if (path.startsWith('assets/')) return files[`./${path}`] ?? path
  if (path.startsWith('public/')) return `${import.meta.env.BASE_URL}${path.slice('public/'.length)}`
  return path
}

// A copy of `value` with every media path swapped for its URL
export function resolveAssets(value) {
  if (typeof value === 'string') return assetUrl(value)
  if (Array.isArray(value)) return value.map(resolveAssets)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolveAssets(v)]))
  }
  return value
}
