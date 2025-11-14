import { motion } from 'framer-motion'
import './Services.css'

export default function Services() {
  const services = [
    { icon: '🎬', title: 'Production Cinématographique', description: 'Création de contenus cinématographiques de haute qualité avec expertise technique et créative' },
    { icon: '📺', title: 'Production Audiovisuelle', description: 'Du concept à la réalisation, nous produisons des contenus audiovisuels innovants et captivants' },
    { icon: '✨', title: 'Post-Production', description: 'Montage, étalonnage, effets spéciaux et animation pour sublimer votre production' },
    { icon: '🎥', title: 'Réalisation Créative', description: 'Réalisation de spots publicitaires, documentaires et contenus web sur mesure' },
    { icon: '🎞️', title: 'Colorimétrie & VFX', description: 'Étalonnage professionnel et effets visuels époustouflants pour votre projet' },
    { icon: '🎵', title: 'Design Sonore', description: 'Sound design et composition musicale pour une immersion totale' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  return (
    <section id="services" className="services">
      <motion.div 
        className="services-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="section-header">
          <h2>Nos Services</h2>
          <p>Une gamme complète de services audiovisuels et cinématographiques</p>
        </div>

        <motion.div 
          className="services-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="service-card"
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.1)' }}
            >
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="card-border"></div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
