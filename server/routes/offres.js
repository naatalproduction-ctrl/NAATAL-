// ============================================
// Routes Offres
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllOffres,
  getOffreById,
  createOffre,
  updateOffre,
  deleteOffre,
  getActiveOffres
} = require('../controllers/offresController');

// Routes publiques
router.get('/public', getActiveOffres);

// Routes protegees (admin)
router.get('/', authenticateToken, getAllOffres);
router.get('/:id', authenticateToken, getOffreById);
router.post('/', authenticateToken, createOffre);
router.put('/:id', authenticateToken, updateOffre);
router.delete('/:id', authenticateToken, deleteOffre);

module.exports = router;
