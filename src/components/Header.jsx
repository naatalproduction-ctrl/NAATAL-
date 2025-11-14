import { useState } from 'react'
import { motion } from 'framer-motion'
import './Header.css'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Services', href: '#services' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Équipe', href: '#team' },
    { label: 'Contact', href: '#contact' }
  ]

  return (
    <header className="header">
      <motion.div 
        className="header-content"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="logo">
          <motion.div 
            className="logo-text"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="logo-accent">◆</span>
            <span>NAATAL</span>
          </motion.div>
        </div>

        <nav className={`nav ${isOpen ? 'open' : ''}`}>
          {menuItems.map((item, index) => (
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
          ))}
        </nav>

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
