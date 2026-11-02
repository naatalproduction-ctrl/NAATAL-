import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { prestationsAPI } from '../services/api'
import { SERVICE_PAGES } from '../data/site'
import './Prestations.css'

const iconMap = {
  conception: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <path d="M14 34V24l10-10 10 10v10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 34v-8h4v8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="30" cy="22" r="2"/>
      <path d="M10 18l14-14 14 14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  gestion: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <rect x="12" y="14" width="24" height="20" rx="2" strokeLinecap="round"/>
      <path d="M12 20h24" strokeLinecap="round"/>
      <path d="M20 14v-2a4 4 0 0 1 8 0v2" strokeLinecap="round"/>
      <line x1="18" y1="26" x2="30" y2="26" strokeLinecap="round"/>
      <line x1="18" y1="30" x2="26" y2="30" strokeLinecap="round"/>
    </svg>
  ),
  preproduction: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <rect x="10" y="14" width="28" height="20" rx="2"/>
      <path d="M10 20h28"/>
      <circle cx="16" cy="17" r="1" fill="currentColor"/>
      <circle cx="20" cy="17" r="1" fill="currentColor"/>
      <circle cx="24" cy="17" r="1" fill="currentColor"/>
      <path d="M16 26h6M16 30h10" strokeLinecap="round"/>
      <path d="M30 24l-4 3v-6l4 3z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  production: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <rect x="8" y="18" width="22" height="16" rx="2"/>
      <polygon points="30,22 40,17 40,35 30,30"/>
      <circle cx="16" cy="14" r="4"/>
      <path d="M14 10h4M16 8v4" strokeLinecap="round"/>
    </svg>
  ),
  postproduction: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <rect x="10" y="14" width="28" height="20" rx="2"/>
      <path d="M10 28h28"/>
      <rect x="14" y="30" width="4" height="2" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="20" y="30" width="6" height="2" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="28" y="30" width="6" height="2" rx="0.5" fill="currentColor" stroke="none"/>
      <path d="M22 21l4 3-4 3z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  diffusion: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <circle cx="24" cy="24" r="4"/>
      <path d="M18 18a8.5 8.5 0 0 1 12 0" strokeLinecap="round"/>
      <path d="M30 30a8.5 8.5 0 0 1-12 0" strokeLinecap="round"/>
      <path d="M14 14a14 14 0 0 1 20 0" strokeLinecap="round"/>
      <path d="M34 34a14 14 0 0 1-20 0" strokeLinecap="round"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="20" opacity="0.1" fill="currentColor" stroke="none"/>
      <polygon points="20,16 34,24 20,32" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export default function Prestations() {
  const [prestations, setPrestations] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrestations = async () => {
      try {
        const response = await prestationsAPI.getActive()
        if (response.success) {
          setPrestations(response.data)
        }
      } catch (err) {
        console.error('Erreur chargement prestations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrestations()
  }, [])

  const getIcon = (iconName) => iconMap[iconName] || iconMap.video

  return (
    <section id="prestations" className="prestations">
      <div className="prestations-bg">
        <div className="prestations-grid-lines" />
        <div className="prestations-glow prestations-glow--1" />
        <div className="prestations-glow prestations-glow--2" />
      </div>

      <motion.div
        className="prestations-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="prestations-header"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="prestations-label">Ce que nous faisons</span>
          <h2>Nos Prestations</h2>
        </motion.div>

        {loading ? (
          <div className="prestations-loading">
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="prestations-grid">
              {prestations.map((prestation, index) => {
                const details = typeof prestation.details === 'string'
                  ? JSON.parse(prestation.details)
                  : prestation.details || []

                return (
                  <motion.div
                    key={prestation.id}
                    className={`prestation-card ${activeCard === prestation.id ? 'prestation-card--active' : ''}`}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    viewport={{ once: true }}
                    onMouseEnter={() => setActiveCard(prestation.id)}
                    onMouseLeave={() => setActiveCard(null)}
                  >
                    <div className="prestation-card-inner">
                      <div className="prestation-card-front">
                        <span className="prestation-num">0{index + 1}</span>
                        <div className="prestation-icon">
                          {getIcon(prestation.icon)}
                        </div>
                        <h3>{prestation.title}</h3>
                        <p>{prestation.description}</p>
                        <div className="prestation-card-line" />
                        <span className="prestation-cta">
                          Voir les détails
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </div>

                      <div className="prestation-card-back">
                        <h4>{prestation.title}</h4>
                        <ul className="prestation-details">
                          {details.map((detail, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={activeCard === prestation.id ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                              transition={{ delay: 0.05 * i }}
                            >
                              <span className="detail-dot" />
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <nav className="prestations-specialites" aria-label="Nos spécialités">
              {SERVICE_PAGES.map(service => (
                <Link key={service.slug} to={`/services/${service.slug}`}>{service.name}</Link>
              ))}
            </nav>

            {/* Bottom CTA */}
            <motion.div
              className="prestations-cta"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <p>Un projet en tête ? Parlons-en.</p>
              <a href="#contact" className="prestations-cta-btn">
                Demander un devis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </motion.div>
          </>
        )}
      </motion.div>
    </section>
  )
}
