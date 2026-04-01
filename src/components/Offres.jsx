import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { offresAPI } from '../services/api'
import './Offres.css'

// Fallback data si API indisponible
const fallbackPackages = [
  {
    id: 'essentiel', name: 'Essentiel', target: 'PME & Startups', price: 200000, period: '/ mois',
    is_featured: false, description: "L'entree ideale pour une presence video reguliere et professionnelle.",
    features: ['2 videos courtes / mois (30-90s)', 'Tournage 1 jour', 'Montage + sous-titres', '1 format livre (vertical ou horizontal)', 'Livraison sous 5 jours', '2 revisions incluses'],
    not_included: ['Multi-camera', 'Motion design', 'Version anglaise'], cta: 'Demarrer',
  },
  {
    id: 'corporate', name: 'Corporate', target: 'Entreprises mid-size', price: 400000, period: '/ mois',
    is_featured: true, description: 'Le package prefere des directions marketing. Visibilite et recurrence.',
    features: ['4 videos / mois (mix courts + moyen formats)', 'Tournage 2 jours', 'Montage pro + habillage graphique', '2 formats livres (vertical + horizontal)', '1 video institutionnelle / trimestre', 'Livraison sous 4 jours', '3 revisions incluses'],
    not_included: ['Version anglaise'], cta: 'Choisir Corporate',
  },
  {
    id: 'premium', name: 'Premium', target: 'Grandes entreprises & Institutions', price: 700000, period: '/ mois',
    is_featured: false, description: 'Une presence cinematographique complete. Pour ceux qui veulent dominer.',
    features: ['6-8 videos / mois', 'Tournage multi-camera inclus', 'Montage cinematique + motion design', 'Tous formats livres', 'Version francaise + anglaise', '1 film corporate long format / trimestre', 'Priorite planning - Livraison 3 jours', 'Revisions illimitees'],
    not_included: [], cta: 'Choisir Premium',
  },
]

const fallbackOneoffs = [
  { id: 'o1', name: 'Film institutionnel', description: '3-5 min · multi-cam · habillage', period: '500 000 - 1 200 000' },
  { id: 'o2', name: 'Couverture evenement corporate', description: 'Regie multi-camera · montage J+2', period: '300 000 - 700 000' },
  { id: 'o3', name: 'Film de lancement produit', description: 'Scenario + tournage + montage cinematique', period: '400 000 - 900 000' },
  { id: 'o4', name: 'Serie testimonials (x3)', description: 'Tournage 1 jour · 3 videos livrees', period: '250 000 - 450 000' },
  { id: 'o5', name: 'Video formation / e-learning', description: 'Script + tournage + sous-titres', period: '350 000 - 750 000' },
  { id: 'o6', name: 'Film immobilier / promotion', description: 'Drone + terrain + montage', period: '400 000 - 800 000' },
]

const fmtPrice = (p) =>
  new Intl.NumberFormat('fr-FR').format(p) + ' FCFA'

