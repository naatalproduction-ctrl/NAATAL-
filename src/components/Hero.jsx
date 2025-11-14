import { motion } from 'framer-motion'
import './Hero.css'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  return (
    <section id="hero" className="hero">
      <div className="hero-content">
        <motion.div 
          className="hero-text"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="hero-title">
            <span className="hero-accent">Lumière</span> en Mouvement
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Production audiovisuelle et cinématographique de prestige
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="hero-buttons"
          >
            <motion.button 
              className="btn btn-primary"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Découvrir nos Œuvres
            </motion.button>
            
            <motion.button 
              className="btn btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Nous Contacter
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="hero-circle"></div>
          <div className="hero-circle-border"></div>
        </motion.div>
      </div>

      <motion.div 
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>Scroller pour explorer</span>
        <svg width="20" height="30" viewBox="0 0 20 30">
          <path d="M10 20L10 5" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M10 5L5 10M10 5L15 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </motion.div>
    </section>
  )
}
