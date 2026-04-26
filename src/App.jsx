import { Component, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { SiteProvider } from './context/SiteContext'
import Header from './components/Header'
import APropos from './components/APropos'
import Audiovisuel from './components/Audiovisuel'
import Prestations from './components/Prestations'
import Cinema from './components/Cinema'
import Boutique from './components/Boutique'
import Partners from './components/Partners'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Admin from './components/Admin'
import Offres from './components/Offres'
import FAQ from './components/FAQ'
import WhatsAppCTA from './components/WhatsAppCTA'
import './App.css'

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
  const isAdminPage = location.pathname === '/admin'

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
      {!isAdminPage && <Header />}
      <Routes>
        <Route path="/" element={
          <>
            <APropos />
            <Prestations />
            <Audiovisuel />
            <Offres />
            <Partners />
            <FAQ />
            <Contact />
          </>
        } />
        <Route path="/boutique" element={<Boutique />} />
        <Route path="/cinema" element={<Cinema />} />
        <Route path="/offres" element={<Offres />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
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
