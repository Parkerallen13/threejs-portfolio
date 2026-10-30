// Content files (src/data/*.json) point at media in src/assets by path ("assets/ouro/logo.png").
// This virtual module imports exactly the files they mention, so the build ships only media the
// site uses, and the dev server sees new uploads as soon as a content file changes.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ID = 'virtual:content-assets'
const RESOLVED = `\0${ID}`
const MEDIA = /^assets\/[\w./-]+\.(png|jpe?g|webp|gif|svg|mp4|webm)$/i

export function contentAssets() {
  let root = process.cwd()
  const dataDir = () => resolve(root, 'src/data')

  return {
    name: 'content-assets',
    configResolved(config) { root = config.root },
    resolveId(id) { return id === ID ? RESOLVED : undefined },

    load(id) {
      if (id !== RESOLVED) return
      const paths = new Set()
      for (const file of readdirSync(dataDir()).filter((f) => f.endsWith('.json'))) {
        JSON.parse(readFileSync(resolve(dataDir(), file), 'utf8'), (key, value) => {
          if (typeof value === 'string' && MEDIA.test(value)) paths.add(value)
          return value
        })
      }
      // A missing file is skipped rather than breaking the whole site
      const list = [...paths].filter((p) => existsSync(resolve(root, 'src', p))).sort()
      return [
        ...list.map((p, i) => `import a${i} from '/src/${p}?url'`),
        `export default {${list.map((p, i) => `${JSON.stringify(p)}: a${i}`).join(', ')}}`,
      ].join('\n')
    },

    // Rebuild the list whenever a content file changes
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(dataDir()) || !file.endsWith('.json')) return
      const mod = server.moduleGraph.getModuleById(RESOLVED)
      if (mod) server.moduleGraph.invalidateModule(mod)
    },
  }
}
