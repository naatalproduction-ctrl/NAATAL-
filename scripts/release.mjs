// ============================================
// release.mjs — cree une version : numero, journal, commit et tag git.
// Usage : npm run release -- patch|minor|major [--push]
// Ne touche jamais au serveur : le deploiement reste une etape separee.
// ============================================
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md')
const PACKAGES = [path.join(ROOT, 'package.json'), path.join(ROOT, 'server', 'package.json')]
const UNRELEASED = '## [Non publié]'
const RELEASE_BRANCH = 'main'

const [level, ...options] = process.argv.slice(2)
const shouldPush = options.includes('--push')

const fail = (message) => {
  console.error(`Version annulée : ${message}`)
  process.exit(1)
}

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
const run = (command, ...args) => execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' })
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const nextVersion = (current) => {
  const [major, minor, patch] = current.split('.').map(Number)
  if (level === 'major') return `${major + 1}.0.0`
  if (level === 'minor') return `${major}.${minor + 1}.0`
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`
  return fail('indiquez patch, minor ou major')
}

const splitChangelog = () => {
  const text = fs.readFileSync(CHANGELOG, 'utf8')
  const start = text.indexOf(UNRELEASED)
  if (start === -1) fail(`section "${UNRELEASED}" introuvable dans CHANGELOG.md`)

  const body = text.slice(start + UNRELEASED.length)
  const end = body.search(/\n## \[/)
  return {
    head: text.slice(0, start),
    notes: (end === -1 ? body : body.slice(0, end)).trim(),
    tail: end === -1 ? '' : body.slice(end + 1),
  }
}

const updateChangelog = ({ head, notes, tail }, version) => {
  const date = new Date().toISOString().slice(0, 10)
  const released = `${UNRELEASED}\n\n## [${version}] - ${date}\n\n${notes}\n`
  fs.writeFileSync(CHANGELOG, `${head}${released}${tail ? `\n${tail}` : ''}`, 'utf8')
}

const updatePackages = (version) => {
  for (const file of PACKAGES) {
    const json = readJson(file)
    json.version = version
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  }
}

const main = () => {
  const version = nextVersion(readJson(PACKAGES[0]).version)
  const tag = `v${version}`
  const changelog = splitChangelog()

  if (git('branch', '--show-current') !== RELEASE_BRANCH) fail(`à lancer depuis ${RELEASE_BRANCH}`)
  if (git('status', '--porcelain')) fail('des modifications ne sont pas commitées')
  if (git('tag', '--list', tag)) fail(`le tag ${tag} existe déjà`)
  if (!changelog.notes) fail(`aucune évolution notée dans "${UNRELEASED}"`)

  run('npm', 'run', 'check:secrets')
  run('npm', 'run', 'build')

  updatePackages(version)
  updateChangelog(changelog, version)

  const title = `chore: version ${version}`
  const message = [title, process.env.RELEASE_TRAILER].filter(Boolean).join('\n\n')
  run('git', 'add', 'package.json', 'server/package.json', 'CHANGELOG.md')
  run('git', 'commit', '-m', message)
  run('git', 'tag', '-a', tag, '-m', `Version ${version}\n\n${changelog.notes}`)

  if (shouldPush) {
    // Branche et tag nommes : ne jamais pousser les references de sauvegarde locales
    run('git', 'push', 'origin', RELEASE_BRANCH)
    run('git', 'push', 'origin', tag)
  }

  console.log(`\n${tag} créée${shouldPush ? ' et publiée sur GitHub' : ' en local'}. Rien n'a été envoyé sur le serveur.`)
}

main()
