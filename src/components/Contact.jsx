import { motion } from 'framer-motion'
import './Contact.css'

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <section id="contact" className="contact">
      <motion.div 
        className="contact-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="contact-content">
          <motion.div 
            className="contact-text"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Travaillons Ensemble</h2>
            <p>Vous avez un projet cinématographique ou audiovisuel ? Contactez nos équipes pour discuter de votre vision.</p>
            
            <div className="contact-info">
              <motion.div className="info-item" whileHover={{ x: 10 }}>
                <span className="info-icon">📧</span>
                <div>
                  <h4>Email</h4>
                  <p>contact@naatal.fr</p>
                </div>
              </motion.div>
              
              <motion.div className="info-item" whileHover={{ x: 10 }}>
                <span className="info-icon">📱</span>
                <div>
                  <h4>Téléphone</h4>
                  <p>+33 (0)1 23 45 67 89</p>
                </div>
              </motion.div>
              
              <motion.div className="info-item" whileHover={{ x: 10 }}>
                <span className="info-icon">📍</span>
                <div>
                  <h4>Adresse</h4>
                  <p>Paris, France</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.form 
            className="contact-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="form-group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.2 }}
            >
              <input type="text" placeholder="Votre nom" required />
            </motion.div>
            
            <motion.div 
              className="form-group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.3 }}
            >
              <input type="email" placeholder="Votre email" required />
            </motion.div>
            
            <motion.div 
              className="form-group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.4 }}
            >
              <textarea placeholder="Décrivez votre projet" rows="5" required></textarea>
            </motion.div>
            
            <motion.button 
              type="submit"
              className="submit-btn"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Envoyer le Message
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </section>
  )
}
