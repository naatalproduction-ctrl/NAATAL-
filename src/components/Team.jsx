import { motion } from 'framer-motion'
import './Team.css'

export default function Team() {
  const teamMembers = [
    { name: 'Sophie Marchand', role: 'Directrice Créative', image: '👩‍🎬' },
    { name: 'Marc Dubois', role: 'Réalisateur Principal', image: '👨‍🎥' },
    { name: 'Émilie Leclerc', role: 'Chef Opératrice', image: '👩‍🔬' },
    { name: 'Thomas Rousseau', role: 'Monteur & Coloriste', image: '👨‍💻' },
    { name: 'Zoé Gauthier', role: 'Designer VFX', image: '👩‍🎨' },
    { name: 'Antoine Besson', role: 'Compositeur Sonore', image: '👨‍🎵' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  return (
    <section id="team" className="team">
      <motion.div 
        className="team-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="section-header">
          <h2>Notre Équipe</h2>
          <p>Les talents qui donnent vie à vos visions</p>
        </div>

        <motion.div 
          className="team-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {teamMembers.map((member, index) => (
            <motion.div key={index} className="team-member" variants={itemVariants} whileHover={{ y: -10 }}>
              <div className="member-avatar">
                <span>{member.image}</span>
                <div className="avatar-bg"></div>
              </div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
              <div className="member-line"></div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
