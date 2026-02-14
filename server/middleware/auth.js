// ============================================
// Middleware d'authentification
// ============================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'REDACTED';

// Vérifier si l'utilisateur est authentifié
const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token du header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token d\'authentification manquant' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expiré' });
    }
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

// Vérifier si l'utilisateur est superadmin
const superAdminMiddleware = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès réservé aux super administrateurs' 
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  authenticateToken: authMiddleware, // Alias for backwards compatibility
  superAdminMiddleware
};
