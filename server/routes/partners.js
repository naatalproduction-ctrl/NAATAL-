// ============================================
// Routes Partenaires
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getActivePartners,
  getAllPartners,
  createPartner,
  updatePartner,
  deletePartner
} = require('../controllers/partnersController');

// Public
router.get('/public', getActivePartners);

// Admin
router.get('/', authenticateToken, getAllPartners);
router.post('/', authenticateToken, createPartner);
router.put('/:id', authenticateToken, updatePartner);
router.delete('/:id', authenticateToken, deletePartner);

module.exports = router;
