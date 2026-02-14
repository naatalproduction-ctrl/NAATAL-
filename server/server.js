// ============================================
// NAATAL Production - Serveur Backend
// ============================================
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool } = require('./config/database');

// Importer les routes
const authRoutes = require('./routes/auth');
const mediasRoutes = require('./routes/medias');
const messagesRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');
const comptabiliteRoutes = require('./routes/comptabilite');
const projetsRoutes = require('./routes/projets');
const attachmentsRoutes = require('./routes/attachments');
const cinemaRoutes = require('./routes/cinema');
const boutiqueRoutes = require('./routes/boutique');
const uploadsRoutes = require('./routes/uploads');
const storyboardRoutes = require('./routes/storyboard');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log des requêtes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ============================================
// Routes API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/medias', mediasRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comptabilite', comptabiliteRoutes);
app.use('/api/projets', projetsRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/cinema', cinemaRoutes);
app.use('/api/boutique', boutiqueRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/storyboard', storyboardRoutes);

// Route de test
app.get('/api', (req, res) => {
  res.json({ 
    success: true,
    message: 'API NAATAL Production',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      medias: '/api/medias',
      messages: '/api/messages',
      settings: '/api/settings',
      comptabilite: '/api/comptabilite',
      projets: '/api/projets',
      attachments: '/api/attachments',
      cinema: '/api/cinema',
      boutique: '/api/boutique',
      uploads: '/api/uploads',
      storyboard: '/api/storyboard'
    }
  });
});

// Route de santé
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ============================================
// Gestion des erreurs
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({ success: false, error: 'Erreur serveur interne' });
});

// ============================================
// Démarrage du serveur
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║                                            ║');
  console.log('║     🎬 NAATAL Production API Server 🎬     ║');
  console.log('║                                            ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  🚀 Serveur lancé sur le port ${PORT}          ║`);
  console.log(`║  📡 API: http://localhost:${PORT}/api         ║`);
  console.log('║  🔒 Mode: ' + (process.env.NODE_ENV || 'development').padEnd(27) + '  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
