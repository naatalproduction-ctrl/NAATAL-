import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { offresAPI } from '../services/api'
import './Offres.css'

const WA_NUMBER = '2250719956586'

const WA_MESSAGES = {
  essentiel: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *Essentiel* (300 000 FCFA/mois).\n\nVoici ce que j'aimerais savoir :\n→ Disponibilités pour démarrer\n→ Processus de démarrage\n→ Modalités de paiement\n\nDans l'attente de votre retour 🙏"
  ),
  corporate: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *Corporate* (700 000 FCFA/mois).\n\nMon entreprise : [à préciser]\nMon besoin : production vidéo mensuelle régulière\n\nJ'aimerais qu'on discute de :\n→ Le contenu du package en détail\n→ Les disponibilités pour un premier tournage\n→ La signature du contrat\n\nMerci d'avance 🙏"
  ),
  premium: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le package *Premium* (1 100 000 FCFA/mois).\n\nStructure : [à préciser]\nVolume estimé : 6 à 8 vidéos / mois\n\nJ'aimerais organiser une réunion pour discuter de :\n→ Notre stratégie de contenu vidéo\n→ Le planning de production sur 3 mois\n→ Les modalités contractuelles\n\nDans l'attente de votre retour 🙏"
  ),
  devis: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe souhaite obtenir un devis pour un projet ponctuel.\n\nType de projet : [à préciser]\nDate souhaitée : [à préciser]\nBudget estimé : [à préciser]\n\nMerci de me recontacter 🙏"
  ),
  contact: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe souhaite discuter d'un projet vidéo avec votre équipe.\n\nDans l'attente de votre retour 🙏"
  ),
  brandfilm: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le *Naatal Brand Film* (film corporate signature, 2-3 min).\n\nMon entreprise : [à préciser]\nObjectif : carte de visite vidéo annuelle\n\nJ'aimerais discuter de :\n→ Le concept créatif\n→ Le planning de tournage\n→ Le devis détaillé (3 à 5M FCFA)\n\nMerci 🙏"
  ),
  event: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe suis intéressé(e) par le *Naatal Event Coverage* (captation événement + livrables différés).\n\nÉvénement : [à préciser]\nDate : [à préciser]\nLieu : [à préciser]\n\nLivrables souhaités :\n→ Aftermovie 90s\n→ 3 capsules speakers\n→ Interviews & témoignages\n\nMerci de me revenir avec un devis (1,5 à 4M FCFA) 🙏"
  ),
  surmesure: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe souhaite discuter d'une *production sur-mesure* (au-delà de vos formules).\n\nNature du projet : [à préciser]\nDurée / ampleur : [à préciser]\nLieu(x) : [à préciser]\n\nJ'aimerais qu'on échange pour :\n→ Étudier le projet ensemble\n→ Recevoir un chiffrage personnalisé\n\nMerci 🙏"
  ),
  echange: encodeURIComponent(
    "Bonjour Naatal Studio 👋\n\nJe souhaite réserver un échange de 20 minutes pour identifier la formule adaptée à mon projet.\n\nMon entreprise : [à préciser]\nMon besoin : [à préciser]\nDisponibilités : [à préciser]\n\nMerci 🙏"
  ),
}

const waLink = (key) => `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGES[key]}`

