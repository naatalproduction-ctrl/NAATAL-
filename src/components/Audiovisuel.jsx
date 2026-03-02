import { motion } from 'framer-motion'
import { useSite } from '../context/SiteContext'
import './Audiovisuel.css'

export default function Audiovisuel() {
  const { categories, loading } = useSite()

  const categoryConfig = {
    publicite: {
      title: 'Publicite',
      description: 'Creation de publicites cinematiques et digitales qui captivent et convertissent votre audience.',
    },
    documentaire: {
      title: 'Documentaire',
      description: 'Production de documentaires authentiques qui donnent vie a des recits inspirants et meconnus.',
    },
    corporate: {
      title: 'Corporate',
      description: 'Films institutionnels et videos d\'entreprise qui valorisent votre image de marque.',
    }
  }

  const displayOrder = ['documentaire', 'corporate', 'publicite']

  // Only show categories that have real videos
  const displayCategories = displayOrder.map(slug => {
    const dbCategory = categories.find(c => c.slug === slug)
    const config = categoryConfig[slug]
    if (!config) return null

    const medias = dbCategory?.medias || []
    if (medias.length === 0) return null

    return { ...config, slug, medias }
  }).filter(Boolean)

  // Collect all videos flat for the showcase
  const allMedias = displayCategories.flatMap(c =>
    c.medias.map(m => ({ ...m, categoryTitle: c.title }))
  )

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
          <span className="audiovisuel-label">Nos Realisations</span>
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
            Productions video innovantes qui transforment votre vision en realite
          </motion.p>
        </motion.div>

        {/* Video Showcase Grid */}
        <div className={`audiovisuel-grid audiovisuel-grid--${Math.min(allMedias.length, 4)}`}>
          {allMedias.map((media, index) => (
            <motion.div
              key={media.id}
              className={`audiovisuel-card ${index === 0 ? 'audiovisuel-card--featured' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 * index }}
              viewport={{ once: true }}
            >
              <div className="audiovisuel-card-video">
                {media.type === 'youtube' ? (
                  <iframe
                    src={media.url}
                    title={media.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    onLoadedData={(e) => e.target.play().catch(() => {})}
                  >
                    <source src={media.url} type="video/mp4" />
                  </video>
                )}
              </div>
              <div className="audiovisuel-card-info">
                <span className="audiovisuel-card-tag">{media.categoryTitle}</span>
                <h3>{media.name}</h3>
                {media.description && <p>{media.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category descriptions below */}
        {displayCategories.length > 1 && (
          <div className="audiovisuel-services">
            {displayCategories.map((category, index) => (
              <motion.div
                key={category.slug}
                className="audiovisuel-service"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <span className="audiovisuel-service-num">0{index + 1}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="audiovisuel-service-count">
                  {category.medias.length} realisation{category.medias.length > 1 ? 's' : ''}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
