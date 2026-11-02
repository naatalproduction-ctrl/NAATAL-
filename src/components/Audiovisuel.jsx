import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSite } from '../context/SiteContext'
import { VIDEO_DESCRIPTIONS, getYouTubeId } from '../data/site'
import './Audiovisuel.css'

function VideoCard({ media, index }) {
  const [playing, setPlaying] = useState(false)
  const videoId = getYouTubeId(media.url)
  const thumbnail = media.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null)
  const isEven = index % 2 === 0

  return (
    <motion.div
      className={`av-item ${isEven ? 'av-item--left' : 'av-item--right'}`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* Number */}
      <div className="av-item-number">
        <span>0{index + 1}</span>
      </div>

      {/* Video */}
      <div className="av-item-player">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=1`}
            title={media.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="av-item-thumb" onClick={() => setPlaying(true)}>
            {thumbnail && <img src={thumbnail} alt={media.name} loading="lazy" />}
            <div className="av-item-play">
              <div className="av-play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="av-item-gradient" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="av-item-info">
        <h3>{media.name}</h3>
        <p className="av-item-desc">{media.description || VIDEO_DESCRIPTIONS[videoId] || ''}</p>
      </div>
    </motion.div>
  )
}

export default function Audiovisuel() {
  const { medias } = useSite()

  return (
    <section id="audiovisuel" className="audiovisuel">
      <div className="audiovisuel-background">
        <video autoPlay muted loop playsInline className="audiovisuel-video">
          <source src="/videos/audiovisuel-bg.mp4" type="video/mp4" />
        </video>
        <div className="audiovisuel-overlay"></div>
      </div>

      <motion.div
        className="av-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        {/* Header */}
        <motion.div
          className="av-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="av-label">Portfolio</span>
          <h2>Nos Réalisations</h2>
          <p>Productions audiovisuelles, films institutionnels et vidéos corporate à Abidjan</p>
        </motion.div>

        {/* Video List - Vertical Stack */}
        <motion.div
          className="av-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {medias.map((media, index) => (
            <VideoCard key={media.id} media={media} index={index} />
          ))}
        </motion.div>

      </motion.div>
    </section>
  )
}
