// ============================================
// Routes Prospection
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  scrapeGoogleMaps,
  searchGoogle,
  saveProspect,
  saveMultipleProspects,
  getAllProspects,
  updateProspect,
  deleteProspect,
  getProspectsStats,
  convertToLead
} = require('../controllers/prospectsController');

// Toutes les routes sont protégées
router.use(authMiddleware);

router.post('/search', scrapeGoogleMaps);
router.post('/search/google', searchGoogle);
router.post('/', saveProspect);
router.post('/bulk', saveMultipleProspects);
router.get('/', getAllProspects);
router.get('/stats', getProspectsStats);
router.put('/:id', updateProspect);
router.delete('/:id', deleteProspect);
router.post('/:id/convert', convertToLead);

module.exports = router;
