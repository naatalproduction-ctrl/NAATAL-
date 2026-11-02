import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://naatalstudio.com'
const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, follow'

const HOME = {
  title: "NAATAL Studio — Production Audiovisuelle et Cinéma à Abidjan, Côte d'Ivoire",
  description: "NAATAL Studio, production audiovisuelle à Abidjan : films institutionnels, publicités, vidéos corporate, couverture d'événements et promotion immobilière.",
}

const ROUTE_META = {
  '/': HOME,
  '/cinema': {
    title: 'Cinéma — Films produits par NAATAL Studio à Abidjan',
    description: "Découvrez les films et projets cinéma produits par NAATAL Studio à Abidjan, Côte d'Ivoire.",
  },
  '/boutique': {
    title: 'Boutique — Services & Produits NAATAL Studio',
    description: 'Boutique NAATAL Studio : outils professionnels pour créateurs visuels.',
  },
  '/offres': {
    title: 'Offres & Tarifs — Production vidéo à Abidjan · NAATAL Studio',
    description: 'Packages mensuels et projets ponctuels de production vidéo à Abidjan par NAATAL Studio.',
  },
}

const setMeta = (selector, attribute, value) => {
  const element = document.head.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

export default function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
    const meta = ROUTE_META[path]
    const url = `${SITE}${meta ? path : '/'}`
    const { title, description } = meta || HOME

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[name="robots"]', 'content', meta ? ROBOTS_INDEX : ROBOTS_NOINDEX)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
  }, [pathname])

  return null
}
