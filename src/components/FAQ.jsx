import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSite } from '../context/SiteContext'
import { BUSINESS, buildFaq } from '../data/site'
import './FAQ.css'

export default function FAQ() {
  const { siteInfo } = useSite()
  const [openIndex, setOpenIndex] = useState(null)
  const faqData = buildFaq({
    email: siteInfo.email || BUSINESS.email,
    phone: siteInfo.phone || BUSINESS.phone,
  })

  return (
    <section id="faq" className="faq">
      <motion.div
        className="faq-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <span className="faq-label">Questions fréquentes</span>
        <h2 className="faq-title">
          Tout savoir sur la production audiovisuelle à Abidjan
        </h2>

        <div className="faq-list">
          {faqData.map((item, index) => (
            <motion.div
              key={index}
              className={`faq-item ${openIndex === index ? 'faq-item--open' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 * index }}
              viewport={{ once: true }}
            >
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                <svg
                  className={`faq-chevron ${openIndex === index ? 'faq-chevron--open' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
