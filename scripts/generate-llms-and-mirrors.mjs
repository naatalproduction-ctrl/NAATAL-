// ============================================
// generate-llms-and-mirrors.mjs
// llms.txt + llms-full.txt + miroirs Markdown + robots.txt
// ============================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.resolve(ROOT, 'dist')
const MD_OUT = path.resolve(DIST, 'md')
const RAG_FILE = path.resolve(ROOT, 'rag', 'naatal-knowledge-base.md')

const SITE = 'https://naatalstudio.com'
const TODAY = new Date().toISOString().slice(0, 10)

const BUSINESS = {
  name: 'NAATAL Studio',
  pitch: 'Studio de production audiovisuelle et cinéma à Abidjan, Côte d\'Ivoire.',
  description:
    "NAATAL Studio est un studio basé à Abidjan, spécialisé en production audiovisuelle et cinéma : films institutionnels, brand films, captation événementielle, publicités, clips musicaux, vidéos corporate. Nous accompagnons entreprises, marques et institutions de la conception à la diffusion.",
  email: 'naatalproduction@gmail.com',
  phone: '+225 07 19 95 65 86',
  whatsapp: '+225 07 19 95 65 86',
  whatsappLink: 'https://wa.me/2250719956586',
  address: 'Cocody, Abidjan, Côte d\'Ivoire',
  founded: '2024',
  hours: 'Lun–Ven 9h–18h (GMT)',
}

const SERVICES = [
  { name: 'Conception', desc: "De l'idée au projet structuré : brainstorming, écriture, storyboard, note d'intention, repérages." },
  { name: 'Pré-Production', desc: 'Casting, gestion éditoriale, gestion budgétaire, scénographie, charte graphique, planification logistique.' },
  { name: 'Production', desc: "Tournage professionnel multi-caméra avec matériel haut de gamme (Sony FX3, optiques Sigma Art), construction de décors, direction de la photographie." },
  { name: 'Post-Production', desc: 'Montage créatif, étalonnage colorimétrique, mixage sonore, motion design, sous-titrage, exports multi-formats.' },
  { name: 'Gestion de projet', desc: 'Accompagnement stratégique de A à Z : prestataires, planning, devis, suivi qualité.' },
  { name: 'Diffusion', desc: 'Stratégie de distribution multi-supports, encodages SD/HD/4K, PAD régie numérique, optimisation multi-plateformes.' },
]

const PACKAGES = [
  { name: 'Essentiel', price: '300 000 FCFA / mois', target: 'PME & Startups', features: '2 vidéos courtes/mois, montage + sous-titres, livraison 5 jours, 2 révisions' },
  { name: 'Corporate', price: '700 000 FCFA / mois', target: 'Entreprises mid-size', features: '4 vidéos/mois, tournage 2 jours, habillage graphique, vidéo institutionnelle trimestrielle' },
  { name: 'Premium', price: '1 100 000 FCFA / mois', target: 'Grandes entreprises & institutions', features: '6–8 vidéos/mois, multi-caméra, motion design, version FR+EN, film corporate trimestriel, révisions illimitées' },
]

const SIGNATURE = [
  { name: 'Naatal Brand Film', price: '3 000 000 – 5 000 000 FCFA', desc: 'Film corporate signature 2–3 min, qualité cinéma. La carte de visite vidéo annuelle.' },
  { name: 'Naatal Event Coverage', price: '1 500 000 – 4 000 000 FCFA', desc: 'Captation événement corporate + aftermovie 90s, capsules speakers, témoignages.' },
  { name: 'Production sur-mesure', price: 'Sur devis', desc: 'Films longs, séries documentaires, productions hors Abidjan, projets multi-épisodes.' },
]

const ONEOFFS = [
  { name: 'Film institutionnel', price: '500 000 – 1 200 000 FCFA' },
  { name: 'Couverture événement corporate', price: '300 000 – 700 000 FCFA' },
  { name: 'Film de lancement produit', price: '400 000 – 900 000 FCFA' },
  { name: 'Série testimonials (×3)', price: '250 000 – 450 000 FCFA' },
  { name: 'Vidéo formation / e-learning', price: '350 000 – 750 000 FCFA' },
  { name: 'Film immobilier / promotion', price: '400 000 – 800 000 FCFA' },
]

const FAQ = [
  { q: 'Où êtes-vous basés ?', a: 'À Abidjan, dans le quartier de Cocody, Côte d\'Ivoire. Nous nous déplaçons partout en Côte d\'Ivoire et en Afrique de l\'Ouest sur devis.' },
  { q: 'Quels sont vos délais ?', a: 'Livraison standard 4 à 5 jours pour les capsules courtes. Brand Film : 4 à 6 semaines après tournage. Aftermovie événementiel : 5 jours.' },
  { q: 'Quel matériel utilisez-vous ?', a: 'Caméras Sony FX3 + optiques Sigma Art, drone certifié, régie multi-caméra, son professionnel. Backup matériel inclus sur les événements.' },
  { q: 'Quelles sont vos modalités de paiement ?', a: 'Acompte de 40 à 50% à la signature, solde à livraison. Devis ferme et gratuit sous 24 à 48h.' },
  { q: 'Travaillez-vous en sous-traitance pour les agences ?', a: 'Oui, nous collaborons régulièrement avec des agences de communication et de marketing pour leurs productions clients.' },
  { q: 'Comment démarrer un projet ?', a: 'Contactez-nous via WhatsApp (+225 07 19 95 65 86) ou par email (naatalproduction@gmail.com) avec une description du besoin. Nous proposons un échange de 20 minutes gratuit pour cadrer votre projet.' },
]

