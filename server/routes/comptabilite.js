// ============================================
// Routes de Comptabilité
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStats,
  getCategories
} = require('../controllers/comptabiliteController');

// Toutes les routes sont protégées
router.use(authMiddleware);

// Routes
router.get('/categories', getCategories);
router.get('/stats', getStats);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
