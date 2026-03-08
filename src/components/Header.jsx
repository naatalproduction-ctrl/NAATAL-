import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const location = useLocation()
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

  const menuItems = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Audiovisuel', href: '#audiovisuel' },
    { label: 'Cinéma', href: '/cinema', isRoute: true },
    { label: 'Boutique', href: '/boutique', isRoute: true },
    { label: 'Contact', href: '#contact' }
  ]

  const handleBackClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
           {!isBoutiquePage && !isCinemaPage && (
             <div className="logo">
               <img src="/img/logo.png" alt="NAATAL Logo" className="logo-image" />
             </div>
           )}

           {/* Desktop nav only */}
           {!isMobile && !isBoutiquePage && !isCinemaPage && (
             <nav className="nav">
               {menuItems.map((item, index) => (
                 item.isRoute ? (
                   <Link key={index} to={item.href} className="nav-link">
                     {item.label}
                   </Link>
                 ) : (
                   <a key={index} href={item.href} className="nav-link">
                     {item.label}
                   </a>
                 )
               ))}
             </nav>
           )}

           {(isBoutiquePage || isCinemaPage) && (
             <Link to="/" className="back-link" onClick={handleBackClick}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M19 12H5m7-7l-7 7 7 7"/>
               </svg>
               <span>Retour</span>
             </Link>
           )}

           <div className="hidden-links">
             <Link to="/boutique" className="hidden-link" aria-label="Boutique">Boutique</Link>
             <Link to="/cinema" className="hidden-link" aria-label="Cinéma">Cinéma</Link>
           </div>

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

      {/* Mobile menu overlay - separate from header */}
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
              {menuItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.07 }}
                >
                  {item.isRoute ? (
                    <Link
                      to={item.href}
                      className="mobile-nav-link"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="mobile-nav-link"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </a>
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
