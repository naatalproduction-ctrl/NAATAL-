import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './FAQ.css'

const faqData = [
  {
    question: 'Où se trouve NAATAL Studio à Abidjan ?',
    answer: 'Naatal Production est basé à Abidjan, Côte d\'Ivoire.',
  },
  {
    question: 'Quels types de vidéos réalisez-vous ?',
    answer: 'Nous réalisons des films corporate et institutionnels, des publicités vidéo et spots TV, des clips musicaux, des documentaires, des couvertures événementielles, des vidéos drone pour la promotion immobilière, du motion design et du montage professionnel.',
  },
  {
    question: 'Proposez-vous des packages vidéos pour des entreprises ?',
    answer: 'Nous proposons plusieurs formules : le Package Essentiel (2 vidéos courtes par mois), le Package Corporate (4 vidéos par mois avec habillage graphique) et le Package Premium (6 à 8 vidéos avec motion design et version bilingue). Contactez-nous pour un devis adapté à votre projet.',
  },
  {
    question: 'Intervenez-vous en dehors d\'Abidjan ?',
    answer: 'Oui, bien que basés à Abidjan, nous nous déplaçons dans toute la Côte d\'Ivoire et en Afrique de l\'Ouest pour vos projets de production audiovisuelle.',
  },
  {
    question: 'Quel est le délai de livraison d\'une vidéo ?',
    answer: 'Les délais varient selon le type de projet. Une vidéo courte peut être livrée en 5 à 7 jours ouvrés, un film corporate en 2 à 3 semaines. Nous définissons ensemble un planning précis dès le lancement du projet.',
  },
  {
    question: 'Comment vous contacter pour un projet vidéo ?',
    answer: 'Vous pouvez nous joindre par téléphone ou WhatsApp au +225 07 19 95 65 86, par email à hello@naatalstudio.com, ou directement via le formulaire de contact sur notre site.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

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
