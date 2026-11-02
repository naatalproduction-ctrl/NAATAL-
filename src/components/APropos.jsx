import { motion } from 'framer-motion'
import { ABOUT } from '../data/site'
import './APropos.css'

const withBold = (text) => text.split('**').map((part, i) => (
  i % 2 ? <strong key={i}>{part}</strong> : part
))

export default function APropos() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
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

  const valeurIcons = [
    (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
          <path d="M8 3.8a10 10 0 0 1 8 0" />
          <path d="m2 12 2-2 2 2" />
          <path d="m18 12 2 2 2-2" />
        </svg>
    ),
    (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  ]

  return (
    <section id="apropos" className="apropos">
      {/* Background */}
      <div className="apropos-grain"></div>
      <div className="apropos-gradient-orb apropos-orb-1"></div>
      <div className="apropos-gradient-orb apropos-orb-2"></div>
      <div className="apropos-line apropos-line-v"></div>
      <div className="apropos-line apropos-line-h"></div>

      <div className="apropos-inner">
        {/* Hero zone */}
        <motion.div
          className="apropos-hero"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="apropos-label">
            {ABOUT.label}
          </motion.h1>

          <motion.p variants={itemVariants} className="apropos-title">
            L'image que vous donnez commence avant que vous <span className="apropos-accent">parliez</span>
          </motion.p>

          <motion.p variants={itemVariants} className="apropos-subtitle">
            {ABOUT.subtitle}
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="apropos-stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {ABOUT.stats.map((stat, i) => (
            <div key={i} className="apropos-stat">
              <span className="apropos-stat-value">{stat.value}</span>
              <span className="apropos-stat-label">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Story + Valeurs */}
        <div className="apropos-content">
          <motion.div
            className="apropos-story"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="apropos-section-title">Notre histoire</h2>
            {ABOUT.story.map((text, i) => <p key={i}>{withBold(text)}</p>)}
          </motion.div>

          <motion.div
            className="apropos-valeurs"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="apropos-section-title">Nos valeurs</h2>
            <div className="apropos-valeurs-grid">
              {ABOUT.values.map((v, i) => (
                <motion.div
                  key={i}
                  className="apropos-valeur-card"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="apropos-valeur-icon">{valeurIcons[i]}</div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
