import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { boutiqueAPI } from '../services/api'
import './Boutique.css'

export default function Boutique() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await boutiqueAPI.getActive()
        if (response.success) {
          setProducts(response.data)
        } else {
          setError('Impossible de charger les produits')
        }
      } catch (err) {
        console.error('Erreur chargement boutique:', err)
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Format price with currency
  const formatPrice = (price, currency = 'EUR') => {
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return price
    return `${numPrice.toFixed(0)}${currency === 'EUR' ? '€' : currency}`
  }

  return (
    <section id="boutique" className="boutique">
      <div className="boutique-background">
        <div className="boutique-overlay"></div>
      </div>

      <Link to="/" className="back-to-site">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Retour
      </Link>

      <motion.div
        className="boutique-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="boutique-header"
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
            Boutique NAATAL
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Outils professionnels pour créateurs visuels
          </motion.p>
        </motion.div>

        {loading && (
          <div className="boutique-loading">
            <div className="loading-spinner"></div>
            <p>Chargement des produits...</p>
          </div>
        )}

        {error && (
          <div className="boutique-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="boutique-empty">
            <p>Aucun produit disponible pour le moment.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="boutique-products">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                className="product-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.2 }}
                viewport={{ once: true }}
                style={{ backgroundColor: product.color || 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="product-image">
                  {product.image_url && !product._imgError ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      onError={() => {
                        product._imgError = true;
                        setProducts(prev => [...prev]);
                      }}
                    />
                  ) : (
                    <div className="product-placeholder">
                      <span className="product-name">{product.name}</span>
                    </div>
                  )}
                </div>

                <div className="product-content">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span className="product-price">{formatPrice(product.price, product.currency)}</span>
                  </div>

                  <p className="product-description">{product.description}</p>

                  {product.features && product.features.length > 0 && (
                    <ul className="product-features">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {product.purchase_url ? (
                    <motion.a
                      href={product.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="product-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Acheter maintenant
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7"/>
                      </svg>
                    </motion.a>
                  ) : (
                    <motion.button
                      className="product-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Bientôt disponible
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7"/>
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          className="boutique-footer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <p>Livraison instantanée • Support 24/7 • Garantie satisfait</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
