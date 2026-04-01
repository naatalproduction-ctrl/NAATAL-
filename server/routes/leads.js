// ============================================
// Routes Leads Power
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadsStats
} = require('../controllers/leadsController');

// Route publique (formulaire du site)
router.post('/', createLead);

// Routes protégées (admin)
router.get('/', authMiddleware, getAllLeads);
router.get('/stats', authMiddleware, getLeadsStats);
router.get('/:id', authMiddleware, getLeadById);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);

module.exports = router;
