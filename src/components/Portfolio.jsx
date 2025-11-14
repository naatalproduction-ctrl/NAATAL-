import { motion } from 'framer-motion'
import './Portfolio.css'

export default function Portfolio() {
  const projects = [
    { title: 'Cinéma d\'Auteur', category: 'Long Métrage', image: '🎬', description: 'Fiction dramatique explorant les méandres de l\'âme humaine' },
    { title: 'Campagne Publicitaire', category: 'Spot Commercial', image: '📺', description: 'Production premium pour marque de luxe' },
    { title: 'Documentaire Poétique', category: 'Documentation', image: '🎥', description: 'Exploration visuelle d\'un univers contemporain' },
    { title: 'Clip Musical', category: 'Music Video', image: '🎵', description: 'Création audiovisuelle avec choreography VFX' },
    { title: 'Contenu Web', category: 'Digital', image: '✨', description: 'Série de contenus couriformats haute qualité' },
    { title: 'Événementiel', category: 'Live Streaming', image: '🎞️', description: 'Captation et production en direct' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  return (
    <section id="portfolio" className="portfolio">
      <motion.div 
        className="portfolio-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="section-header">
          <h2>Notre Portfolio</h2>
          <p>Découvrez nos réalisations et projets de prestige</p>
        </div>

        <motion.div 
          className="portfolio-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {projects.map((project, index) => (
            <motion.div key={index} className="portfolio-item" variants={itemVariants} whileHover={{ y: -15 }}>
              <div className="portfolio-image">
                <span className="portfolio-icon">{project.image}</span>
                <div className="portfolio-overlay">
                  <button className="view-btn">Voir le projet</button>
                </div>
              </div>
              <div className="portfolio-info">
                <span className="portfolio-category">{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
