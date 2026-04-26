import { useState } from 'react'
import { motion } from 'framer-motion'
import { messagesAPI } from '../services/api'
import './Contact.css'

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    
    const service = formData.get('service')
    const messageData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: (service ? `[Service: ${service}]\n\n` : '') + formData.get('message'),
      subject: service ? `Demande - ${service}` : 'Contact depuis le site web'
    }

    try {
      const response = await messagesAPI.send(messageData)
      
      if (response.success) {
        setSubmitStatus('success')
        e.target.reset()
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        throw new Error(response.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="contact">
      <div className="contact-bg-accent"></div>

      <motion.div 
        className="contact-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >

        <div className="contact-content">
          {/* Contact info side */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div>
                <h4>Email</h4>
                <a href="mailto:hello@naatalstudio.com">hello@naatalstudio.com</a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div>
                <h4>Téléphone</h4>
                <a href="tel:+2250719956586">+225 07 19 95 65 86</a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div>
                <h4>Localisation</h4>
                <span>Abidjan — Côte d'Ivoire</span>
              </div>
            </div>

           </motion.div>

          {/* Form side */}
          <motion.form
            className="contact-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="form-group">
              <label htmlFor="name">Nom et Prénom</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Votre nom et prénom"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+225 XX XX XX XX XX"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service">Service vidéo <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '12px' }}>(optionnel)</span></label>
              <select
                id="service"
                name="service"
                defaultValue="Projet personnalisé"
              >
                <option value="Projet personnalisé" className="option-custom">Définir son propre projet</option>
                <option value="Film Corporate Institutionnel">Film Corporate Institutionnel</option>
                <option value="Vidéo de Recrutement & Marque Employeur">Vidéo de Recrutement & Marque Employeur</option>
                <option value="Film de Lancement de Produit">Film de Lancement de Produit</option>
                <option value="Reportage d'Événement Corporate">Reportage d'Événement Corporate</option>
                <option value="Interview & Témoignage Client">Interview & Témoignage Client</option>
                <option value="Vidéo Pédagogique & Formation Interne">Vidéo Pédagogique & Formation Interne</option>
                <option value="Publicité Digitale Courte">Publicité Digitale Courte</option>
                <option value="Couverture de Chantier & Immobilier">Couverture de Chantier & Immobilier</option>
                <option value="Vidéo Publicitaire">Vidéo Publicitaire</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Décrivez votre projet..."
                rows="5"
                required
              ></textarea>
            </div>

            <motion.button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <span className="submit-loading">
                  <span className="submit-spinner"></span>
                  Envoi en cours...
                </span>
              ) : (
                <span className="submit-text">
                  Envoyer le Message
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              )}
            </motion.button>
            
            {submitStatus === 'success' && (
              <motion.div 
                className="submit-message success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Message envoyé avec succès ! Nous vous répondrons rapidement.
              </motion.div>
            )}
            
            {submitStatus === 'error' && (
              <motion.div 
                className="submit-message error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Erreur lors de l'envoi. Veuillez réessayer ou nous contacter directement.
              </motion.div>
            )}
          </motion.form>
        </div>
      </motion.div>
    </section>
  )
}
