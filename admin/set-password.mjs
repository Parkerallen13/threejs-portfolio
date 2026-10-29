// Sets the local admin login. Stores the username and a salted scrypt hash (never the password)
// in .env.local, which git ignores, so the login never reaches GitHub or the deployed site.
// Usage: node admin/set-password.mjs <username> <password>
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hashPassword } from './plugin.js'

const [user, password] = process.argv.slice(2)
if (!user || !password) {
  console.error('Usage: node admin/set-password.mjs <username> <password>')
  process.exit(1)
}

const envFile = fileURLToPath(new URL('../.env.local', import.meta.url))
const kept = existsSync(envFile)
  ? readFileSync(envFile, 'utf8').split('\n').filter((line) => line && !/^ADMIN_(USER|PASSWORD_HASH)=/.test(line))
  : []
writeFileSync(envFile, [...kept, `ADMIN_USER=${user}`, `ADMIN_PASSWORD_HASH=${hashPassword(password)}`, ''].join('\n'))
console.log(`Admin login saved for "${user}". Restart \`npm run dev\` if it is running.`)
