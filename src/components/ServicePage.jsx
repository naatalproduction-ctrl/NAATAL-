import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound'
import { BUSINESS, PROCESS, SERVICE_PAGES, VIDEO_DESCRIPTIONS } from '../data/site'
import './ServicePage.css'

export default function ServicePage() {
  const { slug } = useParams()
  const service = SERVICE_PAGES.find(item => item.slug === slug)

  if (!service) return <NotFound />

  const others = SERVICE_PAGES.filter(item => item.slug !== slug)

  return (
    <main className="service-page">
      <nav className="service-breadcrumb" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link>
        <span aria-hidden="true">/</span>
        <Link to="/#prestations">Prestations</Link>
        <span aria-hidden="true">/</span>
        <span>{service.name}</span>
      </nav>

      <header className="service-hero">
        <h1>{service.h1}</h1>
        {service.intro.map(text => <p key={text}>{text}</p>)}
        <div className="service-actions">
          <a href={BUSINESS.whatsappLink} target="_blank" rel="noopener noreferrer" className="service-cta">
            Demander un devis sur WhatsApp
          </a>
          <Link to="/#contact" className="service-link">Nous écrire</Link>
        </div>
      </header>

      <section className="service-section service-columns">
        <div>
          <h2>Ce qui est inclus</h2>
          <ul>{service.includes.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h2>Pour qui ?</h2>
          <ul>{service.audience.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      {service.videoId && (
        <section className="service-section">
          <h2>Exemple de réalisation</h2>
          <a
            className="service-video"
            href={`https://www.youtube.com/watch?v=${service.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={`https://i.ytimg.com/vi/${service.videoId}/hqdefault.jpg`}
              alt={`Réalisation NAATAL Studio : ${service.name}`}
              width="480"
              height="360"
              loading="lazy"
            />
            <span>{VIDEO_DESCRIPTIONS[service.videoId]}</span>
          </a>
        </section>
      )}

      <section className="service-section">
        <h2>Comment se déroule votre projet</h2>
        <ol className="service-process">
          {PROCESS.map(step => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="service-section">
        <h2>Questions fréquentes</h2>
        <div className="service-faq">
          {service.faq.map(item => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="service-section">
        <h2>Nos autres services à Abidjan</h2>
        <ul className="service-others">
          {others.map(item => (
            <li key={item.slug}>
              <Link to={`/services/${item.slug}`}>{item.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
