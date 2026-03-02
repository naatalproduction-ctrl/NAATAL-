// ============================================
// NAATAL Production - Serveur Backend
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const partnersRoutes = require('./routes/partners');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy (nginx reverse proxy)
app.set('trust proxy', 1);

// ============================================
// Security Middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' }
});
app.use('/api/', globalLimiter);

// Rate limiting strict sur login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' }
});
app.use('/api/auth/login', authLimiter);

// Rate limiting sur le formulaire de contact
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  message: { success: false, error: 'Trop de messages envoyés, réessayez plus tard' }
});
app.use('/api/messages', contactLimiter);

// Body parsing with safe limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir les fichiers uploades avec headers securises
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'inline');
  }
}));

// Log des requetes (minimal en production)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

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
app.use('/api/partners', partnersRoutes);

// Route de test
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API NAATAL Production',
    version: '1.0.0'
  });
});

// Route de sante
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
      database: 'disconnected'
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
  if (!isProduction) {
    console.error('❌ Erreur:', err);
  }
  res.status(500).json({ success: false, error: 'Erreur serveur interne' });
});

// ============================================
// Graceful shutdown
// ============================================
const server = app.listen(PORT, () => {
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

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      // silent
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  if (!isProduction) console.error('Unhandled Rejection:', reason);
});

module.exports = app;