const CheckIcon = ({ dark }) => (
  <svg className="offre-feature-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="7" fill={dark ? '#000' : 'rgba(201,168,76,0.15)'}/>
    <path d="M4 7l2 2 4-4" stroke={dark ? '#fff' : '#c9a84c'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CrossIcon = () => (
  <svg className="offre-feature-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const getWhatsAppMsg = (pkg) => {
  if (pkg.name === 'Essentiel') {
    return `Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *${pkg.name}*.\n\nVoici ce que j'aimerais savoir :\n→ Le tarif du package\n→ Disponibilités pour démarrer\n→ Processus de démarrage\n→ Modalités de paiement\n\nDans l'attente de votre retour`
  }
  if (pkg.name === 'Corporate') {
    return `Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *${pkg.name}*.\n\nMon entreprise : [à préciser]\nMon besoin : production vidéo mensuelle régulière\n\nJ'aimerais qu'on discute de :\n→ Le tarif et les conditions\n→ Le contenu du package en détail\n→ Les disponibilités pour un premier tournage\n→ La signature du contrat\n\nMerci d'avance`
  }
  if (pkg.name === 'Premium') {
    return `Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *${pkg.name}*.\n\nStructure : [à préciser]\nVolume estimé : 6 à 8 vidéos / mois\n\nJ'aimerais organiser une réunion pour discuter de :\n→ Le tarif et les conditions du package\n→ Notre stratégie de contenu vidéo\n→ Le planning de production sur 3 mois\n→ Les modalités contractuelles\n\nDans l'attente de votre retour`
  }
  return `Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *${pkg.name}*.\n\nJ'aimerais connaître le tarif et en savoir plus sur cette offre.\n\nDans l'attente de votre retour`
}

export default function Offres() {
  const [billing, setBilling] = useState('monthly')
  const [packages, setPackages] = useState(fallbackPackages)
  const [oneoffs, setOneoffs] = useState(fallbackOneoffs)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOffres = async () => {
      try {
        const response = await offresAPI.getActive()
        if (response.success && response.data.length > 0) {
          const pkgs = response.data
            .filter(o => o.type === 'package')
            .map(o => ({
              ...o,
              features: typeof o.features === 'string' ? JSON.parse(o.features) : o.features || [],
              not_included: typeof o.not_included === 'string' ? JSON.parse(o.not_included) : o.not_included || [],
            }))
          const oneoffData = response.data
            .filter(o => o.type === 'oneoff')

          if (pkgs.length > 0) setPackages(pkgs)
          if (oneoffData.length > 0) setOneoffs(oneoffData)
        }
      } catch (err) {
        console.error('Erreur chargement offres:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOffres()
  }, [])

  return (
    <section id="offres" className="offres">
      <div className="offres-bg">
        <div className="offres-grid-lines" />
        <div className="offres-glow offres-glow--1" />
        <div className="offres-glow offres-glow--2" />
      </div>

      <motion.div
        className="offres-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Header */}
        <motion.div
          className="offres-hero"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <span className="offres-label">Nos Offres</span>
          <h2 className="offres-title">
            Des images qui travaillent<br/>
            <span>pour votre entreprise</span>
          </h2>
          <p className="offres-hero-desc">
            Packages mensuels ou projets ponctuels — choisissez la formule
            adaptee a vos ambitions.
          </p>

          <div className="offres-toggle">
            <button
              className={`offres-toggle-btn ${billing === 'monthly' ? 'offres-toggle-btn--active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Abonnement
            </button>
            <button
              className={`offres-toggle-btn ${billing === 'oneoff' ? 'offres-toggle-btn--active' : ''}`}
              onClick={() => setBilling('oneoff')}
            >
              Projet ponctuel
            </button>
          </div>
        </motion.div>

        {/* Packages */}
        <AnimatePresence mode="wait">
          {billing === 'monthly' && (
            <motion.div
              key="monthly"
              className="offres-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {packages.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  className={`offre-card ${pkg.is_featured ? 'offre-card--featured' : ''}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 * i }}
                >
                  {pkg.is_featured && (
                    <div className="offre-badge">Le plus populaire</div>
                  )}

                  <div className="offre-card-inner">
                    <div className="offre-target">{pkg.target}</div>
                    <h3 className="offre-name">{pkg.name}</h3>
                    <p className="offre-desc">{pkg.description}</p>

                    <div className="offre-price-row">
                      <span className="offre-price">Sur demande</span>
                    </div>

                    <div className="offre-divider" />

                    <div className="offre-features">
                      {(pkg.features || []).map(f => (
                        <div key={f} className="offre-feature">
                          <CheckIcon dark={pkg.is_featured} />
                          <span className="offre-feature-text">{f}</span>
                        </div>
                      ))}
                      {(pkg.not_included || []).map(f => (
                        <div key={f} className="offre-feature offre-feature--excluded">
                          <CrossIcon />
                          <span className="offre-feature-text">{f}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={`https://wa.me/2250719956586?text=${encodeURIComponent(getWhatsAppMsg(pkg))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`offre-cta ${pkg.is_featured ? 'offre-cta--featured' : 'offre-cta--default'}`}
                    >
                      {pkg.cta} →
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {billing === 'oneoff' && (
            <motion.div
              key="oneoff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="oneoff-list">
                {oneoffs.map((p, i) => (
                  <motion.div
                    key={p.id || p.name}
                    className="oneoff-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * i }}
                  >
                    <div>
                      <p className="oneoff-name">{p.name}</p>
                      <p className="oneoff-detail">{p.description}</p>
                    </div>
                    <div>
                      <p className="oneoff-range">Sur devis</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="oneoff-cta-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div>
                  <p className="oneoff-cta-title">Vous avez un projet ?</p>
                  <p className="oneoff-cta-desc">Chaque projet est devise sur mesure selon vos besoins.</p>
                </div>
                <a href={`https://wa.me/2250719956586?text=${encodeURIComponent('Bonjour Naatal Studio 👋\n\nJ\'aimerais un devis pour un projet vidéo.\n\nType de projet : [à préciser]\nBudget estimé : [à préciser]\n\nMerci d\'avance !')}`} target="_blank" rel="noopener noreferrer" className="oneoff-cta-btn">
                  Demander un devis
                  <ArrowIcon />
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          className="offres-bottom"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="offres-bottom-terms">
            Acompte 50% · Contrat 3 mois min · Livraison rapide
          </p>
          <h3>Parlons de votre projet</h3>
          <p className="offres-bottom-sub">Reponse sous 24h · Devis gratuit</p>
          <a href={`https://wa.me/2250719956586?text=${encodeURIComponent('Bonjour Naatal Studio 👋\n\nJe souhaite discuter d\'un projet vidéo.\n\nDans l\'attente de votre retour !')}`} target="_blank" rel="noopener noreferrer" className="offres-bottom-cta">
            Nous contacter sur WhatsApp
            <ArrowIcon />
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
