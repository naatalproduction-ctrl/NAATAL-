import { Component, Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SiteProvider, useSite } from './context/SiteContext'
import Header from './components/Header'
import APropos from './components/APropos'
import Audiovisuel from './components/Audiovisuel'
import Prestations from './components/Prestations'
import Partners from './components/Partners'
import Contact from './components/Contact'
import Footer from './components/Footer'
import FAQ from './components/FAQ'
import WhatsAppCTA from './components/WhatsAppCTA'
import RouteMeta from './components/RouteMeta'
import NotFound from './components/NotFound'
import './App.css'

const Admin = lazy(() => import('./components/Admin'))
const Boutique = lazy(() => import('./components/Boutique'))
const Cinema = lazy(() => import('./components/Cinema'))
const Offres = lazy(() => import('./components/Offres'))
const ServicePage = lazy(() => import('./components/ServicePage'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          color: '#fff',
          background: '#1a1a1a',
          minHeight: '100vh',
          fontFamily: 'monospace',
        }}>
          <h2 style={{ color: '#ff6b6b' }}>Une erreur est survenue</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ccc', marginTop: 16 }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation()
  const { siteInfo, loading } = useSite()
  const isAdminPage = location.pathname === '/admin'
  const offresEnabled = siteInfo.offresEnabled === true
  const hiddenOffresRoute = loading ? null : <Navigate to="/" replace />

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const el = document.querySelector(location.hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    }
  }, [location])

  return (
    <div className="app">
      <RouteMeta />
      {!isAdminPage && <Header />}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={
            <>
              <APropos />
              <Prestations />
              <Audiovisuel />
              {offresEnabled && <Suspense fallback={null}><Offres /></Suspense>}
              <Partners />
              <FAQ />
              <Contact />
            </>
          } />
          <Route path="/boutique" element={<Boutique />} />
          <Route path="/cinema" element={<Cinema />} />
          <Route path="/offres" element={offresEnabled ? <Offres /> : hiddenOffresRoute} />
          <Route path="/services/:slug" element={<ServicePage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <WhatsAppCTA />}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <SiteProvider>
        <Router>
          <AppContent />
        </Router>
      </SiteProvider>
    </ErrorBoundary>
  )
}

export default App
