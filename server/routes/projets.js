// ============================================
// Routes des Projets
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getOptions,
  getStats,
  getAllProjets,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet
} = require('../controllers/projetsController');

// Toutes les routes sont protégées
router.use(authMiddleware);

// Routes
router.get('/options', getOptions);
router.get('/stats', getStats);
router.get('/', getAllProjets);
router.get('/:id', getProjetById);
router.post('/', createProjet);
router.put('/:id', updateProjet);
router.delete('/:id', deleteProjet);

module.exports = router;
