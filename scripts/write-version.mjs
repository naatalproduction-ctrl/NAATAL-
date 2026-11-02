// ============================================
// write-version.mjs — dist/version.json indique ce qui est deploye
// ============================================
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const { version } = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'))
const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim()
const info = { version, commit, builtAt: new Date().toISOString() }

await fs.writeFile(path.join(ROOT, 'dist', 'version.json'), `${JSON.stringify(info, null, 2)}\n`, 'utf8')
console.log(`  ✓ version.json (${version}, ${commit})`)
