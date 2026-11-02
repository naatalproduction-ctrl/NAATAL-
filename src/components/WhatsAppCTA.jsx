import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSite } from '../context/SiteContext'
import { BUSINESS } from '../data/site'
import './WhatsAppCTA.css'

export default function WhatsAppCTA() {
  const { siteInfo } = useSite()
  const [isHovered, setIsHovered] = useState(false)

  const phone = (siteInfo.phone || BUSINESS.phone).replace(/\D/g, '')
  const message = siteInfo.whatsapp_message || 'Bonjour, je souhaite demander un devis.'
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <div
      className="whatsapp-cta"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-label"
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.25 }}
          >
            Demander un devis
          </motion.a>
        )}
      </AnimatePresence>

      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Demander un devis sur WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="currentColor">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958a15.907 15.907 0 0 0 8.832 2.672C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.53 22.61c-.4 1.128-2.348 2.156-3.278 2.248-.876.082-1.98.118-3.196-.2a29.292 29.292 0 0 1-2.892-1.07c-5.088-2.198-8.41-7.356-8.666-7.698-.258-.34-2.086-2.776-2.086-5.296 0-2.518 1.32-3.76 1.79-4.272.468-.512 1.022-.64 1.362-.64.34 0 .682.002 .978.018.314.016.736-.12 1.152.878.418 1.002 1.42 3.472 1.546 3.724.128.254.212.55.042.886-.17.34-.254.55-.508.846-.254.298-.534.664-.764.892-.254.254-.518.528-.222 1.038.296.51 1.316 2.17 2.826 3.516 1.942 1.73 3.578 2.268 4.088 2.522.51.254.808.212 1.106-.128.296-.34 1.278-1.488 1.618-2 .34-.51.68-.426 1.148-.254.468.17 2.938 1.386 3.448 1.638.51.254.85.382.978.594.128.212.128 1.234-.272 2.362z"/>
        </svg>
      </motion.a>
    </div>
  )
}