const FALLBACK_PACKAGES = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    target: 'PME & Startups',
    price: 300000,
    period: '/ mois',
    featured: false,
    description: "L'entrée idéale pour une présence vidéo régulière et professionnelle.",
    features: [
      '2 vidéos courtes / mois (30–90s)',
      'Tournage 1 jour',
      'Montage + sous-titres',
      '1 format livré (vertical ou horizontal)',
      'Livraison sous 5 jours',
      '2 révisions incluses',
    ],
    notIncluded: ['Multi-caméra', 'Motion design', 'Version anglaise'],
    cta: 'Démarrer',
    waKey: 'essentiel',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    target: 'Entreprises mid-size',
    price: 700000,
    period: '/ mois',
    featured: true,
    description: 'Le package préféré des directions marketing. Visibilité et récurrence.',
    features: [
      '4 vidéos / mois (mix courts + moyen formats)',
      'Tournage 2 jours',
      'Montage pro + habillage graphique',
      '2 formats livrés (vertical + horizontal)',
      '1 vidéo institutionnelle / trimestre',
      'Livraison sous 4 jours',
      '3 révisions incluses',
    ],
    notIncluded: ['Version anglaise'],
    cta: 'Choisir Corporate',
    waKey: 'corporate',
  },
  {
    id: 'premium',
    name: 'Premium',
    target: 'Grandes entreprises & Institutions',
    price: 1100000,
    period: '/ mois',
    featured: false,
    description: 'Une présence cinématographique complète. Pour ceux qui veulent dominer.',
    features: [
      '6–8 vidéos / mois',
      'Tournage multi-caméra inclus',
      'Montage cinématique + motion design',
      'Tous formats livrés',
      'Version française + anglaise',
      '1 film corporate long format / trimestre',
      'Priorité planning · Livraison 3 jours',
      'Révisions illimitées',
    ],
    notIncluded: [],
    cta: 'Choisir Premium',
    waKey: 'premium',
  },
]

const signatureOffers = [
  {
    id: 'brandfilm',
    name: 'Naatal Brand Film',
    tagline: 'Film corporate signature',
    description:
      "Le film qui définit votre marque pour les 12 prochains mois. 2 à 3 minutes de cinéma pour incarner qui vous êtes, ce que vous faites, et pourquoi ça compte.",
    features: [
      'Film 2–3 min · qualité cinéma (FX3 + optiques Sigma Art)',
      'Direction artistique et écriture sur mesure',
      'Multi-caméra · drone · habillage sonore',
      'Versions web, corporate et réseaux sociaux',
      'Livraison 4 à 6 semaines après tournage',
    ],
    assurance: 'Devis ferme · acompte 40% · solde à livraison',
    range: '3 000 000 – 5 000 000',
    waKey: 'brandfilm',
  },
  {
    id: 'event',
    name: 'Naatal Event Coverage',
    tagline: 'Captation événement corporate',
    description:
      "Votre événement, capturé avec œil cinéma et livré sans délai. Aftermovie qui circule sur LinkedIn dès la semaine suivante, capsules speakers prêtes à publier, témoignages clients exploitables toute l'année.",
    features: [
      'Captation multi-caméra · jusqu’à 8h sur site',
      'Aftermovie 90 secondes livré sous 5 jours',
      '3 capsules speakers individuelles',
      'Interviews et témoignages clients (jusqu’à 5)',
      'Photos extraites en bonus',
    ],
    assurance: 'Événement 1 journée · journées additionnelles sur devis · backup matériel inclus',
    range: '1 500 000 – 4 000 000',
    waKey: 'event',
  },
  {
    id: 'surmesure',
    name: 'Production sur-mesure',
    tagline: 'Au-delà des formules',
    description:
      "Films institutionnels longs, séries documentaires, campagnes multi-épisodes, productions hors Abidjan. Quand votre projet sort du cadre, on construit l'offre avec vous.",
    features: [
      'Étude de projet et chiffrage personnalisé',
      'Équipe dédiée selon ampleur',
      'Production multi-jours et multi-sites possibles',
      'Tous livrables et formats négociés au brief',
    ],
    assurance: 'Premier échange offert · devis sous 5 jours ouvrés',
    range: 'Sur devis',
    custom: true,
    waKey: 'surmesure',
  },
]

