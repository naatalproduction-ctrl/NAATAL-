// ============================================
// Routes des Paramètres
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  getPublicSiteInfo
} = require('../controllers/settingsController');

// Routes publiques
router.get('/public', getPublicSiteInfo);

// Routes protégées (admin)
router.get('/', authMiddleware, getAllSettings);
router.get('/:key', authMiddleware, getSettingByKey);
router.put('/:key', authMiddleware, updateSetting);
router.put('/', authMiddleware, updateMultipleSettings);

module.exports = router;
