// ============================================
// Routes Cinéma
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllCinemaItems,
  getCinemaItemById,
  createCinemaItem,
  updateCinemaItem,
  deleteCinemaItem,
  getPublishedCinemaItems
} = require('../controllers/cinemaController');

// Routes publiques
router.get('/public', getPublishedCinemaItems);

// Routes protégées (admin)
router.get('/', authenticateToken, getAllCinemaItems);
router.get('/:id', authenticateToken, getCinemaItemById);
router.post('/', authenticateToken, createCinemaItem);
router.put('/:id', authenticateToken, updateCinemaItem);
router.delete('/:id', authenticateToken, deleteCinemaItem);

module.exports = router;
