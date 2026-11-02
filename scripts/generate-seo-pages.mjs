// ============================================
// generate-seo-pages.mjs — pages HTML statiques pour bots
// + sitemap.xml a la racine de dist/
// ============================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.resolve(ROOT, 'dist')
const OUT = path.resolve(DIST, 'seo')

const SITE = 'https://naatalstudio.com'
const TODAY = new Date().toISOString().slice(0, 10)
const OG_DEFAULT = `${SITE}/og-image.png`

const escape = (s = '') => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// ----- Catalogue des pages -----
// slug = chemin de fichier (sans .html). path = URL canonique.
const PAGES = [
  {
    slug: 'index',
    path: '/',
    title: 'NAATAL Studio — Production Audiovisuelle et Cinéma à Abidjan',
    description: "NAATAL Studio est un studio de cinéma et production audiovisuelle basé à Abidjan, Côte d'Ivoire. Films institutionnels, publicités, clips, couverture événementielle, vidéos corporate.",
    h1: 'NAATAL Studio — Production Audiovisuelle et Cinéma à Abidjan',
    body: [
      "NAATAL Studio est un studio basé à Abidjan, Côte d'Ivoire, spécialisé en production audiovisuelle et cinéma : films institutionnels, brand films, captation événementielle, publicités, clips musicaux, vidéos corporate.",
      "Nous accompagnons entreprises, marques et institutions à chaque étape : conception, écriture, tournage multi-caméra, post-production, étalonnage et diffusion.",
      "Trois packages mensuels (Essentiel, Corporate, Premium) et des projets ponctuels permettent de choisir la formule adaptée à vos ambitions. Devis gratuit, réponse sous 24h.",
    ],
    priority: 1.0,
    changefreq: 'weekly',
    schema: 'organization',
  },
  {
    slug: 'cinema',
    path: '/cinema',
    title: 'Cinéma — Films produits par NAATAL Studio à Abidjan',
    description: "Découvrez les films de cinéma produits par NAATAL Studio : longs métrages, documentaires et fictions tournés en Côte d'Ivoire et en Afrique de l'Ouest.",
    h1: 'Cinéma · NAATAL Studio',
    body: [
      "NAATAL Studio produit des films de cinéma, fictions et documentaires depuis Abidjan.",
      "Notre équipe couvre l'ensemble de la chaîne : développement, écriture, tournage avec matériel cinéma (Sony FX3, optiques Sigma Art), post-production et étalonnage.",
    ],
    priority: 0.8,
    changefreq: 'weekly',
  },
  {
    slug: 'boutique',
    path: '/boutique',
    title: 'Boutique — Services & Produits NAATAL Studio',
    description: 'Boutique privée NAATAL Studio : services audiovisuels, packages vidéo et produits exclusifs.',
    h1: 'Boutique · NAATAL Studio',
    body: [
      "Espace boutique privé de NAATAL Studio. Accès sur invitation aux services et produits audiovisuels exclusifs.",
    ],
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    slug: 'offres',
    path: '/offres',
    title: 'Offres & Tarifs — Production vidéo à Abidjan · NAATAL Studio',
    description: "Packages mensuels et projets ponctuels NAATAL Studio : Essentiel, Corporate, Premium, Brand Film, Event Coverage. Tarifs transparents en FCFA.",
    h1: 'Nos offres et tarifs',
    body: [
      "Packages mensuels — Essentiel (à partir de 300 000 FCFA/mois), Corporate (700 000 FCFA/mois), Premium (1 100 000 FCFA/mois). Production vidéo récurrente avec contrat 3 mois minimum.",
      "Offres signature — Naatal Brand Film (3 000 000 à 5 000 000 FCFA), Naatal Event Coverage (1 500 000 à 4 000 000 FCFA), Production sur-mesure (sur devis).",
      "Projets ponctuels — Films institutionnels, couverture événement corporate, films de lancement produit, séries testimonials, vidéos formation, films immobiliers. Tarifs entre 250 000 et 1 200 000 FCFA selon prestation.",
    ],
    priority: 0.9,
    changefreq: 'monthly',
    schema: 'service',
  },
]

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NAATAL Studio',
  url: SITE,
  logo: `${SITE}/img/logo.png`,
  email: 'naatalproduction@gmail.com',
  telephone: '+225 07 19 95 65 86',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Abidjan',
    addressRegion: 'Cocody',
    addressCountry: 'CI',
  },
  sameAs: [
    'https://www.instagram.com/_naatal.studio',
    'https://www.facebook.com/profile.php?id=61578385959318',
    'https://www.youtube.com/@NaatalStudio-p4i',
    'https://www.linkedin.com/in/naatal-studio-b378983b9',
  ],
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Production audiovisuelle',
  provider: { '@type': 'Organization', name: 'NAATAL Studio', url: SITE },
  areaServed: { '@type': 'Country', name: "Côte d'Ivoire" },
  offers: [
    { '@type': 'Offer', name: 'Essentiel', price: '300000', priceCurrency: 'XOF', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' } },
    { '@type': 'Offer', name: 'Corporate', price: '700000', priceCurrency: 'XOF' },
    { '@type': 'Offer', name: 'Premium', price: '1100000', priceCurrency: 'XOF' },
  ],
}

const buildJsonLd = (kind) => {
  if (kind === 'organization') return JSON.stringify(orgJsonLd)
  if (kind === 'service') return JSON.stringify(serviceJsonLd)
  return null
}

const renderHtml = (page) => {
  const url = `${SITE}${page.path}`
  const jsonLd = buildJsonLd(page.schema)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}" />
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escape(page.title)}" />
  <meta property="og:description" content="${escape(page.description)}" />
  <meta property="og:image" content="${OG_DEFAULT}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="NAATAL Studio" />
  <meta property="og:locale" content="fr_FR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escape(page.title)}" />
  <meta name="twitter:description" content="${escape(page.description)}" />
  <meta name="twitter:image" content="${OG_DEFAULT}" />
${jsonLd ? `  <script type="application/ld+json">${jsonLd}</script>\n` : ''}
  <script>
    if (!/bot|crawl|spider|facebook|twitter|linkedin|whatsapp|telegram|slack|discord|preview|embed/i.test(navigator.userAgent)) {
      window.location.replace('${url}');
    }
  </script>
</head>
<body>
  <h1>${escape(page.h1)}</h1>
${page.body.map(p => `  <p>${escape(p)}</p>`).join('\n')}
  <p><a href="${url}">Voir le site</a></p>
</body>
</html>
`
}

const buildSitemap = () => {
  const items = PAGES.map(p => `  <url>
    <loc>${SITE}${p.path === '/' ? '/' : p.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>
  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`
}

const main = async () => {
  await fs.mkdir(OUT, { recursive: true })

  for (const page of PAGES) {
    const file = path.join(OUT, `${page.slug}.html`)
    await fs.writeFile(file, renderHtml(page), 'utf8')
    console.log(`  ✓ seo/${page.slug}.html`)
  }

  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(), 'utf8')
  console.log(`  ✓ sitemap.xml (${PAGES.length} URLs)`)
}

main().catch(err => {
  console.error('generate-seo-pages failed:', err)
  process.exit(1)
})
