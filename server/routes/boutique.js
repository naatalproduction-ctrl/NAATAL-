// ============================================
// Routes Boutique
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllBoutiqueItems,
  getBoutiqueItemById,
  createBoutiqueItem,
  updateBoutiqueItem,
  deleteBoutiqueItem,
  getActiveBoutiqueItems
} = require('../controllers/boutiqueController');

// Routes publiques
router.get('/public', getActiveBoutiqueItems);

// Routes protégées (admin)
router.get('/', authenticateToken, getAllBoutiqueItems);
router.get('/:id', authenticateToken, getBoutiqueItemById);
router.post('/', authenticateToken, createBoutiqueItem);
router.put('/:id', authenticateToken, updateBoutiqueItem);
router.delete('/:id', authenticateToken, deleteBoutiqueItem);

module.exports = router;
