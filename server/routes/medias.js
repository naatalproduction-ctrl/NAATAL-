// ============================================
// Routes des Médias
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllMedias,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia
} = require('../controllers/mediasController');

// Routes publiques
router.get('/', getAllMedias);
router.get('/:id', getMediaById);

// Routes protégées (admin)
router.post('/', authMiddleware, createMedia);
router.put('/:id', authMiddleware, updateMedia);
router.delete('/:id', authMiddleware, deleteMedia);

module.exports = router;
