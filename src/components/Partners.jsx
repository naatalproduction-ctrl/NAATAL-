import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { partnersAPI } from '../services/api'
import './Partners.css'

export default function Partners() {
  const [partners, setPartners] = useState([])

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await partnersAPI.getActive()
        if (response.success) {
          setPartners(response.data)
        }
      } catch (err) {
        // silent
      }
    }
    fetchPartners()
  }, [])

  if (partners.length === 0) return null

  const getLogoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'
    return `${baseUrl}${url}`
  }

  // Double the list for infinite scroll effect
  const duplicated = [...partners, ...partners]

  return (
    <section className="partners">
      <motion.div
        className="partners-container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <span className="partners-label">Ils nous font confiance</span>
        <h2 className="partners-title">Nos Partenaires</h2>

        <div className="partners-track-wrapper">
          <div className="partners-track">
            {duplicated.map((partner, index) => (
              <div key={`${partner.id}-${index}`} className="partners-item">
                {partner.website_url ? (
                  <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getLogoUrl(partner.logo_url)}
                      alt={partner.name}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <img
                    src={getLogoUrl(partner.logo_url)}
                    alt={partner.name}
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
