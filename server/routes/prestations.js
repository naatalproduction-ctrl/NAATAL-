// ============================================
// Routes Prestations
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllPrestations,
  getPrestationById,
  createPrestation,
  updatePrestation,
  deletePrestation,
  getActivePrestations
} = require('../controllers/prestationsController');

// Routes publiques
router.get('/public', getActivePrestations);

// Routes protégées (admin)
router.get('/', authenticateToken, getAllPrestations);
router.get('/:id', authenticateToken, getPrestationById);
router.post('/', authenticateToken, createPrestation);
router.put('/:id', authenticateToken, updatePrestation);
router.delete('/:id', authenticateToken, deletePrestation);

module.exports = router;
