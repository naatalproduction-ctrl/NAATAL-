// ============================================
// generate-llms-and-mirrors.mjs
// llms.txt + llms-full.txt + miroirs Markdown + robots.txt
// ============================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUSINESS, ONE_OFF_PROJECTS, PACKAGES, SIGNATURE_OFFERS, SITE_URL } from '../src/data/site.js'
import { FAQ, buildPages, fetchLiveContent } from './seo-content.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.resolve(ROOT, 'dist')
const MD_OUT = path.resolve(DIST, 'md')
const RAG_FILE = path.resolve(ROOT, 'rag', 'naatal-knowledge-base.md')

const TODAY = new Date().toISOString().slice(0, 10)

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'DuckAssistBot',
  'MistralAI-User',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'cohere-ai',
  'CCBot',
]

const absolute = (target) => (target === '/' ? `${SITE_URL}/` : `${SITE_URL}${target}`)
const mirrorUrl = (page) => `${SITE_URL}/md/${page.slug}.md`

const contactLines = [
  `- Site web : ${SITE_URL}`,
  `- Email : ${BUSINESS.email}`,
  `- Téléphone et WhatsApp : ${BUSINESS.phone}`,
  `- Lien WhatsApp direct : ${BUSINESS.whatsappLink}`,
  `- Adresse : ${BUSINESS.address.street}, ${BUSINESS.address.city}, ${BUSINESS.address.countryName}`,
  `- Horaires : ${BUSINESS.hours}`,
  ...BUSINESS.socials.map(social => `- ${social.name} : ${social.url}`),
].join('\n')

// ----- llms.txt -----
const buildLlmsTxt = (pages, offresEnabled) => {
  const services = pages.filter(page => page.service)
  const others = pages.filter(page => !page.service && !page.noindex)
  const pageLine = (page) => `- [${page.h1}](${mirrorUrl(page)}): ${page.description}`
  const pricing = offresEnabled
    ? `## Tarifs
${PACKAGES.map(item => `- ${item.name} : ${item.price}, pour ${item.target}. ${item.features}`).join('\n')}
${SIGNATURE_OFFERS.map(item => `- ${item.name} : ${item.price}. ${item.desc}`).join('\n')}
${ONE_OFF_PROJECTS.map(item => `- ${item.name} : ${item.price}`).join('\n')}

`
    : ''

  return `# ${BUSINESS.name}

> ${BUSINESS.description}

Dernière mise à jour : ${TODAY}. Langue du site : français. Pour une première prise de contact, privilégier WhatsApp : ${BUSINESS.whatsappLink}

## Services
${services.map(pageLine).join('\n')}

## Pages
${others.map(pageLine).join('\n')}

## Contact
${contactLines}

${pricing}## Questions fréquentes
${FAQ.map(item => `### ${item.question}\n${item.answer}`).join('\n\n')}

## Optional
- [Base de connaissances complète](${SITE_URL}/llms-full.txt): processus d'engagement, matériel, FAQ détaillée et portfolio
- [Sitemap](${SITE_URL}/sitemap.xml): liste des pages du site
`
}

// Offres masquees : retire les tarifs de la knowledge base
const stripPricing = (rag) => rag
  .replace(/### 3\.2 [\s\S]*?(?=\n---\n)/, '')
  .replace(/\*\*Acceptez-vous les devis plus modestes \?\*\*[\s\S]*?\n\n/, '')
  .replace(/^- Tarifs transparents.*\n/m, '')
  .replace(/^- \*\*Transparence des prix\*\*.*\n/m, '')
  .replace(/ \([\d\s–]+FCFA\)/g, '')

// ----- llms-full.txt = knowledge base RAG complete (si dispo) -----
const buildLlmsFullTxt = async (pages, offresEnabled) => {
  try {
    const rag = await fs.readFile(RAG_FILE, 'utf8')
    return offresEnabled ? rag : stripPricing(rag)
  } catch (_) {
    return buildLlmsTxt(pages, offresEnabled) + '\n\n<!-- rag/naatal-knowledge-base.md absent : fallback sur llms.txt -->\n'
  }
}

// ----- Miroir Markdown par page -----
const renderEntry = (entry) => [
  `### ${entry.heading}`,
  entry.text,
  entry.detail,
  ...(entry.items || []).map(item => `- ${item}`),
  entry.url && `[Voir la vidéo sur YouTube](${entry.url})`,
].filter(Boolean).join('\n')

const renderSection = (section) => [
  `## ${section.heading}`,
  ...(section.paragraphs || []),
  section.items?.map(item => `- ${item}`).join('\n'),
  section.links?.map(link => `- [${link.label}](${absolute(link.path)})${link.note ? ` : ${link.note}` : ''}`).join('\n'),
  ...(section.entries || []).map(renderEntry),
  ...(section.qa || []).map(item => `### ${item.question}\n${item.answer}`),
].filter(Boolean).join('\n\n')

const buildPageMd = (page) => `# ${page.h1}

> ${page.description}

Source : ${absolute(page.path)}
Dernière mise à jour : ${TODAY}

${page.lead.join('\n\n')}

${page.sections.map(renderSection).join('\n\n')}

## Contact
${contactLines}
`

// ----- robots.txt -----
const buildRobotsTxt = () => `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

# Robots IA : memes regles, explicitement autorises
${AI_BOTS.map(bot => `User-agent: ${bot}`).join('\n')}
Allow: /
Disallow: /api/
Disallow: /admin

# Resume pour les LLMs : ${SITE_URL}/llms.txt
Sitemap: ${SITE_URL}/sitemap.xml
`

// ----- main -----
const main = async () => {
  const live = await fetchLiveContent()
  const pages = buildPages(live)

  await fs.rm(MD_OUT, { recursive: true, force: true })

  await fs.writeFile(path.join(DIST, 'llms.txt'), buildLlmsTxt(pages, live.offresEnabled), 'utf8')
  console.log('  ✓ llms.txt')

  await fs.writeFile(path.join(DIST, 'llms-full.txt'), await buildLlmsFullTxt(pages, live.offresEnabled), 'utf8')
  console.log('  ✓ llms-full.txt')

  for (const page of pages.filter(item => !item.noindex)) {
    const file = path.join(MD_OUT, `${page.slug}.md`)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, buildPageMd(page), 'utf8')
    console.log(`  ✓ md/${page.slug}.md`)
  }

  await fs.writeFile(path.join(DIST, 'robots.txt'), buildRobotsTxt(), 'utf8')
  console.log('  ✓ robots.txt')
}

main().catch(err => {
  console.error('generate-llms-and-mirrors failed:', err)
  process.exit(1)
})
