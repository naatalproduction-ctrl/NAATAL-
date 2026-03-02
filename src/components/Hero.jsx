import { motion } from 'framer-motion'
import './Hero.css'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <section id="hero" className="hero">
      {/* Decorative elements */}
      <div className="hero-grain"></div>
      <div className="hero-gradient-orb hero-orb-1"></div>
      <div className="hero-gradient-orb hero-orb-2"></div>

      <div className="hero-content">
        <motion.div 
          className="hero-text"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="hero-title">
            <span className="hero-title-line">
              <span className="hero-accent">Lumiere</span> en
            </span>
            <span className="hero-title-line">Mouvement</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Production audiovisuelle et cinematographique.
            Du concept a l'ecran, nous donnons vie a votre vision.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="hero-buttons"
          >
            <motion.button 
              className="btn btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const audiovisuelSection = document.getElementById('audiovisuel')
                if (audiovisuelSection) {
                  audiovisuelSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              <span>Decouvrir nos Realisations</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </motion.button>
            
            <motion.button
              className="btn btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const contactSection = document.getElementById('contact')
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Nous Contacter
            </motion.button>
          </motion.div>

        </motion.div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-visual-inner">
            {/* Halo externe pulsant */}
            <div className="hero-halo hero-halo-1"></div>
            <div className="hero-halo hero-halo-2"></div>
            {/* Anneaux orbitaux */}
            <div className="hero-ring hero-ring-1"></div>
            <div className="hero-ring hero-ring-2"></div>
            {/* Coeur lumineux */}
            <div className="hero-light-core">
              <div className="hero-light-inner"></div>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  )
}
