import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTE_META, SITE_URL } from '../data/site'

const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, follow'
const HOME = ROUTE_META['/']

const setMeta = (selector, attribute, value) => {
  const element = document.head.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

export default function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
    const meta = ROUTE_META[path]
    const url = `${SITE_URL}${meta ? path : '/'}`
    const { title, description } = meta || HOME
    const markdown = !meta || path === '/' ? '/md/index.md' : `/md${path}.md`

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[name="robots"]', 'content', meta ? ROBOTS_INDEX : ROBOTS_NOINDEX)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('link[type="text/markdown"]', 'href', markdown)
  }, [pathname])

  return null
}
