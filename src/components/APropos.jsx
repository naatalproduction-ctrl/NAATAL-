import { motion } from 'framer-motion'
import './APropos.css'

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

  const stats = [
    { value: '5+', label: 'Années d\'expérience' },
    { value: '120+', label: 'Projets réalisés' },
    { value: '80+', label: 'Clients satisfaits' },
    { value: '∞', label: 'Ambition' },
  ]

  const valeurs = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      title: 'Excellence',
      desc: 'Chaque image, chaque plan, chaque montage est pensé pour refléter le meilleur de votre marque.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
          <path d="M8 3.8a10 10 0 0 1 8 0" />
          <path d="m2 12 2-2 2 2" />
          <path d="m18 12 2 2 2-2" />
        </svg>
      ),
      title: 'Créativité',
      desc: 'Des concepts originaux et audacieux qui captent l\'attention et marquent les esprits.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Proximité',
      desc: 'Un accompagnement sur mesure, de la conception à la livraison, avec une écoute attentive.',
    },
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
          <motion.span variants={itemVariants} className="apropos-label">
            À propos de nous
          </motion.span>

          <motion.h1 variants={itemVariants} className="apropos-title">
            L'image que vous donnez commence avant que vous <span className="apropos-accent">parliez</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="apropos-subtitle">
            Avant votre premier rendez-vous, votre prospect vous a déjà jugé.
            Sur votre site. Sur votre LinkedIn. Sur la vidéo de présentation
            que vous n'avez peut-être pas encore.
          </motion.p>

          <motion.div variants={itemVariants} className="apropos-buttons">
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const el = document.getElementById('audiovisuel')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>Voir nos réalisations</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.button>
            <motion.button
              className="btn btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const el = document.getElementById('contact')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Nous contacter
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="apropos-stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((stat, i) => (
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
            <p>
              Née de la passion pour l'image et le storytelling, NAATAL Studio
              s'est imposée comme un acteur incontournable de la production audiovisuelle
              en Côte d'Ivoire. Notre nom, issu du wolof, signifie
              <strong> révéler</strong> — mettre en lumière ce qui existe déjà. Chaque projet
              est pour nous une nouvelle opportunité de révéler votre vision, de la sortir
              de l'ombre pour la donner à voir au monde.
            </p>
            <p>
              Chez Naatal Studio, nous ne faisons pas des vidéos. Nous construisons des
              récits visuels qui ancrent votre marque dans l'esprit de vos clients. Une
              vidéo de marque bien conçue, c'est votre meilleur commercial — disponible
              24h/24, sans salaire à payer.
            </p>
            <p>
              De la publicité aux films d'entreprise, en passant par la promotion
              immobilière et la couverture événementielle, nous maîtrisons toute la chaîne
              de production avec un seul objectif : l'excellence visuelle au service de
              votre message. Basé à Abidjan, nous travaillons avec les entreprises qui
              comprennent qu'aujourd'hui, ce que l'on voit, on le croit.
            </p>
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
              {valeurs.map((v, i) => (
                <motion.div
                  key={i}
                  className="apropos-valeur-card"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="apropos-valeur-icon">{v.icon}</div>
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
