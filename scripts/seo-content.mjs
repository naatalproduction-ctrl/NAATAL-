// ============================================
// seo-content.mjs — contenu commun aux pages robots et aux miroirs Markdown.
// Reprend le texte visible du site et les donnees de l'API de production,
// pour que les robots lisent la meme chose que les visiteurs.
// ============================================
import {
  ABOUT,
  BUSINESS,
  CINEMA_INTRO,
  ONE_OFF_PROJECTS,
  PACKAGES,
  PRESTATIONS_FALLBACK,
  PROCESS,
  ROUTE_META,
  SERVICE_PAGES,
  SIGNATURE_OFFERS,
  SITE_URL,
  VIDEO_DESCRIPTIONS,
  VIDEO_METADATA,
  buildFaq,
  getYouTubeId,
} from '../src/data/site.js'

const API_URL = `${SITE_URL}/api`

export const FAQ = buildFaq(BUSINESS)

const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { signal: AbortSignal.timeout(8000) })
    const { data } = await response.json()
    return data ?? null
  } catch (err) {
    console.warn(`  ! ${endpoint} illisible (${err.message})`)
    return null
  }
}

const toPrestation = ({ title, description, details }) => ({
  title,
  description,
  details: typeof details === 'string' ? JSON.parse(details) : details || [],
})

const toVideo = (media) => {
  const id = getYouTubeId(media.url)
  if (!id) return null
  return {
    id,
    name: media.name,
    description: media.description || VIDEO_DESCRIPTIONS[id] || '',
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    ...VIDEO_METADATA[id],
  }
}

export const fetchLiveContent = async () => {
  const [settings, prestations, films, medias, products] = await Promise.all([
    fetchData('/settings/public'),
    fetchData('/prestations/public'),
    fetchData('/cinema/public'),
    fetchData('/medias'),
    fetchData('/boutique/public'),
  ])

  return {
    offresEnabled: settings?.offresEnabled === true,
    prestations: prestations?.length ? prestations.map(toPrestation) : PRESTATIONS_FALLBACK,
    films: films || [],
    videos: (medias || []).map(toVideo).filter(Boolean),
    products: products || [],
  }
}

const processSection = {
  heading: 'Comment se déroule votre projet',
  items: PROCESS.map(step => `${step.title} : ${step.desc}`),
}

const servicePath = (service) => `/services/${service.slug}`

const homePage = ({ prestations, videos }) => ({
  slug: 'index',
  path: '/',
  h1: ABOUT.label,
  lead: [ABOUT.tagline, ABOUT.subtitle],
  breadcrumb: [],
  faq: FAQ,
  videos,
  priority: 1.0,
  changefreq: 'weekly',
  sections: [
    { heading: 'Notre histoire', paragraphs: ABOUT.story },
    { heading: 'Nos valeurs', items: ABOUT.values.map(value => `${value.title} : ${value.desc}`) },
    {
      heading: 'En chiffres',
      items: ABOUT.stats.filter(stat => stat.value !== '∞').map(stat => `${stat.value} ${stat.label.toLowerCase()}`),
    },
    {
      heading: 'Nos prestations',
      entries: prestations.map(item => ({ heading: item.title, text: item.description, items: item.details })),
    },
    {
      heading: 'Nos services à Abidjan',
      links: SERVICE_PAGES.map(service => ({ label: service.h1, path: servicePath(service), note: service.description })),
    },
    {
      heading: 'Nos réalisations',
      entries: videos.map(video => ({ heading: video.name, text: video.description, url: video.url, thumbnail: video.thumbnail })),
    },
    processSection,
    { heading: 'Questions fréquentes', qa: FAQ },
  ],
})

const filmDetails = (film) => [
  film.genre,
  film.year,
  film.duration,
  film.director && `Réalisation : ${film.director}`,
].filter(Boolean).join(' · ')

const cinemaPage = ({ films }) => ({
  slug: 'cinema',
  path: '/cinema',
  h1: 'Cinéma',
  lead: [CINEMA_INTRO],
  breadcrumb: [{ name: 'Cinéma', path: '/cinema' }],
  films,
  priority: 0.8,
  changefreq: 'weekly',
  sections: [
    {
      heading: 'Nos films',
      entries: films.map(film => ({ heading: film.title, text: filmDetails(film), detail: film.description || film.synopsis })),
    },
  ],
})

const boutiquePage = ({ products }) => ({
  slug: 'boutique',
  path: '/boutique',
  h1: 'Boutique NAATAL',
  lead: ['Outils professionnels pour créateurs visuels'],
  breadcrumb: [{ name: 'Boutique', path: '/boutique' }],
  // Une boutique vide est une page pauvre : les robots ne doivent pas l'indexer
  noindex: products.length === 0,
  priority: 0.6,
  changefreq: 'monthly',
  sections: products.length
    ? [{ heading: 'Nos produits', entries: products.map(item => ({ heading: item.name, text: item.description })) }]
    : [],
})

const offresPage = () => ({
  slug: 'offres',
  path: '/offres',
  h1: 'Nos offres et tarifs',
  lead: [ROUTE_META['/offres'].description],
  breadcrumb: [{ name: 'Offres', path: '/offres' }],
  pricing: true,
  priority: 0.9,
  changefreq: 'monthly',
  sections: [
    { heading: 'Packages mensuels', items: PACKAGES.map(item => `${item.name} (${item.price}) : ${item.features}`) },
    { heading: 'Offres signature', items: SIGNATURE_OFFERS.map(item => `${item.name} (${item.price}) : ${item.desc}`) },
    { heading: 'Projets ponctuels', items: ONE_OFF_PROJECTS.map(item => `${item.name} : ${item.price}`) },
  ],
})

const servicePage = (service, { videos }) => {
  const path = servicePath(service)
  const video = videos.find(item => item.id === service.videoId)

  return {
    slug: `services/${service.slug}`,
    path,
    h1: service.h1,
    lead: service.intro,
    breadcrumb: [
      { name: 'Prestations', path: '/#prestations' },
      { name: service.name, path },
    ],
    service,
    faq: service.faq,
    priority: 0.9,
    changefreq: 'monthly',
    sections: [
      { heading: 'Ce qui est inclus', items: service.includes },
      { heading: 'Pour qui ?', items: service.audience },
      ...(video
        ? [{ heading: 'Exemple de réalisation', entries: [{ heading: video.name, text: video.description, url: video.url, thumbnail: video.thumbnail }] }]
        : []),
      processSection,
      { heading: 'Questions fréquentes', qa: service.faq },
      {
        heading: 'Nos autres services à Abidjan',
        links: SERVICE_PAGES.filter(other => other !== service).map(other => ({ label: other.name, path: servicePath(other) })),
      },
    ],
  }
}

export const buildPages = (live) => [
  homePage(live),
  ...SERVICE_PAGES.map(service => servicePage(service, live)),
  cinemaPage(live),
  boutiquePage(live),
  ...(live.offresEnabled ? [offresPage()] : []),
].map(page => ({ ...page, ...ROUTE_META[page.path] }))
