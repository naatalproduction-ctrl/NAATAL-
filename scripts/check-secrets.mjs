// ============================================
// check-secrets.mjs — bloque les secrets avant qu'ils n'arrivent sur GitHub.
//   --tree           tous les fichiers suivis
//   --staged         fichiers indexes (pre-commit)
//   --range <args>   lignes ajoutees dans une plage git (pre-push)
// ============================================
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const RULES = [
  ['mot de passe SSH', /sshpass -p\s+'?(?!REDACTED)[^\s']+/],
  ['accès SSH au serveur', /[\w.-]+@\d{1,3}(?:\.\d{1,3}){3}\b/],
  ['hash de mot de passe', /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/],
  ['clé privée', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['jeton d\'API', /\b(?:ghp_[A-Za-z0-9]{20,}|xkeysib-[a-f0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,})/],
  ['secret par défaut dans le code', /(?:KEY|SECRET|PASSWORD|TOKEN)\w*\s*\|\|\s*['"](?!REDACTED)[^'"]+['"]/],
  ['mot de passe dans un commentaire', /^\s*(?:--|#|\/\/).*mot de passe\s*:\s*(?!REDACTED)\S{4,}/i],
]

const FORBIDDEN_FILES = /(?:^|\/)(?:\.env(?:\.local|\.production)?|id_rsa|id_ed25519|[^/]+\.pem)$/
const SKIPPED_FILES = /(?:^|\/)package-lock\.json$/

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 })
const lines = (text) => text.split('\n').filter(Boolean)

const problems = new Set()

const scanLine = (file, line) => {
  for (const [label, rule] of RULES) {
    if (rule.test(line)) problems.add(`${file} : ${label}`)
  }
}

const scanFile = (file, read) => {
  if (FORBIDDEN_FILES.test(file)) problems.add(`${file} : fichier interdit`)
  if (SKIPPED_FILES.test(file)) return
  const text = read(file)
  if (!text.includes('\0')) text.split('\n').forEach(line => scanLine(file, line))
}

const scanTree = () => {
  lines(git('ls-files'))
    .filter(file => fs.existsSync(path.join(ROOT, file)))
    .forEach(file => scanFile(file, name => fs.readFileSync(path.join(ROOT, name), 'utf8')))
}

const scanStaged = () => {
  lines(git('diff', '--cached', '--name-only', '--diff-filter=ACMR'))
    .forEach(file => scanFile(file, name => git('show', `:${name}`)))
}

const scanRange = (range) => {
  let file = ''
  for (const line of git('log', '-p', '--format=', '--no-color', '--no-ext-diff', ...range).split('\n')) {
    if (line.startsWith('+++ b/')) {
      file = line.slice(6)
      if (FORBIDDEN_FILES.test(file)) problems.add(`${file} : fichier interdit`)
    } else if (line.startsWith('+') && !SKIPPED_FILES.test(file)) {
      scanLine(file, line.slice(1))
    }
  }
}

const [mode, ...rest] = process.argv.slice(2)

if (mode === '--tree') scanTree()
else if (mode === '--staged') scanStaged()
else if (mode === '--range') scanRange(rest)
else {
  console.error('Usage : check-secrets.mjs --tree | --staged | --range <plage git>')
  process.exit(2)
}

if (problems.size) {
  console.error(`Secrets détectés, opération bloquée (${problems.size}) :`)
  problems.forEach(problem => console.error(`  - ${problem}`))
  process.exit(1)
}
console.log('  ✓ aucun secret détecté')
