// ============================================
// check-seo.mjs — controle du SEO genere dans dist/.
// Fait echouer le build si une page ne respecte pas les regles.
// ============================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTE_META, SITE_URL } from '../src/data/site.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '..', 'dist')

const SCHEMA_TYPES = new Set([
  'ProfessionalService', 'WebSite', 'WebPage', 'BreadcrumbList', 'FAQPage', 'VideoObject', 'Movie', 'Service',
])

const errors = []
const report = (file, message) => errors.push(`${file} : ${message}`)

const decode = (text) => text
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  }))
  return files.flat()
}

const firstMatch = (html, pattern) => decode(html.match(pattern)?.[1] ?? '')

const checkPage = (name, html, expectedH1 = 1) => {
  const title = firstMatch(html, /<title>([^<]*)<\/title>/)
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/)
  const canonical = firstMatch(html, /<link rel="canonical" href="([^"]*)"/)
  const h1Count = (html.match(/<h1[\s>]/g) || []).length

  if (!title || title.length > 60) report(name, `titre de ${title.length} caractères (60 maximum)`)
  if (description.length < 70 || description.length > 160) report(name, `description de ${description.length} caractères (70 à 160)`)
  if (!canonical.startsWith(`${SITE_URL}/`) && canonical !== SITE_URL) report(name, 'canonical absente ou invalide')
  if (h1Count !== expectedH1) report(name, `${h1Count} balises h1 (${expectedH1} attendue)`)

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  if (blocks.length === 0) report(name, 'données structurées absentes')

  for (const block of blocks) {
    try {
      for (const node of JSON.parse(block[1])['@graph']) {
        if (!SCHEMA_TYPES.has(node['@type'])) report(name, `type schema.org inconnu : ${node['@type']}`)
      }
    } catch (err) {
      report(name, `JSON-LD invalide (${err.message})`)
    }
  }
}

const exists = async (target) => fs.access(target).then(() => true, () => false)

const checkInternalLinks = async (name, text, knownPaths) => {
  const pattern = new RegExp(`${SITE_URL.replace(/\./g, '\\.')}(/[^\\s"'<>)]*)`, 'g')
  for (const [, raw] of text.matchAll(pattern)) {
    const target = raw.split('#')[0] || '/'
    if (knownPaths.has(target.replace(/\/$/, '') || '/')) continue
    if (!(await exists(path.join(DIST, target)))) report(name, `lien interne cassé : ${raw}`)
  }
}

const main = async () => {
  const files = await walk(DIST)
  const seoPages = files.filter(file => file.includes(`${path.sep}seo${path.sep}`) && file.endsWith('.html'))
  const textFiles = files.filter(file => /\.(html|md|txt|xml)$/.test(file) && !file.includes(`${path.sep}videos${path.sep}`))
  const knownPaths = new Set(['/', ...seoPages.map(file => (
    `/${path.relative(path.join(DIST, 'seo'), file).replace(/\.html$/, '')}`.replace(/^\/index$/, '/')
  ))])

  for (const file of seoPages) {
    checkPage(path.relative(DIST, file), await fs.readFile(file, 'utf8'))
  }

  const shell = await fs.readFile(path.join(DIST, 'index.html'), 'utf8')
  checkPage('index.html', shell.replace(/<noscript>[\s\S]*?<\/noscript>/, '<h1></h1>'))
  if (firstMatch(shell, /<title>([^<]*)<\/title>/) !== ROUTE_META['/'].title) {
    report('index.html', 'titre différent de ROUTE_META')
  }
  if (!/<noscript>[\s\S]*<h2/.test(shell)) report('index.html', 'contenu noscript absent')

  const offresPublished = await exists(path.join(DIST, 'seo', 'offres.html'))

  for (const file of textFiles) {
    const name = path.relative(DIST, file)
    const text = await fs.readFile(file, 'utf8')
    if (text.includes('naatalproduction@gmail')) report(name, 'ancien email')
    if (!offresPublished && !name.startsWith('assets') && /\bFCFA\b/.test(text)) report(name, 'prix publié alors que les offres sont masquées')
    if (/\.(md|txt|xml)$/.test(file) || name.startsWith('seo')) await checkInternalLinks(name, text, knownPaths)
  }

  if (errors.length) {
    console.error(`  ✗ contrôle SEO : ${errors.length} erreur(s)`)
    errors.forEach(error => console.error(`    - ${error}`))
    process.exit(1)
  }
  console.log(`  ✓ contrôle SEO (${seoPages.length} pages, ${textFiles.length} fichiers)`)
}

main().catch(err => {
  console.error('check-seo failed:', err)
  process.exit(1)
})
