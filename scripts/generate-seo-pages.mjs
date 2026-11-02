// ============================================
// generate-seo-pages.mjs — pages HTML statiques pour bots, sitemap.xml
// et contenu lisible sans JavaScript dans dist/index.html
// ============================================
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUSINESS, LOGO_URL, OG_IMAGE, PACKAGES, SERVICE_PAGES, SITE_URL, telHref } from '../src/data/site.js'
import { buildPages, fetchLiveContent } from './seo-content.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.resolve(ROOT, 'dist')
const OUT = path.resolve(DIST, 'seo')

const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, follow'

const escape = (s = '') => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const inline = (text) => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
const pageUrl = (page) => `${SITE_URL}${page.path}`
const toAbsolute = (target) => (target === '/' ? `${SITE_URL}/` : `${SITE_URL}${target}`)
const markdownUrl = (page) => `${SITE_URL}/md/${page.slug}.md`

const lastModified = () => {
  try {
    return execSync('git log -1 --format=%cs', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch (_) {
    return new Date().toISOString().slice(0, 10)
  }
}

// ----- Schema.org -----
const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: BUSINESS.address.street,
  addressLocality: BUSINESS.address.city,
  addressRegion: BUSINESS.address.region,
  addressCountry: BUSINESS.address.country,
}

const areaServed = [
  { '@type': 'City', name: BUSINESS.address.city },
  { '@type': 'Country', name: BUSINESS.address.countryName },
]

const organization = {
  '@type': 'ProfessionalService',
  '@id': ORG_ID,
  name: BUSINESS.name,
  alternateName: BUSINESS.alternateName,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
  image: OG_IMAGE,
  description: BUSINESS.description,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  priceRange: '$$',
  address: postalAddress,
  areaServed,
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  }],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    availableLanguage: ['French'],
  },
  sameAs: BUSINESS.socials.map(social => social.url),
  knowsAbout: [
    'Production audiovisuelle',
    'Cinéma',
    'Film institutionnel',
    'Publicité vidéo',
    'Clip musical',
    'Documentaire',
    'Vidéo corporate',
    'Couverture événementielle',
    'Promotion immobilière',
    'Motion design',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services de production audiovisuelle à Abidjan',
    itemListElement: SERVICE_PAGES.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        url: `${SITE_URL}/services/${service.slug}`,
      },
    })),
  },
}

const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: BUSINESS.name,
  description: BUSINESS.pitch,
  inLanguage: 'fr',
  publisher: { '@id': ORG_ID },
}

const breadcrumbNode = (page) => ({
  '@type': 'BreadcrumbList',
  '@id': `${pageUrl(page)}#breadcrumb`,
  itemListElement: [{ name: 'Accueil', path: '/' }, ...page.breadcrumb].map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: toAbsolute(item.path),
  })),
})

const webPageNode = (page) => ({
  '@type': 'WebPage',
  '@id': `${pageUrl(page)}#webpage`,
  url: pageUrl(page),
  name: page.title,
  description: page.description,
  inLanguage: 'fr',
  isPartOf: { '@id': WEBSITE_ID },
  about: { '@id': ORG_ID },
  primaryImageOfPage: OG_IMAGE,
  ...(page.breadcrumb.length ? { breadcrumb: { '@id': `${pageUrl(page)}#breadcrumb` } } : {}),
})

const faqNode = (page) => ({
  '@type': 'FAQPage',
  '@id': `${pageUrl(page)}#faq`,
  mainEntity: page.faq.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})

// Google exige une date de publication pour baliser une video
const videoNodes = (page) => (page.videos || []).filter(video => video.uploadDate).map(video => ({
  '@type': 'VideoObject',
  name: video.name,
  description: video.description,
  thumbnailUrl: [video.thumbnail],
  uploadDate: video.uploadDate,
  duration: video.duration,
  embedUrl: `https://www.youtube.com/embed/${video.id}`,
  publisher: { '@id': ORG_ID },
}))

