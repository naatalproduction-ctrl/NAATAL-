// ============================================
// Routes d'Authentification
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware, superAdminMiddleware } = require('../middleware/auth');
const {
  login,
  verifyToken,
  changePassword,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin
} = require('../controllers/authController');

// Routes publiques
router.post('/login', login);

// Routes protégées
router.get('/verify', authMiddleware, verifyToken);
router.post('/change-password', authMiddleware, changePassword);

// Routes de gestion des utilisateurs (superadmin uniquement)
router.get('/users', authMiddleware, superAdminMiddleware, getAllAdmins);
router.post('/users', authMiddleware, superAdminMiddleware, createAdmin);
router.put('/users/:id', authMiddleware, superAdminMiddleware, updateAdmin);
router.delete('/users/:id', authMiddleware, superAdminMiddleware, deleteAdmin);

module.exports = router;
