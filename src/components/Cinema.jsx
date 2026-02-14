import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cinemaAPI } from '../services/api'
import './Cinema.css'

export default function Cinema() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await cinemaAPI.getPublished()
        if (response.success) {
          setProjects(response.data)
        } else {
          setError('Impossible de charger les films')
        }
      } catch (err) {
        console.error('Erreur chargement cinema:', err)
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <section id="cinema" className="cinema">
      <div className="cinema-background">
        <video autoPlay muted loop playsInline className="cinema-video">
          <source src="/videos/cinema-bg.mp4" type="video/mp4" />
        </video>
        <div className="cinema-overlay"></div>
      </div>

      <motion.div
        className="cinema-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="cinema-header"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.img
            src="/img/Logo 2.png"
            alt="NAATAL Prod"
            className="cinema-logo"
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          />
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Cinéma
          </motion.h1>
        </motion.div>

        {loading && (
          <div className="cinema-loading">
            <div className="loading-spinner"></div>
            <p>Chargement des films...</p>
          </div>
        )}

        {error && (
          <div className="cinema-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="cinema-empty">
            <p>Aucun film disponible pour le moment.</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="cinema-projects">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="cinema-project"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                {project.cover_url && (
                  <div className="project-cover">
                    <img 
                      src={project.cover_url} 
                      alt={project.title}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="project-info">
                  <div className="project-number">
                    <span>0{index + 1}</span>
                  </div>
                  <div className="project-content">
                    <div className="project-meta">
                      <span className="project-year">{project.year}</span>
                      <span className="project-genre">{project.genre}</span>
                      <span className="project-duration">{project.duration}</span>
                    </div>
                    <h2>{project.title}</h2>
                    <p className="project-director">Réalisation: {project.director}</p>
                    <p className="project-description">{project.description}</p>
                    <div className="project-buttons">
                      {project.trailer_url && (
                        <motion.a
                          href={project.trailer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-btn"
                          whileHover={{ scale: 1.05, x: 10 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Voir le Trailer
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </motion.a>
                      )}
                      {project.video_url ? (
                        <motion.a
                          href={project.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-btn"
                          whileHover={{ scale: 1.05, x: 10 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Découvrir le Film
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </motion.a>
                      ) : (
                        <motion.button
                          className="project-btn disabled"
                          disabled
                          whileHover={{ scale: 1 }}
                        >
                          Bientôt disponible
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Contact Cinéma */}
        <motion.div
          className="cinema-contact"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3>Contact</h3>
          <div className="cinema-contact-info">
            <a href="mailto:naatalproduction@gmail.com" className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>naatalproduction@gmail.com</span>
            </a>
            <a href="tel:+2250749684645" className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>+225 07 49 68 46 45</span>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