const filmNodes = (page) => (page.films || []).map((film) => {
  const minutes = String(film.duration || '').match(/\d+/)
  return {
    '@type': 'Movie',
    name: film.title,
    genre: film.genre,
    dateCreated: String(film.year),
    ...(minutes ? { duration: `PT${minutes[0]}M` } : {}),
    ...(film.director ? { director: { '@type': 'Person', name: film.director } } : {}),
    productionCompany: { '@id': ORG_ID },
  }
})

const serviceNode = (page) => ({
  '@type': 'Service',
  '@id': `${pageUrl(page)}#service`,
  name: page.service.name,
  serviceType: page.service.name,
  description: page.description,
  url: pageUrl(page),
  provider: { '@id': ORG_ID },
  areaServed,
})

const pricingNode = (page) => ({
  '@type': 'Service',
  '@id': `${pageUrl(page)}#service`,
  serviceType: 'Production audiovisuelle',
  provider: { '@id': ORG_ID },
  areaServed,
  offers: PACKAGES.map(item => ({
    '@type': 'Offer',
    name: item.name,
    price: String(item.amount),
    priceCurrency: 'XOF',
  })),
})

const buildGraph = (page) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    website,
    webPageNode(page),
    ...(page.breadcrumb.length ? [breadcrumbNode(page)] : []),
    ...(page.faq ? [faqNode(page)] : []),
    ...videoNodes(page),
    ...filmNodes(page),
    ...(page.service ? [serviceNode(page)] : []),
    ...(page.pricing ? [pricingNode(page)] : []),
  ],
}).replace(/</g, '\\u003c')

// ----- HTML -----
const renderEntry = (entry) => `      <article>
        <h3>${escape(entry.heading)}</h3>
${entry.thumbnail ? `        <img src="${entry.thumbnail}" alt="${escape(entry.heading)}" width="480" height="360" loading="lazy" />\n` : ''}${entry.text ? `        <p>${escape(entry.text)}</p>\n` : ''}${entry.detail ? `        <p>${escape(entry.detail)}</p>\n` : ''}${entry.items?.length ? `        <ul>${entry.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>\n` : ''}${entry.url ? `        <p><a href="${entry.url}">Voir la vidéo sur YouTube</a></p>\n` : ''}      </article>`

const renderSection = (section) => `    <section>
      <h2>${escape(section.heading)}</h2>
${(section.paragraphs || []).map(text => `      <p>${inline(text)}</p>`).join('\n')}
${section.items ? `      <ul>${section.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}
${section.links ? `      <ul>${section.links.map(link => `<li><a href="${toAbsolute(link.path)}">${escape(link.label)}</a></li>`).join('')}</ul>` : ''}
${(section.entries || []).map(renderEntry).join('\n')}
${(section.qa || []).map(item => `      <h3>${escape(item.question)}</h3>\n      <p>${escape(item.answer)}</p>`).join('\n')}
    </section>`.replace(/\n{2,}/g, '\n')

const contact = `<footer>
    <h2>Contact</h2>
    <address>
      ${BUSINESS.name}, ${BUSINESS.address.street}, ${BUSINESS.address.city}, ${escape(BUSINESS.address.countryName)}<br />
      Téléphone et WhatsApp : <a href="${telHref(BUSINESS.phone)}">${BUSINESS.phone}</a><br />
      Email : <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a><br />
      ${BUSINESS.hours}
    </address>
    <p>${BUSINESS.socials.map(social => `<a href="${social.url}">${social.name}</a>`).join(' · ')}</p>
  </footer>`

const navigation = `<nav aria-label="Navigation principale">
    <a href="${SITE_URL}/">Accueil</a>
${SERVICE_PAGES.map(service => `    <a href="${SITE_URL}/services/${service.slug}">${escape(service.name)}</a>`).join('\n')}
    <a href="${SITE_URL}/cinema">Cinéma</a>
    <a href="${SITE_URL}/#contact">Contact</a>
  </nav>`

const renderBody = (page) => `<header>
    <img src="${LOGO_URL}" alt="Logo NAATAL Studio" width="512" height="512" />
    ${navigation}
  </header>
  <main>
    <h1>${escape(page.h1)}</h1>
${page.lead.map(text => `    <p>${escape(text)}</p>`).join('\n')}
${page.sections.map(renderSection).join('\n')}
  </main>
  ${contact}`

const renderHtml = (page) => {
  const url = pageUrl(page)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}" />
  <meta name="robots" content="${page.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX}" />
  <link rel="canonical" href="${url}" />
${page.noindex ? '' : `  <link rel="alternate" type="text/markdown" href="${markdownUrl(page)}" />\n`}  <link rel="icon" href="${SITE_URL}/favicon.ico" sizes="16x16 32x32 48x48" />
  <link rel="icon" type="image/png" sizes="48x48" href="${SITE_URL}/favicon-48x48.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="${SITE_URL}/favicon-192x192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="${SITE_URL}/apple-touch-icon.png" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escape(page.title)}" />
  <meta property="og:description" content="${escape(page.description)}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escape(page.title)}" />
  <meta property="og:site_name" content="${BUSINESS.name}" />
  <meta property="og:locale" content="fr_FR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escape(page.title)}" />
  <meta name="twitter:description" content="${escape(page.description)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <script type="application/ld+json">${buildGraph(page)}</script>
  <script>
    if (!/bot|crawl|spider|chatgpt|claude|perplexity|openai|anthropic|facebook|twitter|linkedin|whatsapp|telegram|slack|discord|preview|embed/i.test(navigator.userAgent)) {
      window.location.replace('${url}');
    }
  </script>
</head>
<body>
  ${renderBody(page)}
</body>
</html>
`
}

