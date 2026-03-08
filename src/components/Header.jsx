import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const location = useLocation()
  const navigate = useNavigate()
  const isHomePage = location.pathname === '/'
  const isBoutiquePage = location.pathname === '/boutique'
  const isCinemaPage = location.pathname === '/cinema'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleAnchorClick = (anchor) => {
    setIsOpen(false)
    if (isHomePage) {
      const el = document.querySelector(anchor)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/' + anchor)
    }
  }

  const menuItems = [
    { label: 'Accueil', href: '#hero', type: 'anchor' },
    { label: 'Audiovisuel', href: '#audiovisuel', type: 'anchor' },
    { label: 'Cinéma', href: '/cinema', type: 'route', hidden: isCinemaPage },
    { label: 'Boutique', href: '/boutique', type: 'route', hidden: isBoutiquePage },
    { label: 'Contact', href: '#contact', type: 'anchor' }
  ]

  const visibleItems = menuItems.filter(item => !item.hidden)

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Link to="/" onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <img src="/img/logo.png" alt="NAATAL Logo" className="logo-image" />
            </Link>
          </div>

          {/* Desktop nav */}
          {!isMobile && (
            <nav className="nav">
              {visibleItems.map((item, index) => (
                item.type === 'route' ? (
                  <Link key={index} to={item.href} className="nav-link">
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={index}
                    className="nav-link nav-link-btn"
                    onClick={() => handleAnchorClick(item.href)}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </nav>
          )}

          {isMobile && (
            <button
              className={`hamburger ${isOpen ? 'active' : ''}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="mobile-nav">
              {visibleItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.07 }}
                >
                  {item.type === 'route' ? (
                    <Link
                      to={item.href}
                      className="mobile-nav-link"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className="mobile-nav-link mobile-nav-link-btn"
                      onClick={() => handleAnchorClick(item.href)}
                    >
                      {item.label}
                    </button>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