const PAGES = [
  {
    slug: 'index',
    path: '/',
    title: 'NAATAL Studio — Production Audiovisuelle et Cinéma à Abidjan',
    summary: BUSINESS.description,
  },
  {
    slug: 'cinema',
    path: '/cinema',
    title: 'Cinéma · NAATAL Studio',
    summary: 'Films de cinéma, fictions et documentaires produits par NAATAL Studio à Abidjan.',
  },
  {
    slug: 'boutique',
    path: '/boutique',
    title: 'Boutique · NAATAL Studio',
    summary: 'Espace boutique privé NAATAL Studio. Accès sur invitation.',
  },
  {
    slug: 'offres',
    path: '/offres',
    title: 'Offres et tarifs · NAATAL Studio',
    summary: 'Packages mensuels, projets ponctuels et offres signature. Tarifs transparents en FCFA.',
  },
]

// ----- llms.txt -----
const buildLlmsTxt = () => {
  const services = SERVICES.map(s => `- **${s.name}** — ${s.desc}`).join('\n')
  const packages = PACKAGES.map(p => `- **${p.name}** — ${p.price} — ${p.target} — ${p.features}`).join('\n')
  const signature = SIGNATURE.map(s => `- **${s.name}** — ${s.price} — ${s.desc}`).join('\n')
  const oneoffs = ONEOFFS.map(o => `- ${o.name} — ${o.price}`).join('\n')
  const mirrors = PAGES.map(p => `- ${SITE}/md/${p.slug}.md`).join('\n')
  const pageList = PAGES.map(p => `- [${p.title}](${SITE}${p.path})`).join('\n')

  return `# ${BUSINESS.name} — ${BUSINESS.pitch}

> Last updated: ${TODAY}

## À propos
${BUSINESS.description}

## Contact
- Site web : ${SITE}
- Email : ${BUSINESS.email}
- Téléphone : ${BUSINESS.phone}
- WhatsApp : ${BUSINESS.whatsappLink}
- Adresse : ${BUSINESS.address}
- Horaires : ${BUSINESS.hours}

## Services
${services}

## Packages mensuels
${packages}

## Offres signature
${signature}

## Projets ponctuels
${oneoffs}

## Pages
${pageList}

## Miroirs Markdown (pour LLMs)
${mirrors}

## FAQ
${FAQ.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}
`
}

// ----- llms-full.txt = knowledge base RAG complete (si dispo) -----
const buildLlmsFullTxt = async () => {
  try {
    const rag = await fs.readFile(RAG_FILE, 'utf8')
    return rag
  } catch (_) {
    return buildLlmsTxt() + '\n\n<!-- rag/naatal-knowledge-base.md absent : fallback sur llms.txt -->\n'
  }
}

// ----- Miroir Markdown par page -----
const buildPageMd = (page) => {
  const services = SERVICES.map(s => `- **${s.name}** — ${s.desc}`).join('\n')
  const packages = PACKAGES.map(p => `- **${p.name}** (${p.price}) — ${p.features}`).join('\n')
  const signature = SIGNATURE.map(s => `- **${s.name}** (${s.price}) — ${s.desc}`).join('\n')

  let body = ''
  if (page.slug === 'index') {
    body = `## Services\n${services}\n\n## Packages mensuels\n${packages}\n\n## Offres signature\n${signature}\n`
  } else if (page.slug === 'offres') {
    body = `## Packages mensuels\n${packages}\n\n## Offres signature\n${signature}\n\n## Projets ponctuels\n${ONEOFFS.map(o => `- ${o.name} — ${o.price}`).join('\n')}\n`
  } else if (page.slug === 'cinema') {
    body = `## À propos\nNAATAL Studio produit des films de cinéma, fictions et documentaires depuis Abidjan. Notre équipe couvre l'ensemble de la chaîne : développement, écriture, tournage avec matériel cinéma (Sony FX3, optiques Sigma Art), post-production et étalonnage.\n`
  } else {
    body = `## À propos\n${page.summary}\n`
  }

  return `# ${page.title}

> Source : ${SITE}${page.path}
> Last updated: ${TODAY}

${page.summary}

${body}

## Contact
- Email : ${BUSINESS.email}
- WhatsApp : ${BUSINESS.whatsappLink}
- Téléphone : ${BUSINESS.phone}

[Voir la page complète](${SITE}${page.path})
`
}

// ----- robots.txt -----
const buildRobotsTxt = () => `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin/

# AI bots — explicitement autorisés
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

Sitemap: ${SITE}/sitemap.xml
`

// ----- main -----
const main = async () => {
  await fs.mkdir(MD_OUT, { recursive: true })

  await fs.writeFile(path.join(DIST, 'llms.txt'), buildLlmsTxt(), 'utf8')
  console.log('  ✓ llms.txt')

  await fs.writeFile(path.join(DIST, 'llms-full.txt'), await buildLlmsFullTxt(), 'utf8')
  console.log('  ✓ llms-full.txt')

  for (const page of PAGES) {
    await fs.writeFile(path.join(MD_OUT, `${page.slug}.md`), buildPageMd(page), 'utf8')
    console.log(`  ✓ md/${page.slug}.md`)
  }

  await fs.writeFile(path.join(DIST, 'robots.txt'), buildRobotsTxt(), 'utf8')
  console.log('  ✓ robots.txt')
}

main().catch(err => {
  console.error('generate-llms-and-mirrors failed:', err)
  process.exit(1)
})