// ----- dist/index.html : lisible par les robots qui ne recoivent pas la page statique -----
const enrichShell = async (home) => {
  const file = path.join(DIST, 'index.html')
  const html = await fs.readFile(file, 'utf8')
  const enriched = html
    .replace(
      /<!-- seo:jsonld:start -->[\s\S]*?<!-- seo:jsonld:end -->/,
      `<!-- seo:jsonld:start --><script type="application/ld+json">${buildGraph(home)}</script><!-- seo:jsonld:end -->`,
    )
    .replace(
      /<noscript>[\s\S]*?<\/noscript>/,
      `<noscript><div style="padding:40px;color:#fff;background:#000;font-family:sans-serif">\n  ${renderBody(home)}\n</div></noscript>`,
    )
  await fs.writeFile(file, enriched, 'utf8')
}

// ----- Sitemap -----
const videoTag = (video) => `    <video:video>
      <video:thumbnail_loc>${video.thumbnail}</video:thumbnail_loc>
      <video:title>${escape(video.name)}</video:title>
      <video:description>${escape(video.description.slice(0, 2000))}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${video.id}</video:player_loc>
      <video:publication_date>${video.uploadDate}</video:publication_date>
    </video:video>`

const buildSitemap = (pages) => {
  const lastmod = lastModified()
  const items = pages.map(page => `  <url>
    <loc>${pageUrl(page)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
    <image:image><image:loc>${OG_IMAGE}</image:loc></image:image>
${(page.videos || []).filter(video => video.uploadDate).map(videoTag).join('\n')}
  </url>`.replace(/\n\n/g, '\n')).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items}
</urlset>
`
}

const main = async () => {
  const pages = buildPages(await fetchLiveContent())

  await fs.rm(OUT, { recursive: true, force: true })

  for (const page of pages) {
    const file = path.join(OUT, `${page.slug}.html`)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, renderHtml(page), 'utf8')
    console.log(`  ✓ seo/${page.slug}.html`)
  }

  const indexable = pages.filter(page => !page.noindex)
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(indexable), 'utf8')
  console.log(`  ✓ sitemap.xml (${indexable.length} URLs)`)

  await enrichShell(pages[0])
  console.log('  ✓ index.html enrichi')
}

main().catch(err => {
  console.error('generate-seo-pages failed:', err)
  process.exit(1)
})