const FALLBACK_ONEOFFS = [
  { name: 'Film institutionnel', detail: '3–5 min · multi-cam · habillage', range: '500 000 – 1 200 000' },
  { name: 'Couverture événement corporate', detail: 'Régie multi-caméra · montage J+2', range: '300 000 – 700 000' },
  { name: 'Film de lancement produit', detail: 'Scénario + tournage + montage cinématique', range: '400 000 – 900 000' },
  { name: 'Série testimonials (×3)', detail: 'Tournage 1 jour · 3 vidéos livrées', range: '250 000 – 450 000' },
  { name: 'Vidéo formation / e-learning', detail: 'Script + tournage + sous-titres', range: '350 000 – 750 000' },
  { name: 'Film immobilier / promotion', detail: 'Drone + terrain + montage', range: '400 000 – 800 000' },
]

const slugify = (s = '') =>
  s.toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')

const resolveWaKey = (name) => {
  const slug = slugify(name)
  if (WA_MESSAGES[slug]) return slug
  return 'devis'
}

const normalizePackage = (row) => ({
  id: row.id,
  name: row.name,
  target: row.target || '',
  price: Number(row.price) || 0,
  period: row.period || '/ mois',
  featured: !!row.is_featured,
  description: row.description || '',
  features: Array.isArray(row.features) ? row.features : [],
  notIncluded: Array.isArray(row.not_included) ? row.not_included : [],
  cta: row.cta || 'Choisir',
  waKey: resolveWaKey(row.name),
})

const normalizeOneoff = (row) => ({
  name: row.name,
  detail: row.description || '',
  range: row.period || '',
})

