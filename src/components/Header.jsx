import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const isBoutiquePage = location.pathname === '/boutique'
  const isCinemaPage = location.pathname === '/cinema'

  const menuItems = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Audiovisuel', href: '#audiovisuel' },
    { label: 'Boutique', href: '/boutique', isRoute: true },
    { label: 'Cinéma', href: '/cinema', isRoute: true },
    { label: 'Contact', href: '#contact' }
  ]

  const hiddenLinks = [
    { label: 'Boutique', href: '/boutique' },
    { label: 'Cinéma', href: '/cinema' }
  ]

  const handleBackClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="header">
      <motion.div 
        className="header-content"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
         {!isBoutiquePage && !isCinemaPage && (
           <motion.div
             className="logo"
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
           >
             <img src="/img/logo.png" alt="NAATAL Logo" className="logo-image" />
           </motion.div>
         )}

         {!isBoutiquePage && !isCinemaPage && (
           <nav className={`nav ${isOpen ? 'open' : ''}`}>
             {menuItems.map((item, index) => (
               item.isRoute ? (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.1 }}
                 >
                   <Link
                     to={item.href}
                     className="nav-link"
                     onClick={() => setIsOpen(false)}
                   >
                     {item.label}
                   </Link>
                 </motion.div>
               ) : (
                 <motion.a
                   key={index}
                   href={item.href}
                   className="nav-link"
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.1 }}
                   whileHover={{ color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                   onClick={() => setIsOpen(false)}
                 >
                   {item.label}
                 </motion.a>
               )
             ))}
           </nav>
         )}

         {isBoutiquePage && (
           <Link to="/" className="back-link" onClick={handleBackClick}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M19 12H5m7-7l-7 7 7 7"/>
             </svg>
             <span>Retour</span>
           </Link>
         )}

         {isCinemaPage && (
           <Link to="/" className="back-link" onClick={handleBackClick}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M19 12H5m7-7l-7 7 7 7"/>
             </svg>
             <span>Retour</span>
           </Link>
         )}

         <div className="hidden-links">
           <Link to="/boutique" className="hidden-link" aria-label="Boutique">
             Boutique
           </Link>
           <Link to="/cinema" className="hidden-link" aria-label="Cinéma">
             Cinéma
           </Link>
         </div>

         <motion.button
          className="hamburger"
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <span></span>
          <span></span>
          <span></span>
        </motion.button>
      </motion.div>
    </header>
  )
}
