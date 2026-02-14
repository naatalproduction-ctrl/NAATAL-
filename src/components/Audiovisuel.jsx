import { motion } from 'framer-motion'
import { useSite } from '../context/SiteContext'
import './Audiovisuel.css'

export default function Audiovisuel() {
  const { categories, loading } = useSite()

  // Mapper les catégories de la DB aux données d'affichage
  const categoryConfig = {
    publicite: {
      title: "Publicité",
      subtitle: "Campagnes d'impact",
      description: "Création de publicités cinématiques et digitales qui captivent et convertissent votre audience.",
      color: "rgba(236, 72, 153, 0.2)"
    },
    documentaire: {
      title: "Documentaire",
      subtitle: "Histoires vraies",
      description: "Production de documentaires authentiques qui donnent vie à des récits inspirants et méconnus.",
      color: "rgba(139, 92, 246, 0.2)"
    },
    corporate: {
      title: "Corporate",
      subtitle: "Communication d'entreprise",
      description: "",
      color: "rgba(59, 130, 246, 0.2)"
    }
  }

  // Ordre d'affichage souhaité
  const displayOrder = ['documentaire', 'corporate', 'publicite']

  // Construire les catégories avec les médias de la DB
  const displayCategories = displayOrder.map(slug => {
    const dbCategory = categories.find(c => c.slug === slug)
    const config = categoryConfig[slug]
    
    if (!config) return null

    return {
      ...config,
      slug,
      medias: dbCategory?.medias || []
    }
  }).filter(Boolean)

  return (
    <section id="audiovisuel" className="audiovisuel">
      <div className="audiovisuel-background">
        <video autoPlay muted loop playsInline className="audiovisuel-video">
          <source src="/videos/audiovisuel-bg.mp4" type="video/mp4" />
        </video>
        <div className="audiovisuel-overlay"></div>
      </div>

      <motion.div
        className="audiovisuel-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="audiovisuel-header"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Audiovisuel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Productions vidéo innovantes qui transforment votre vision en réalité
          </motion.p>
        </motion.div>

        <div className="audiovisuel-categories">
          {displayCategories.map((category, index) => (
            <motion.div
              key={category.slug}
              className="audiovisuel-category"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.2 }}
              viewport={{ once: true }}
            >
              {/* Affichage des vidéos */}
              {category.medias.length > 1 ? (
                // Grille pour plusieurs vidéos
                <div className="category-videos-grid">
                  {category.medias.slice(0, 4).map((media, vidIndex) => (
                    <div 
                      key={media.id} 
                      className="category-video-item" 
                      style={{ backgroundColor: category.color }}
                    >
                      {media.type === 'youtube' ? (
                        <div className="youtube-container">
                          <iframe
                            src={media.url}
                            title={media.name}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="youtube-iframe"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="video-placeholder">
                            <div className="loading-spinner"></div>
                            <span className="loading-text">Chargement...</span>
                            <span className="video-name">{media.name}</span>
                          </div>
                          <video
                            muted
                            loop
                            playsInline
                            preload="none"
                            onError={(e) => {
                              const placeholder = e.target.parentElement.querySelector('.video-placeholder')
                              if (placeholder) {
                                placeholder.querySelector('.loading-text').textContent = 'Erreur de chargement'
                                placeholder.querySelector('.loading-spinner').style.display = 'none'
                              }
                            }}
                            onLoadedData={(e) => {
                              const placeholder = e.target.parentElement.querySelector('.video-placeholder')
                              if (placeholder) {
                                placeholder.style.display = 'none'
                              }
                              e.target.play().catch(err => console.log('Autoplay failed:', err))
                            }}
                          >
                            <source src={media.url} type="video/mp4" />
                          </video>
                        </>
                      )}
                      <div className="category-video-overlay">
                        <span className="video-title">{media.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Une seule vidéo
                <div className="category-video" style={{ backgroundColor: category.color }}>
                  {category.medias[0] ? (
                    category.medias[0].type === 'youtube' ? (
                      <div className="youtube-container">
                        <iframe
                          src={category.medias[0].url}
                          title={category.medias[0].name}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="youtube-iframe"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="video-placeholder">
                          <div className="loading-spinner"></div>
                          <span className="loading-text">Chargement...</span>
                        </div>
                        <video
                          muted
                          loop
                          playsInline
                          preload="none"
                          onLoadedData={(e) => {
                            const placeholder = e.target.parentElement.querySelector('.video-placeholder')
                            if (placeholder) {
                              placeholder.style.display = 'none'
                            }
                            e.target.play().catch(err => console.log('Autoplay failed:', err))
                          }}
                        >
                          <source src={category.medias[0].url} type="video/mp4" />
                        </video>
                      </>
                    )
                  ) : (
                    <div className="video-placeholder">
                      <span className="loading-text">Aucune vidéo</span>
                    </div>
                  )}
                  <div className="category-video-overlay"></div>
                </div>
              )}

              <div className="category-content">
                <div className="category-number">
                  <span>0{index + 1}</span>
                </div>

                <h2>{category.title}</h2>
                <p className="category-description">{category.description}</p>

                <motion.button
                  className="category-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir nos Réalisations
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <polygon points="10 8 13 11 10 14"></polygon>
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