export default function Offres() {
  const [billing, setBilling] = useState('monthly')
  const [apiData, setApiData] = useState(null)

  useEffect(() => {
    let cancelled = false
    offresAPI.getActive()
      .then(res => {
        if (cancelled) return
        if (res?.success && Array.isArray(res.data)) setApiData(res.data)
      })
      .catch(err => console.warn('Offres API:', err?.message || err))
    return () => { cancelled = true }
  }, [])

  const packages = useMemo(() => {
    if (!apiData) return FALLBACK_PACKAGES
    const rows = apiData.filter(o => o.type === 'package').map(normalizePackage)
    return rows.length ? rows : FALLBACK_PACKAGES
  }, [apiData])

  const oneoffs = useMemo(() => {
    if (!apiData) return FALLBACK_ONEOFFS
    const rows = apiData.filter(o => o.type === 'oneoff').map(normalizeOneoff)
    return rows.length ? rows : FALLBACK_ONEOFFS
  }, [apiData])

  return (
    <section id="offres" className="offres-v2">
      {/* Header */}
      <motion.div
        className="offres-v2-hero"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <span className="offres-v2-label">NOS OFFRES</span>
        <h2 className="offres-v2-title">
          Des images qui travaillent<br />
          <span>pour votre entreprise</span>
        </h2>
        <p className="offres-v2-desc">
          Packages mensuels ou projets ponctuels — choisissez la formule
          adaptée à vos ambitions.
        </p>

        <div className="offres-v2-toggle">
          {['monthly', 'oneoff', 'plus'].map(b => (
            <button
              key={b}
              className={`offres-v2-toggle-btn ${billing === b ? 'offres-v2-toggle-btn--active' : ''}`}
              onClick={() => setBilling(b)}
            >
              {b === 'monthly' ? 'ABONNEMENT' : b === 'oneoff' ? 'PROJET PONCTUEL' : 'PLUS'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Packages */}
      <AnimatePresence mode="wait">
        {billing === 'monthly' && (
          <motion.div
            key="monthly"
            className="offres-v2-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                className={`offres-v2-card ${pkg.featured ? 'offres-v2-card--featured' : ''}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 * i }}
              >
                {pkg.featured && (
                  <div className="offres-v2-badge">LE PLUS POPULAIRE</div>
                )}

                <div className="offres-v2-card-target">{pkg.target.toUpperCase()}</div>
                <h3 className="offres-v2-card-name">{pkg.name}</h3>
                <p className="offres-v2-card-desc">{pkg.description}</p>

                <div className="offres-v2-card-price">
                  <span className="offres-v2-price-prefix">À partir de</span>
                  <span className="offres-v2-price-value">
                    {new Intl.NumberFormat('fr-FR').format(pkg.price)} FCFA
                  </span>
                  <span className="offres-v2-price-period">{pkg.period}</span>
                </div>

                <div className="offres-v2-divider" />

                <div className="offres-v2-features">
                  {pkg.features.map(f => (
                    <div key={f} className="offres-v2-feature">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="offres-v2-feature-icon">
                        <circle cx="7" cy="7" r="7" fill={pkg.featured ? '#000' : 'rgba(255,255,255,0.08)'} />
                        <path d="M4 7l2 2 4-4" stroke={pkg.featured ? '#fff' : '#aaa'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{f}</span>
                    </div>
                  ))}
                  {pkg.notIncluded.map(f => (
                    <div key={f} className="offres-v2-feature offres-v2-feature--excluded">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="offres-v2-feature-icon">
                        <path d="M4 4l6 6M10 4l-6 6" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={waLink(pkg.waKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`offres-v2-cta ${pkg.featured ? 'offres-v2-cta--featured' : ''}`}
                >
                  {pkg.cta} →
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}

        {billing === 'oneoff' && (
          <motion.div
            key="oneoff"
            className="offres-v2-oneoff-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="offres-v2-oneoff-list">
              {oneoffs.map((p, i) => (
                <motion.div
                  key={p.name}
                  className="offres-v2-oneoff-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 * i }}
                >
                  <div>
                    <p className="offres-v2-oneoff-name">{p.name}</p>
                    <p className="offres-v2-oneoff-detail">{p.detail}</p>
                  </div>
                  <div className="offres-v2-oneoff-price">
                    <p className="offres-v2-oneoff-range">{p.range}</p>
                    <p className="offres-v2-oneoff-unit">FCFA</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="offres-v2-oneoff-cta-card">
              <div>
                <p className="offres-v2-oneoff-cta-title">Vous avez un projet ?</p>
                <p className="offres-v2-oneoff-cta-desc">Chaque projet est devisé sur mesure selon vos besoins.</p>
              </div>
              <a href={waLink('devis')} target="_blank" rel="noopener noreferrer" className="offres-v2-oneoff-cta-btn">
                Demander un devis →
              </a>
            </div>
          </motion.div>
        )}
        {billing === 'plus' && (
          <motion.div
            key="plus"
            className="offres-v2-autres-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {signatureOffers.map((offer, i) => (
              <motion.div
                key={offer.id}
                className="offres-v2-autres-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <div className="offres-v2-autres-card-head">
                  <p className="offres-v2-autres-card-tag">{offer.tagline}</p>
                  <h4 className="offres-v2-autres-card-name">{offer.name}</h4>
                </div>
                <p className="offres-v2-autres-card-desc">{offer.description}</p>

                <ul className="offres-v2-autres-card-list">
                  {offer.features.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                {offer.assurance && (
                  <p className="offres-v2-autres-card-assurance">{offer.assurance}</p>
                )}

                <div className="offres-v2-autres-card-foot">
                  <div className="offres-v2-autres-card-price">
                    <span className="offres-v2-autres-card-range">{offer.range}</span>
                    {!offer.custom && (
                      <span className="offres-v2-autres-card-unit">FCFA{offer.period ? ` ${offer.period}` : ''}</span>
                    )}
                  </div>
                  <a
                    href={waLink(offer.waKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="offres-v2-autres-card-cta"
                  >
                    Discuter →
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <motion.div
        className="offres-v2-bottom"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <p className="offres-v2-bottom-terms">SANS ENGAGEMENT · ÉCHANGE DE 20 MINUTES</p>
        <h3>Vous hésitez entre les deux ?</h3>
        <p className="offres-v2-bottom-sub">
          Parlons-en. Un échange de 20 minutes suffit pour identifier la formule
          qui correspond à votre rythme, votre budget et vos ambitions.
        </p>
        <a href={waLink('echange')} target="_blank" rel="noopener noreferrer" className="offres-v2-bottom-cta">
          Réserver un échange →
        </a>
      </motion.div>
    </section>
  )
}
